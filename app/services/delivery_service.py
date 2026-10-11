"""
app/services/delivery_service.py
==================================
Business logic for the full delivery lifecycle.

Delivery Lifecycle:
    pending → assigned → picked_up → out_for_delivery → delivered
    (any non-terminal) → failed

Key responsibilities:
  1. create_delivery   – Called internally when order is accepted.
                         Tries to auto-assign the nearest available partner.
  2. assign_partner    – Manual / re-try assignment (admin or system).
  3. update_status     – Partner advances through the lifecycle.
                         - moving to out_for_delivery generates + hashes an OTP.
  4. verify_otp        - Final delivery step: validate delivery OTP + geofence.
  5. get_delivery      – Fetch delivery detail (any authenticated user).
  6. list_assigned     – Partner's active/historical delivery list.

OTP flow:
  • Generated when status → out_for_delivery.
  • Plain OTP returned once in DeliveryOTPOut (partner relays to customer).
  • Stored as bcrypt hash in deliveries.otp_code.
  • Expires in DELIVERY_OTP_EXPIRY_MINUTES.
  • Verification: constant-time bcrypt compare + expiry check.
  • On success: OTP fields are cleared from DB.

Geofence:
  • Required when verifying OTP.
  • Partner's current_latitude/longitude compared to delivery's
    destination_latitude/destination_longitude using Haversine formula.
  • If distance > DELIVERY_GEOFENCE_RADIUS_METERS → rejected.
  • If destination not set on delivery → check skipped with a warning
    (configurable; currently skips to avoid blocking dev environments).

Assignment strategy:
  • collect all available+active partners
  • if any have coordinates AND order has a destination → pick closest
  • else pick first by id (FIFO)
  • if none available → delivery stays pending (SLA is tracked via created_at)
"""

import math
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    DeliveryAlreadyExistsError,
    DeliveryForbiddenError,
    DeliveryInvalidStatusTransitionError,
    DeliveryNotFoundError,
    DeliveryOTPExpiredError,
    DeliveryOTPInvalidError,
    DeliveryOTPNotReadyError,
    DeliveryOutsideGeofenceError,
    DeliveryPartnerNotFoundError,
    NoDeliveryPartnerAvailableError,
    OrderNotFoundError,
    PermissionDeniedError,
)
from app.core.geolocation import haversine_distance, is_within_radius
from app.core.security import generate_delivery_otp, hash_delivery_otp, verify_delivery_otp
from app.models.delivery import (
    DELIVERY_TRANSITIONS,
    Delivery,
    DeliveryPartner,
    DeliveryStatus,
)
from app.models.user import User, UserRole
from app.repositories.delivery_partner_repository import DeliveryPartnerRepository
from app.repositories.delivery_repository import DeliveryRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.delivery import (
    DeliveryOut,
    DeliveryOTPOut,
    DeliveryStatusOut,
    PaginatedDeliveriesOut,
    PaginatedAvailableDeliveriesOut,
    DeliveryCustomerOut,
    DeliveryFarmerOut,
    DeliveryPartnerMinimalOut,
)
from app.services.payment_service import PaymentService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# OTP brute-force guard
# ---------------------------------------------------------------------------
# In-memory, per-process counter of failed verify-otp attempts per delivery.
# It bounds guessing of the 6-digit code to a handful of tries per worker within
# the OTP lifetime.  Known limitation: counters are not shared across workers or
# restarts; a DB-backed counter is the production upgrade (see docs/KNOWN_LIMITATIONS.md).
_OTP_MAX_FAILURES = 5
_otp_failures: dict[int, list[float]] = {}


def _otp_window_seconds() -> float:
    return float(settings.DELIVERY_OTP_EXPIRY_MINUTES) * 60.0


def _otp_prune(delivery_id: int) -> list[float]:
    import time

    cutoff = time.monotonic() - _otp_window_seconds()
    recent = [t for t in _otp_failures.get(delivery_id, []) if t >= cutoff]
    if recent:
        _otp_failures[delivery_id] = recent
    else:
        _otp_failures.pop(delivery_id, None)
    return recent


def _otp_attempts_exceeded(delivery_id: int) -> bool:
    return len(_otp_prune(delivery_id)) >= _OTP_MAX_FAILURES


