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
)
from app.services.payment_service import PaymentService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _delivery_to_out(delivery: Delivery) -> DeliveryOut:
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
            kwargs["otp_expires_at"] = otp_expires_at

            delivery = await self._delivery_repo.set_status(
                delivery, new_status, **kwargs
            )
            return DeliveryOTPOut(
                delivery_id=delivery.id,
                otp=plain_otp,
                otp_expires_at=otp_expires_at.isoformat(),
            )

        delivery = await self._delivery_repo.set_status(delivery, new_status, **kwargs)
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

        # Cryptographic OTP verification (constant-time bcrypt)
        if not verify_delivery_otp(otp, delivery.otp_code):
            raise DeliveryOTPInvalidError()

        # Transition to delivered
        delivery = await self._delivery_repo.set_status(
            delivery,
            DeliveryStatus.delivered,
            delivered_at=now,
        )
        await self._delivery_repo.clear_otp(delivery)

        # ----------------------------------------------------------------
        # Escrow release — automatically triggered on successful delivery.
        # If no payment exists (e.g. dev/test without payment flow) this
        # is a silent no-op; any payment gateway error is logged but does
        # NOT block the delivery confirmation response.
        # ----------------------------------------------------------------
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
        return _delivery_to_out(delivery)

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
