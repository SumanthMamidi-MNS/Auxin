"""
app/services/order_service.py
==============================
Business logic for the complete order lifecycle.

Lifecycle:
    pending → accepted → completed   (farmer)
    pending → rejected               (farmer)
    pending → cancelled              (customer)

Stock management:
    - Deducted atomically at order creation using conditional UPDATE.
    - Restored atomically on cancel or reject.
    - If any stock deduction fails (race condition), the entire creation
      is aborted: already-deducted stocks are restored and an error is raised.

Cross-farmer guard:
    - All products in a single order must belong to the same farmer.
    - Enforced before any stock writes.
"""

import math
from datetime import date, timedelta, datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    CrossFarmerOrderError,
    EmptyOrderError,
    FarmerNotFoundError,
    InsufficientStockError,
    OrderCannotBeCancelledError,
    OrderForbiddenError,
    OrderInvalidStatusTransitionError,
    OrderNotFoundError,
    PermissionDeniedError,
    ProductInactiveError,
    ProductNotFoundError,
)
from app.models.order import (
    ALLOWED_TRANSITIONS,
    Order,
    OrderItem,
    OrderStatus,
)
from app.models.user import User, UserRole
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.order import (
    CartItemRequest,
    OrderOut,
    OrderItemOut,
    OrderStatusOut,
    PaginatedOrdersOut,
    OrderDeliveryOut,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _expiry_cutoff() -> date:
    return date.today() - timedelta(days=settings.PRODUCT_EXPIRY_DAYS)


def _order_to_out(order: Order, expose_otp: bool = False) -> OrderOut:
    from app.models.delivery import DeliveryStatus
    from app.schemas.order import OrderDeliveryPartnerOut
    from app.services.eta_service import ETAService

    delivery_out = None
    if order.delivery:
        partner = getattr(order.delivery, "delivery_partner", None)
        partner_lat = getattr(partner, "current_latitude", None)
        partner_lon = getattr(partner, "current_longitude", None)

        farm_lat = None
        farm_lon = None
        try:
            farmer = getattr(order, "farmer", None)
            fuser = getattr(farmer, "user", None) if farmer else None
            faddresses = getattr(fuser, "addresses", None) if fuser else None
            if faddresses:
                addr = next((a for a in faddresses if a.is_default), faddresses[0])
                farm_lat = addr.latitude
                farm_lon = addr.longitude
        except Exception:
            pass

        cust_lat = getattr(order.delivery, "destination_latitude", None)
        cust_lon = getattr(order.delivery, "destination_longitude", None)
        try:
            if cust_lat is None:
                cust = getattr(order, "customer", None)
                caddresses = getattr(cust, "addresses", None) if cust else None
                if caddresses:
                    caddr = next((a for a in caddresses if a.is_default), caddresses[0])
                    cust_lat = caddr.latitude
                    cust_lon = caddr.longitude
        except Exception:
            pass

        eta_info = ETAService.calculate_delivery_eta(
            status=order.delivery.status.value,
            partner_lat=partner_lat,
            partner_lon=partner_lon,
            farm_lat=farm_lat,
            farm_lon=farm_lon,
            customer_lat=cust_lat,
            customer_lon=cust_lon,
        )

        delivery_out = OrderDeliveryOut(
            id=order.delivery.id,
            delivery_partner_id=order.delivery.delivery_partner_id,
            status=order.delivery.status,
            assigned_at=order.delivery.assigned_at,
            picked_up_at=order.delivery.picked_up_at,
            delivered_at=order.delivery.delivered_at,
            delivery_partner=OrderDeliveryPartnerOut.model_validate(partner) if partner else None,
            otp=order.delivery.plain_otp if (expose_otp and order.delivery.status == DeliveryStatus.out_for_delivery) else None,
            formatted_eta=eta_info.get("formatted_eta"),
            expected_time=eta_info.get("expected_time"),
            estimated_minutes_min=eta_info.get("estimated_minutes_min"),
            estimated_minutes_max=eta_info.get("estimated_minutes_max"),
            distance_to_target_km=eta_info.get("distance_to_target_km"),
            current_latitude=partner_lat if order.delivery.status == DeliveryStatus.out_for_delivery else None,
            current_longitude=partner_lon if order.delivery.status == DeliveryStatus.out_for_delivery else None,
        )

    items_out = []
    for item in order.items:
        product_name = None
        if item.master_product:
            product_name = item.master_product.name
        elif item.product:
            product_name = item.product.name

        items_out.append(
            OrderItemOut(
                id=item.id,
                product_id=item.product_id,
                inventory_id=item.inventory_id,
                master_product_id=item.master_product_id,
                product_name=product_name,
                quantity=item.quantity,
                price_at_order_time=float(item.price_at_order_time),
                subtotal=float(item.subtotal),
            )
        )

    return OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        farmer_id=order.farmer_id,
        farmer_name=order.farmer.full_name if order.farmer else None,
        total_amount=float(order.total_amount),
        status=order.status,
        payment_method=order.payment_method,
        reservation_expires_at=order.reservation_expires_at,
        items=items_out,
        delivery=delivery_out,
        reviewed=order.review is not None,
        created_at=order.created_at.isoformat(),
        updated_at=order.updated_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class OrderService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._order_repo = OrderRepository(db)
        self._product_repo = ProductRepository(db)
        self._farmer_repo = FarmerRepository(db)
        self._inventory_repo = InventoryRepository(db)

    async def release_expired_reservations(self) -> None:
        """
        Find and cancel all reservations that have expired, restoring stock.
        """
        now = datetime.now(tz=timezone.utc)
        from sqlalchemy import select
        stmt = select(Order).where(
            Order.status.in_([OrderStatus.reserved, OrderStatus.payment_pending]),
            Order.reservation_expires_at < now
        )
        res = await self._db.execute(stmt)
        expired_orders = res.scalars().all()

        for order in expired_orders:
            # Eager load items
            await self._db.refresh(order, ["items"])
            await self._restore_stock_for_order(order)
            order.status = OrderStatus.cancelled
            order.updated_at = now
            print(f"Commerce Engine: Automatically released expired reservation for Order #{order.id}")

        if expired_orders:
            await self._db.commit()

    # ------------------------------------------------------------------
    # 1. Create Order
    # ------------------------------------------------------------------

    async def create_order(
        self,
        *,
        requesting_user: User,
        cart_items: list[CartItemRequest],
        payment_method: str | None = "razorpay",
    ) -> OrderOut:
        """
        Create an order from a cart (reservation-first).

        Full validation pipeline:
          1. Customer role check.
          2. Cart must not be empty.
          3. All products must exist, be active, and not expired.
          4. All products must belong to the same farmer (who must be approved).
          5. Stock must be sufficient for each item (atomic deduction).
        """
        if requesting_user.role != UserRole.customer:
            raise PermissionDeniedError("Only customers can place orders.")

        if not cart_items:
            raise EmptyOrderError()

        # Run lazy reservation cleanup
        await self.release_expired_reservations()

        cutoff = _expiry_cutoff()

        # ------------------------------------------------------------------
        # Phase 1: validate all products / inventories in a single pass
        # ------------------------------------------------------------------
        farmer_ids: set[int] = set()
        validated_items: list[dict] = []   # holds validated item details

        for cart_item in cart_items:
            if cart_item.inventory_id is not None:
                # Master Catalogue Flow
                inventory = await self._inventory_repo.get_by_id(cart_item.inventory_id)
                if inventory is None:
                    raise ProductNotFoundError(
                        f"Inventory entry with ID {cart_item.inventory_id} does not exist."
                    )
                if not inventory.is_active:
                    raise ProductInactiveError(
                        "Product listing is no longer active."
                    )
                # Check harvest date expiry (30 days)
                inv_cutoff = date.today() - timedelta(days=30)
                if inventory.harvest_date < inv_cutoff:
                    raise ProductInactiveError(
                        "Product listing has expired."
                    )
                
                await self._db.refresh(inventory, ["master_product"])
                if not inventory.master_product or not inventory.master_product.is_active:
                    raise ProductInactiveError(
                        "The catalogue product is no longer active."
                    )

                farmer_ids.add(inventory.farmer_id)
                if len(farmer_ids) > 1:
                    raise CrossFarmerOrderError()

                validated_items.append(
                    {
                        "inventory": inventory,
                        "quantity": cart_item.quantity,
                        "price": Decimal(str(inventory.price)),
                        "is_legacy": False,
                    }
                )
            else:
                # Legacy Flow
                product = await self._product_repo.get_by_id(cart_item.product_id)
                if product is None:
                    raise ProductNotFoundError(
                        f"Product with ID {cart_item.product_id} does not exist."
                    )
                if not product.is_active or product.harvest_date < cutoff:
                    raise ProductInactiveError(
                        f"Product '{product.name}' is no longer available."
                    )

                farmer_ids.add(product.farmer_id)
                if len(farmer_ids) > 1:
                    raise CrossFarmerOrderError()

                validated_items.append(
                    {
                        "product": product,
                        "quantity": cart_item.quantity,
                        "price": Decimal(str(product.price)),
                        "is_legacy": True,
                    }
                )

        # ------------------------------------------------------------------
        # Phase 2: verify farmer is approved & within 25 km fulfillment zone
        # ------------------------------------------------------------------
        farmer_id = next(iter(farmer_ids))
        farmer = await self._farmer_repo.get_by_id(farmer_id)
        if farmer is None:
            raise FarmerNotFoundError("The farmer for these products was not found.")
        if not farmer.is_approved:
            raise ProductInactiveError(
                "The farmer for these products is not currently approved."
            )

        # Geographic 25 KM fulfillment feasibility check
        from app.core.geolocation import haversine_distance_km
        if requesting_user.addresses:
            caddr = next((a for a in requesting_user.addresses if a.is_default), requesting_user.addresses[0])
            if caddr and caddr.latitude is not None and caddr.longitude is not None:
                await self._db.refresh(farmer, ["user"])
                if farmer.user and farmer.user.addresses:
                    faddr = next((a for a in farmer.user.addresses if a.is_default), farmer.user.addresses[0])
                    if faddr and faddr.latitude is not None and faddr.longitude is not None:
                        dist_km = haversine_distance_km(caddr.latitude, caddr.longitude, faddr.latitude, faddr.longitude)
                        if dist_km > 25.0:
                            raise ProductInactiveError(
                                f"Farmer '{farmer.full_name}' is {dist_km:.1f} km away, which exceeds the 25.0 km local freshness delivery zone."
                            )

        # ------------------------------------------------------------------
        # Phase 3: atomic stock deduction — all-or-nothing
        # ------------------------------------------------------------------
        # Track which items have already been deducted so we can roll them back
        deducted_legacy: list[tuple[int, int]] = []      # (product_id, qty)
        deducted_inventory: list[tuple[int, int]] = []   # (inventory_id, qty)

        try:
            for entry in validated_items:
                qty = entry["quantity"]
                if entry["is_legacy"]:
                    product = entry["product"]
                    success = await self._product_repo.deduct_stock(product.id, qty)
                    if not success:
                        raise InsufficientStockError(
                            f"Insufficient stock for product '{product.name}'."
                        )
                    deducted_legacy.append((product.id, qty))
                else:
                    inventory = entry["inventory"]
                    updated_row = await self._inventory_repo.decrement_stock(inventory_id=inventory.id, qty=qty)
                    if updated_row is None:
                        raise InsufficientStockError(
                            f"Insufficient stock for product '{inventory.master_product.name}'."
                        )
                    deducted_inventory.append((inventory.id, qty))
        except InsufficientStockError as e:
            # Rollback any legacy stock deductions
            for prev_product_id, prev_qty in deducted_legacy:
                await self._product_repo.restore_stock(prev_product_id, prev_qty)
            # Rollback any inventory stock deductions
            for prev_inv_id, prev_qty in deducted_inventory:
                await self._inventory_repo.restore_stock(inventory_id=prev_inv_id, qty=prev_qty)
            raise

        # ------------------------------------------------------------------
        # Phase 4: persist order
        # ------------------------------------------------------------------
        total_amount = sum(
            entry["price"] * entry["quantity"] for entry in validated_items
        )

        # Set 5-minute reservation timer
        expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=5)

        order = await self._order_repo.create(
            customer_id=requesting_user.id,
            farmer_id=farmer_id,
            total_amount=total_amount,
            status=OrderStatus.reserved,
            reservation_expires_at=expires_at,
            payment_method=payment_method,
        )

        order_items = []
        for entry in validated_items:
            qty = entry["quantity"]
            price = entry["price"]
            subtot = price * qty
            if entry["is_legacy"]:
                oi = OrderItem(
                    order_id=order.id,
                    product_id=entry["product"].id,
                    quantity=qty,
                    price_at_order_time=price,
                    subtotal=subtot,
                )
            else:
                oi = OrderItem(
                    order_id=order.id,
                    product_id=None,
                    inventory_id=entry["inventory"].id,
                    master_product_id=entry["inventory"].master_product_id,
                    quantity=qty,
                    price_at_order_time=price,
                    subtotal=subtot,
                )
            order_items.append(oi)

        await self._order_repo.add_items(order_items)

        # Re-fetch with items eagerly loaded for the response
        order = await self._order_repo.get_by_id(order.id)
        return _order_to_out(order)

    # ------------------------------------------------------------------
    # 2. List customer's own orders
    # ------------------------------------------------------------------

    async def list_my_orders(
        self,
        *,
        requesting_user: User,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedOrdersOut:
        if requesting_user.role != UserRole.customer:
            raise PermissionDeniedError("Only customers can view their order history.")

        # Run lazy reservation cleanup
        await self.release_expired_reservations()

        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        orders = await self._order_repo.list_for_customer(
            requesting_user.id, offset=offset, limit=page_size
        )
        total = await self._order_repo.count_for_customer(requesting_user.id)
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedOrdersOut(
            items=[_order_to_out(o, expose_otp=True) for o in orders],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 2b. List incoming orders for the authenticated farmer
    # ------------------------------------------------------------------

    async def list_farmer_orders(
        self,
        *,
        requesting_user: User,
        page: int = 1,
        page_size: int = 20,
        status: str | None = None,
    ) -> PaginatedOrdersOut:
        """
        Return a paginated list of orders assigned to this farmer.
        Requires the caller to have role=farmer and a farmer profile.
        Optionally filter by status string (pending, accepted, completed, etc.).
        """
        farmer = await self._get_farmer_for_user(requesting_user)

        # Run lazy reservation cleanup
        await self.release_expired_reservations()

        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        # Convert status string to enum if provided
        status_enum: OrderStatus | None = None
        if status and status in [s.value for s in OrderStatus]:
            status_enum = OrderStatus(status)

        orders = await self._order_repo.list_for_farmer(
            farmer.id, offset=offset, limit=page_size, status=status_enum
        )
        total = await self._order_repo.count_for_farmer(farmer.id, status=status_enum)
        total_pages = math.ceil(total / page_size) if total else 0
        return PaginatedOrdersOut(
            items=[_order_to_out(o) for o in orders],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 3. Get order detail
    # ------------------------------------------------------------------

    async def get_order(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> OrderOut:
        """
        Return full order details.

        Access rules:
          - The customer who placed it.
          - The farmer it was assigned to.
          - Admins (any role == admin).
        """
        # Run lazy reservation cleanup
        await self.release_expired_reservations()

        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()

        farmer_profile_id: int | None = None
        if requesting_user.role == UserRole.farmer:
            farmer_profile = await self._farmer_repo.get_by_user_id(requesting_user.id)
            farmer_profile_id = farmer_profile.id if farmer_profile else None

        self._assert_can_view(order, requesting_user, farmer_profile_id)
        expose_otp = (
            requesting_user.id == order.customer_id
            or requesting_user.role == UserRole.admin
        )
        return _order_to_out(order, expose_otp=expose_otp)

    # ------------------------------------------------------------------
    # 4. Customer cancels order
    # ------------------------------------------------------------------

    async def cancel_order(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> OrderStatusOut:
        """
        Cancel an order.  Only the customer who placed it may cancel,
        and only while status == pending.

        Raises:
            OrderNotFoundError          – order not found
            OrderForbiddenError         – caller is not the order's customer
            OrderCannotBeCancelledError – order is not pending
        """
        if requesting_user.role != UserRole.customer:
            raise PermissionDeniedError("Only customers can cancel orders.")

        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()

        if order.customer_id != requesting_user.id:
            raise OrderForbiddenError()

        if order.status not in (OrderStatus.pending, OrderStatus.reserved, OrderStatus.payment_pending):
            raise OrderCannotBeCancelledError("Only pending, reserved, or payment pending orders can be cancelled.")

        await self._restore_stock_for_order(order)
        order = await self._order_repo.set_status(order, OrderStatus.cancelled)

        return OrderStatusOut(
            id=order.id,
            status=order.status,
            message="Order cancelled successfully. Stock has been restored.",
        )

    # ------------------------------------------------------------------
    # 5. Farmer accepts order
    # ------------------------------------------------------------------

    async def accept_order(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> OrderStatusOut:
        """
        Farmer accepts a pending order (pending → accepted).

        Raises:
            PermissionDeniedError              – caller is not a farmer
            FarmerNotFoundError                – no farmer profile
            OrderNotFoundError                 – order not found
            OrderForbiddenError                – order belongs to a different farmer
            OrderInvalidStatusTransitionError  – order is not pending
        """
        farmer = await self._get_farmer_for_user(requesting_user)

        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()

        if order.farmer_id != farmer.id:
            raise OrderForbiddenError()

        self._assert_transition(order, "farmer", OrderStatus.accepted)

        order = await self._order_repo.set_status(order, OrderStatus.accepted)

        # Trigger delivery creation automatically
        from app.services.delivery_service import DeliveryService
        delivery_service = DeliveryService(self._db)
        try:
            customer = order.customer
            default_addr = next((a for a in customer.addresses if a.is_default), customer.addresses[0]) if (customer.addresses and len(customer.addresses) > 0) else None
            dest_lat = default_addr.latitude if default_addr else None
            dest_lon = default_addr.longitude if default_addr else None

            await delivery_service.create_delivery(
                order_id=order.id,
                destination_latitude=dest_lat,
                destination_longitude=dest_lon,
            )
        except Exception as e:
            # Log gracefully to prevent blocking order acceptance
            print(f"Warning: Failed to auto-create delivery for order {order.id}: {e}")

        return OrderStatusOut(
            id=order.id,
            status=order.status,
            message="Order accepted. Delivery partner auto-assignment has been initiated.",
        )

    # ------------------------------------------------------------------
    # 6. Farmer rejects order
    # ------------------------------------------------------------------

    async def reject_order(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> OrderStatusOut:
        """
        Farmer rejects a pending order (pending → rejected). Stock restored.

        Raises same as accept_order.
        """
        farmer = await self._get_farmer_for_user(requesting_user)

        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()

        if order.farmer_id != farmer.id:
            raise OrderForbiddenError()

        self._assert_transition(order, "farmer", OrderStatus.rejected)

        await self._restore_stock_for_order(order)
        order = await self._order_repo.set_status(order, OrderStatus.rejected)

        return OrderStatusOut(
            id=order.id,
            status=order.status,
            message="Order rejected. Stock has been restored.",
        )

    # ------------------------------------------------------------------
    # 7. Farmer marks order completed
    # ------------------------------------------------------------------

    async def complete_order(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> OrderStatusOut:
        """
        Farmer marks an accepted order as completed (accepted → completed).
        No stock change — stock was already deducted at creation.

        Raises same as accept_order.
        """
        farmer = await self._get_farmer_for_user(requesting_user)

        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()

        if order.farmer_id != farmer.id:
            raise OrderForbiddenError()

        self._assert_transition(order, "farmer", OrderStatus.completed)

        order = await self._order_repo.set_status(order, OrderStatus.completed)
        return OrderStatusOut(
            id=order.id,
            status=order.status,
            message="Order marked as completed.",
        )

    # ------------------------------------------------------------------
    # 8. Farmer updates status to packing
    # ------------------------------------------------------------------

    async def mark_packing(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> OrderStatusOut:
        farmer = await self._get_farmer_for_user(requesting_user)
        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()
        if order.farmer_id != farmer.id:
            raise OrderForbiddenError()
        self._assert_transition(order, "farmer", OrderStatus.packing)
        order = await self._order_repo.set_status(order, OrderStatus.packing)
        return OrderStatusOut(
            id=order.id,
            status=order.status,
            message="Order status updated to packing.",
        )

    # ------------------------------------------------------------------
    # 9. Farmer updates status to ready_for_pickup
    # ------------------------------------------------------------------

    async def mark_ready_for_pickup(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> OrderStatusOut:
        farmer = await self._get_farmer_for_user(requesting_user)
        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()
        if order.farmer_id != farmer.id:
            raise OrderForbiddenError()
        self._assert_transition(order, "farmer", OrderStatus.ready_for_pickup)
        order = await self._order_repo.set_status(order, OrderStatus.ready_for_pickup)
        return OrderStatusOut(
            id=order.id,
            status=order.status,
            message="Order status updated to ready_for_pickup.",
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_farmer_for_user(self, user: User):
        """Validate the user is a farmer with a profile."""
        if user.role != UserRole.farmer:
            raise PermissionDeniedError("Only farmers can perform this action.")
        farmer = await self._farmer_repo.get_by_user_id(user.id)
        if farmer is None:
            raise FarmerNotFoundError(
                "You do not have a farmer profile set up."
            )
        return farmer

    @staticmethod
    def _assert_can_view(
        order: Order,
        user: User,
        farmer_profile_id: int | None = None,
    ) -> None:
        """Raise OrderForbiddenError if the user has no right to see this order."""
        if user.role == UserRole.admin:
            return
        if user.role == UserRole.customer and order.customer_id == user.id:
            return
        # A farmer may only see orders assigned to their own farmer profile.
        if (
            user.role == UserRole.farmer
            and farmer_profile_id is not None
            and order.farmer_id == farmer_profile_id
        ):
            return
        raise OrderForbiddenError()

    @staticmethod
    def _assert_transition(
        order: Order,
        actor: str,
        target_status: OrderStatus,
    ) -> None:
        """
        Validate that transitioning `order` to `target_status` is permitted.

        Raises:
            OrderInvalidStatusTransitionError if the transition is not in the
            ALLOWED_TRANSITIONS map.
        """
        allowed = ALLOWED_TRANSITIONS.get((order.status, actor), set())
        if target_status not in allowed:
            raise OrderInvalidStatusTransitionError(
                f"Cannot move order from '{order.status.value}' to "
                f"'{target_status.value}' as {actor}."
            )

    async def _restore_stock_for_order(self, order: Order) -> None:
        """Restore stock for all items in an order (cancel / reject path)."""
        for item in order.items:
            if item.inventory_id is not None:
                await self._inventory_repo.restore_stock(inventory_id=item.inventory_id, qty=item.quantity)
            else:
                await self._product_repo.restore_stock(item.product_id, item.quantity)