def _otp_record_failure(delivery_id: int) -> None:
    import time

    _otp_prune(delivery_id)
    _otp_failures.setdefault(delivery_id, []).append(time.monotonic())


def _otp_reset(delivery_id: int) -> None:
    _otp_failures.pop(delivery_id, None)


def _delivery_to_out(delivery: Delivery) -> DeliveryOut:
    order = delivery.order
    customer = order.customer if order else None
    farmer = order.farmer if order else None

    # Resolve customer address string (e.g. flat, building, street, city, state, pincode)
    cust_addr_str = None
    if customer and customer.addresses:
        # Find default or first address
        addr = next((a for a in customer.addresses if a.is_default), customer.addresses[0])
        parts = [addr.house_flat, addr.building, addr.street, addr.area, addr.landmark, addr.city, addr.state, addr.pin_code]
        cust_addr_str = ", ".join([p for p in parts if p])

    cust_out = None
    if customer:
        cust_out = DeliveryCustomerOut(
            id=customer.id,
            name=customer.name,
            phone=customer.phone,
            address=cust_addr_str,
        )

    farm_out = None
    if farmer:
        farm_lat = None
        farm_lon = None
        if farmer.user and farmer.user.addresses:
            addr = next((a for a in farmer.user.addresses if a.is_default), farmer.user.addresses[0])
            farm_lat = addr.latitude
            farm_lon = addr.longitude

        farm_out = DeliveryFarmerOut(
            id=farmer.id,
            full_name=farmer.full_name,
            phone=farmer.phone,
            location=farmer.location,
            latitude=farm_lat,
            longitude=farm_lon,
        )

    partner_out = None
    if delivery.delivery_partner:
        partner_out = DeliveryPartnerMinimalOut(
            id=delivery.delivery_partner.id,
            full_name=delivery.delivery_partner.full_name,
            phone=delivery.delivery_partner.phone,
        )

    return DeliveryOut(
        id=delivery.id,
        order_id=delivery.order_id,
        delivery_partner_id=delivery.delivery_partner_id,
        status=delivery.status,
        destination_latitude=delivery.destination_latitude,
        destination_longitude=delivery.destination_longitude,
        assigned_at=delivery.assigned_at.isoformat() if delivery.assigned_at else None,
        picked_up_at=delivery.picked_up_at.isoformat() if delivery.picked_up_at else None,
        delivered_at=delivery.delivered_at.isoformat() if delivery.delivered_at else None,
        created_at=delivery.created_at.isoformat(),
        customer=cust_out,
        farmer=farm_out,
        delivery_partner=partner_out,
    )


def _pick_closest_partner(
    partners: list[DeliveryPartner],
    dest_lat: float,
    dest_lon: float,
) -> DeliveryPartner:
    """
    From a list of available partners, return the one closest to the
    delivery destination.  Partners without coordinates are ranked last.
    """
    def sort_key(p: DeliveryPartner) -> float:
        if p.current_latitude is None or p.current_longitude is None:
            return float("inf")
        return haversine_distance(
            p.current_latitude, p.current_longitude,
            dest_lat, dest_lon,
        )

    return min(partners, key=sort_key)


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class DeliveryService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._delivery_repo = DeliveryRepository(db)
        self._partner_repo = DeliveryPartnerRepository(db)
        self._order_repo = OrderRepository(db)

    # ------------------------------------------------------------------
    # 1. Create delivery record (triggered when order is accepted)
    # ------------------------------------------------------------------

    async def create_delivery(
        self,
        *,
        order_id: int,
        destination_latitude: float | None = None,
        destination_longitude: float | None = None,
    ) -> DeliveryOut:
        """
        Create a delivery record for an accepted order and attempt
        auto-assignment of the closest available partner.

        Raises:
            OrderNotFoundError        – order does not exist
            DeliveryAlreadyExistsError – delivery already created for this order
        """
        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError(f"Order {order_id} not found.")

        # Guard against double-creation (idempotency)
        existing = await self._delivery_repo.get_by_order_id(order_id)
        if existing is not None:
            raise DeliveryAlreadyExistsError()

        delivery = await self._delivery_repo.create(
            order_id=order_id,
            destination_latitude=destination_latitude,
            destination_longitude=destination_longitude,
        )

        # Attempt auto-assignment
        await self._try_auto_assign(delivery, destination_latitude, destination_longitude)

        # Re-fetch to get the latest state
        delivery = await self._delivery_repo.get_by_id(delivery.id)
        return _delivery_to_out(delivery)

    # ------------------------------------------------------------------
    # 2. Manual assign / re-assign partner (admin / system)
    # ------------------------------------------------------------------

    async def assign_partner(
        self,
        *,
        delivery_id: int,
        requesting_user: User,
    ) -> DeliveryOut:
        """
        Attempt to assign the best available delivery partner to a pending
        delivery.  Usable by admins to retry after SLA timeout.

        Raises:
            PermissionDeniedError              – caller is not admin
            DeliveryNotFoundError              – delivery not found
            DeliveryInvalidStatusTransitionError – delivery not in pending state
            NoDeliveryPartnerAvailableError    – no partners available
        """
        if requesting_user.role != UserRole.admin:
            raise PermissionDeniedError("Only admins can manually assign delivery partners.")

        delivery = await self._delivery_repo.get_by_id(delivery_id)
        if delivery is None:
            raise DeliveryNotFoundError()

        if delivery.status != DeliveryStatus.pending:
            raise DeliveryInvalidStatusTransitionError(
                f"Delivery is already in '{delivery.status.value}' state and cannot be re-assigned."
            )

        assigned = await self._try_auto_assign(
            delivery,
            delivery.destination_latitude,
            delivery.destination_longitude,
        )
        if not assigned:
            raise NoDeliveryPartnerAvailableError()

        delivery = await self._delivery_repo.get_by_id(delivery_id)
        return _delivery_to_out(delivery)

    # ------------------------------------------------------------------
    # 3. Update delivery status
    # ------------------------------------------------------------------

    async def update_status(
        self,
        *,
        delivery_id: int,
        requesting_user: User,
        new_status: DeliveryStatus,
        destination_latitude: float | None = None,
        destination_longitude: float | None = None,
    ) -> DeliveryStatusOut | DeliveryOTPOut:
        """
        Partner advances the delivery through the lifecycle.

        Special case – moving to out_for_delivery:
          Generates a fresh OTP, hashes it, stores hash in DB, and returns
          the plain OTP in DeliveryOTPOut (returned exactly once to the caller).

        Raises:
            PermissionDeniedError              – caller is not delivery role
            DeliveryPartnerNotFoundError       – no partner profile
            DeliveryNotFoundError              – delivery not found
            DeliveryForbiddenError             – not the assigned partner
            DeliveryInvalidStatusTransitionError – illegal transition
        """
        partner = await self._get_partner_for_user(requesting_user)

        delivery = await self._delivery_repo.get_by_id(delivery_id)
        if delivery is None:
            raise DeliveryNotFoundError()

        if delivery.delivery_partner_id != partner.id:
            raise DeliveryForbiddenError()

        self._assert_transition(delivery, new_status)

        now = _utc_now()
        kwargs: dict = {}

        # ----------------------------------------------------------------
        # Persist updated destination coordinates if provided by partner
        # (e.g., when they confirm the dropoff point)
        # ----------------------------------------------------------------
        if destination_latitude is not None and destination_longitude is not None:
            delivery.destination_latitude = destination_latitude
            delivery.destination_longitude = destination_longitude

        # ----------------------------------------------------------------
        # Lifecycle timestamp bookkeeping
        # ----------------------------------------------------------------
        if new_status == DeliveryStatus.picked_up:
            kwargs["picked_up_at"] = now

        # ----------------------------------------------------------------
        # OTP generation when moving to out_for_delivery
        # ----------------------------------------------------------------
        if new_status == DeliveryStatus.out_for_delivery:
            plain_otp = generate_delivery_otp()
            otp_expires_at = now + timedelta(minutes=settings.DELIVERY_OTP_EXPIRY_MINUTES)
            kwargs["otp_code"] = hash_delivery_otp(plain_otp)
            kwargs["plain_otp"] = plain_otp
            kwargs["otp_expires_at"] = otp_expires_at

            delivery = await self._delivery_repo.set_status(
                delivery, new_status, **kwargs
            )
            # Sync order status to out_for_delivery
            from app.models.order import OrderStatus
            order = await self._order_repo.get_by_id(delivery.order_id)
            if order:
                await self._order_repo.set_status(order, OrderStatus.out_for_delivery)

            # The OTP is a customer-held secret: it is shown to the customer on
            # their order (OrderOut.delivery.otp) and typed in by the partner at
            # the doorstep.  It is never returned to the partner here.
            return DeliveryStatusOut(
                id=delivery.id,
                status=delivery.status,
                message="Out for delivery. Ask the customer for the 6-digit code shown in their app.",
            )

        delivery = await self._delivery_repo.set_status(delivery, new_status, **kwargs)
        # Sync order status to picked_up or cancelled (if failed)
        from app.models.order import OrderStatus
        order = await self._order_repo.get_by_id(delivery.order_id)
        if order:
            if new_status == DeliveryStatus.picked_up:
                await self._order_repo.set_status(order, OrderStatus.picked_up)
            elif new_status == DeliveryStatus.failed:
                await self._order_repo.set_status(order, OrderStatus.cancelled)

        return DeliveryStatusOut(
            id=delivery.id,
            status=delivery.status,
            message=f"Delivery status updated to '{delivery.status.value}'.",
        )

    # ------------------------------------------------------------------
    # 4. Verify OTP → mark delivered
    # ------------------------------------------------------------------

    async def verify_otp(
        self,
        *,
        delivery_id: int,
        requesting_user: User,
        otp: str,
        partner_latitude: float,
        partner_longitude: float,
    ) -> DeliveryStatusOut:
        """
        Finalize a delivery by verifying the customer-provided OTP and
        checking the partner is within the allowed geofence.

        Steps:
          1. Authenticate caller as the assigned delivery partner.
          2. Assert delivery is in 'out_for_delivery' state.
          3. Check OTP has not expired.
          4. Geofence check (only if destination coordinates are set).
          5. bcrypt-verify OTP.
          6. Mark as delivered, clear OTP, record delivered_at.

        Raises:
            PermissionDeniedError        – caller not delivery role
            DeliveryPartnerNotFoundError – no partner profile
            DeliveryNotFoundError        – delivery not found
            DeliveryForbiddenError       – not the assigned partner
            DeliveryOTPNotReadyError     – not in out_for_delivery state
            DeliveryOTPExpiredError      – OTP past expiry
            DeliveryOutsideGeofenceError – partner too far from destination
            DeliveryOTPInvalidError      – wrong OTP
        """
        partner = await self._get_partner_for_user(requesting_user)

        delivery = await self._delivery_repo.get_by_id(delivery_id)
        if delivery is None:
            raise DeliveryNotFoundError()

        if delivery.delivery_partner_id != partner.id:
            raise DeliveryForbiddenError()

        # Must be in the correct state for OTP verification
        if delivery.status != DeliveryStatus.out_for_delivery:
            raise DeliveryOTPNotReadyError()

        # OTP expiry check
        now = _utc_now()
        if delivery.otp_expires_at is None or now > delivery.otp_expires_at:
            raise DeliveryOTPExpiredError()

        # Geofence check — only enforced when destination coords are available
        if (
            delivery.destination_latitude is not None
            and delivery.destination_longitude is not None
        ):
            within = is_within_radius(
                partner_latitude,
                partner_longitude,
                delivery.destination_latitude,
                delivery.destination_longitude,
                settings.DELIVERY_GEOFENCE_RADIUS_METERS,
            )
            if not within:
                raise DeliveryOutsideGeofenceError()

        # Brute-force guard: a 6-digit code must not be guessable in the window.
        if _otp_attempts_exceeded(delivery.id):
            raise DeliveryOTPInvalidError(
                "Too many incorrect attempts. Ask the customer to confirm the code, then wait a few minutes."
            )

        # Cryptographic OTP verification (constant-time bcrypt)
        if not verify_delivery_otp(otp, delivery.otp_code):
            _otp_record_failure(delivery.id)
            raise DeliveryOTPInvalidError()
        _otp_reset(delivery.id)

        # Transition to delivered
        delivery = await self._delivery_repo.set_status(
            delivery,
            DeliveryStatus.delivered,
            delivered_at=now,
        )
        await self._delivery_repo.clear_otp(delivery)

        # ----------------------------------------------------------------
        # Escrow release and order completion — automatically triggered on successful delivery.
        # If no payment exists (e.g. dev/test without payment flow) this
        # is a silent no-op; any payment gateway error is logged but does
        # NOT block the delivery confirmation response.
        # ----------------------------------------------------------------
        try:
            from app.models.order import OrderStatus
            order = await self._order_repo.get_by_id(delivery.order_id)
            if order:
                await self._order_repo.set_status(order, OrderStatus.completed)
        except Exception as e:
            print(f"Warning: Failed to update order status to completed: {e}")

        try:
            payment_svc = PaymentService(self._db)
            await payment_svc.release_escrow(order_id=delivery.order_id)
        except Exception:  # noqa: BLE001
            # Do not surface payment errors to the delivery partner.
            # A background job / admin alert should handle release retries.
            pass

        return DeliveryStatusOut(
            id=delivery.id,
            status=delivery.status,
            message="Delivery completed and verified successfully.",
        )

    # ------------------------------------------------------------------
    # 5. Get delivery detail
    # ------------------------------------------------------------------

    async def get_delivery(
        self,
        *,
        delivery_id: int,
        requesting_user: User,
    ) -> DeliveryOut:
        """
        Return full delivery details.

        Access: authenticated users (partner, farmer, customer, admin).
        Farmers and customers can check the delivery status of their order.
        """
        delivery = await self._delivery_repo.get_by_id(delivery_id)
        if delivery is None:
            raise DeliveryNotFoundError()

        self._assert_can_view_delivery(delivery, requesting_user)
        return _delivery_to_out(delivery)

    async def get_delivery_by_order(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> DeliveryOut:
        """Fetch delivery by order_id (convenience for customers/farmers)."""
        delivery = await self._delivery_repo.get_by_order_id(order_id)
        if delivery is None:
            raise DeliveryNotFoundError(
                f"No delivery record found for order {order_id}."
            )

        self._assert_can_view_delivery(delivery, requesting_user)
        return _delivery_to_out(delivery)

    def _assert_can_view_delivery(self, delivery: Delivery, user: User) -> None:
        """Assert user has permission to view this delivery."""
        if user.role == UserRole.admin:
            return
        if user.role == UserRole.delivery:
            if delivery.delivery_partner and delivery.delivery_partner.user_id == user.id:
                return
        elif user.role == UserRole.customer:
            if delivery.order and delivery.order.customer_id == user.id:
                return
        elif user.role == UserRole.farmer:
            if delivery.order and delivery.order.farmer and delivery.order.farmer.user_id == user.id:
                return
        raise DeliveryForbiddenError("You are not authorized to view this delivery.")

    # ------------------------------------------------------------------
    # 6. List partner's assigned deliveries
    # ------------------------------------------------------------------

    async def list_my_deliveries(
        self,
        *,
        requesting_user: User,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedDeliveriesOut:
        """
        Return a paginated list of deliveries assigned to the authenticated
        delivery partner.

        Raises:
            PermissionDeniedError          – wrong role
            DeliveryPartnerNotFoundError   – no profile
        """
        partner = await self._get_partner_for_user(requesting_user)

        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        deliveries = await self._delivery_repo.list_for_partner(
            partner.id, offset=offset, limit=page_size
        )
        total = await self._delivery_repo.count_for_partner(partner.id)
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedDeliveriesOut(
            items=[_delivery_to_out(d) for d in deliveries],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 7. List available nearby unassigned deliveries (25 KM Smart Discovery)
    # ------------------------------------------------------------------

    async def list_available_deliveries(
        self,
        *,
        requesting_user: User,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedAvailableDeliveriesOut:
        """
        Return a list of unassigned pending deliveries eligible for this partner
        within a 25 km geographic radius.

        Eligibility Rules:
          - Caller must be an active & approved delivery partner on duty (is_available=True).
          - Caller must NOT have an active delivery run in progress.
          - Farm pickup or customer destination must be within 25.0 km of the partner's GPS location.
        """
        from app.core.geolocation import haversine_distance_km
        from app.schemas.delivery import (
            AvailableDeliveryOut,
            PaginatedAvailableDeliveriesOut,
            DeliveryCustomerOut,
            DeliveryFarmerOut,
        )

        partner = await self._get_partner_for_user(requesting_user)

        # If offline, return empty list
        if not partner.is_available or not partner.is_active:
            return PaginatedAvailableDeliveriesOut(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
                partner_latitude=partner.current_latitude,
                partner_longitude=partner.current_longitude,
                matching_radius_km=25.0,
            )

        # Check if already busy with an active run
        active_delivery = await self._delivery_repo.get_active_delivery_for_partner(partner.id)
        if active_delivery is not None:
            # Busy partners cannot browse or claim additional runs
            return PaginatedAvailableDeliveriesOut(
                items=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0,
                partner_latitude=partner.current_latitude,
                partner_longitude=partner.current_longitude,
                matching_radius_km=25.0,
            )

        unassigned = await self._delivery_repo.list_unassigned_pending_deliveries(limit=100)

        partner_lat = partner.current_latitude
        partner_lon = partner.current_longitude

        eligible_items = []
        for delivery in unassigned:
            order = delivery.order
            if not order or order.status not in ["accepted", "packing", "ready_for_pickup", "pending"]:
                continue

            customer = order.customer
            farmer = order.farmer

            # Farm coordinates
            farm_lat = None
            farm_lon = None
            if farmer and farmer.user and farmer.user.addresses:
                addr = next((a for a in farmer.user.addresses if a.is_default), farmer.user.addresses[0])
                farm_lat = addr.latitude
                farm_lon = addr.longitude

            # Customer coordinates
            cust_lat = delivery.destination_latitude
            cust_lon = delivery.destination_longitude
            if cust_lat is None and customer and customer.addresses:
                addr = next((a for a in customer.addresses if a.is_default), customer.addresses[0])
                cust_lat = addr.latitude
                cust_lon = addr.longitude

            # Calculate distances
            distance_to_farm = None
            if partner_lat is not None and partner_lon is not None and farm_lat is not None and farm_lon is not None:
                try:
                    distance_to_farm = haversine_distance_km(partner_lat, partner_lon, farm_lat, farm_lon)
                except Exception:
                    distance_to_farm = None

            distance_to_cust = None
            if farm_lat is not None and farm_lon is not None and cust_lat is not None and cust_lon is not None:
                try:
                    distance_to_cust = haversine_distance_km(farm_lat, farm_lon, cust_lat, cust_lon)
                except Exception:
                    distance_to_cust = None
            elif partner_lat is not None and partner_lon is not None and cust_lat is not None and cust_lon is not None:
                try:
                    distance_to_cust = haversine_distance_km(partner_lat, partner_lon, cust_lat, cust_lon)
                except Exception:
                    distance_to_cust = None

            # 25 KM Radius Filtering Decision:
            # 1. If partner & farm coordinates exist: distance_to_farm <= 25.0 km
            # 2. If farm has no coords but customer has coords: distance(partner, customer) <= 25.0 km
            # 3. If partner has no coords: include as fallback
            is_eligible = True
            if partner_lat is not None and partner_lon is not None:
                if distance_to_farm is not None:
                    is_eligible = (distance_to_farm <= 25.0)
                elif distance_to_cust is not None:
                    is_eligible = (distance_to_cust <= 25.0)

            if is_eligible:
                # Format customer & farmer outs
                cust_addr_str = None
                if customer and customer.addresses:
                    addr = next((a for a in customer.addresses if a.is_default), customer.addresses[0])
                    parts = [addr.house_flat, addr.building, addr.street, addr.area, addr.landmark, addr.city, addr.state, addr.pin_code]
                    cust_addr_str = ", ".join([p for p in parts if p])

                cust_out = DeliveryCustomerOut(
                    id=customer.id,
                    name=customer.name,
                    phone=customer.phone,
                    address=cust_addr_str,
                ) if customer else None

                farm_out = DeliveryFarmerOut(
                    id=farmer.id,
                    full_name=farmer.full_name,
                    phone=farmer.phone,
                    location=farmer.location,
                    latitude=farm_lat,
                    longitude=farm_lon,
                ) if farmer else None

                item_count = sum(item.quantity for item in order.items) if order.items else 1

                eligible_items.append(
                    AvailableDeliveryOut(
                        id=delivery.id,
                        order_id=delivery.order_id,
                        status=delivery.status,
                        total_amount=float(order.total_amount),
                        item_count=item_count,
                        distance_to_farm_km=distance_to_farm,
                        distance_to_customer_km=distance_to_cust,
                        estimated_earnings=40.0,
                        created_at=delivery.created_at.isoformat(),
                        customer=cust_out,
                        farmer=farm_out,
                    )
                )

        # Sort closest pickup first
        eligible_items.sort(key=lambda x: (x.distance_to_farm_km if x.distance_to_farm_km is not None else float("inf")))

        # Pagination
        total = len(eligible_items)
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        total_pages = math.ceil(total / page_size) if total else 0
        start = (page - 1) * page_size
        end = start + page_size
        paged_items = eligible_items[start:end]

        return PaginatedAvailableDeliveriesOut(
            items=paged_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            partner_latitude=partner_lat,
            partner_longitude=partner_lon,
            matching_radius_km=25.0,
        )

    # ------------------------------------------------------------------
    # 8. Claim an eligible delivery (Atomic concurrency locking)
    # ------------------------------------------------------------------

    async def claim_delivery(
        self,
        *,
        delivery_id: int,
        requesting_user: User,
    ) -> DeliveryOut:
        """
        Atomically claim a pending delivery for the authenticated partner.

        Safety Checks:
          - Caller has delivery role & active/approved profile.
          - Partner is on duty (is_available=True).
          - Partner does not already have an active run.
          - Target delivery is in pending state and unassigned.
        """
        from app.core.exceptions import (
            DeliveryBusyError,
            DeliveryNotAvailableError,
            DeliveryPartnerInactiveError,
        )

        partner = await self._get_partner_for_user(requesting_user)
        if not partner.is_active:
            raise DeliveryPartnerInactiveError()
        if not partner.is_available:
            raise PermissionDeniedError("You must go on duty (online) before claiming deliveries.")

        # Guard single active run
        active = await self._delivery_repo.get_active_delivery_for_partner(partner.id)
        if active is not None:
            raise DeliveryBusyError()

        # Atomic claim attempt
        claimed = await self._delivery_repo.atomic_claim_delivery(
            delivery_id=delivery_id,
            partner_id=partner.id,
            assigned_at=_utc_now(),
        )
        if claimed is None:
            raise DeliveryNotAvailableError()

        # Re-fetch with eager loaded relationships
        delivery = await self._delivery_repo.get_by_id(delivery_id)
        return _delivery_to_out(delivery)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_partner_for_user(self, user: User) -> DeliveryPartner:
        """Validate caller is a delivery user with a profile."""
        if user.role != UserRole.delivery:
            raise PermissionDeniedError("Only delivery partners can perform this action.")
        partner = await self._partner_repo.get_by_user_id(user.id)
        if partner is None:
            raise DeliveryPartnerNotFoundError(
                "You do not have a delivery partner profile. Please create one first."
            )
        return partner

    @staticmethod
    def _assert_transition(delivery: Delivery, target: DeliveryStatus) -> None:
        """
        Validate the status transition using the DELIVERY_TRANSITIONS map.

        Raises:
            DeliveryInvalidStatusTransitionError
        """
        allowed = DELIVERY_TRANSITIONS.get(delivery.status, set())
        if target not in allowed:
            raise DeliveryInvalidStatusTransitionError(
                f"Cannot transition delivery from '{delivery.status.value}' "
                f"to '{target.value}'."
            )

    async def _try_auto_assign(
        self,
        delivery: Delivery,
        dest_lat: float | None,
        dest_lon: float | None,
    ) -> bool:
        """
        Attempt to find and assign the best available partner.

        Returns True if a partner was assigned, False if none were available.
        """
        partners = await self._partner_repo.find_all_available()
        if not partners:
            return False

        # Prefer proximity if destination coords are known
        if dest_lat is not None and dest_lon is not None:
            chosen = _pick_closest_partner(partners, dest_lat, dest_lon)
        else:
            chosen = partners[0]  # FIFO fallback

        await self._delivery_repo.assign_partner(
            delivery,
            partner_id=chosen.id,
            assigned_at=_utc_now(),
        )
        return True
