"""
app/repositories/order_repository.py
======================================
All DB queries for the `orders` and `order_items` tables.

Design notes:
  - Order items are inserted in bulk using a single flush to minimise
    round-trips during order creation.
  - Status updates are done via direct attribute mutation + flush
    (not bulk UPDATE) so SQLAlchemy event hooks (e.g. updated_at
    onupdate) fire correctly.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product  # noqa: F401  (needed for relationship loading)
from app.models.user import User


class OrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    async def get_by_id(self, order_id: int) -> Order | None:
        """
        Fetch order by PK, eagerly loading items (with product names),
        delivery info (with partner), customer (with addresses), and farmer details.
        """
        from app.models.delivery import Delivery  # noqa: PLC0415
        from app.models.farmer import Farmer  # noqa: PLC0415
        result = await self._db.execute(
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.items).selectinload(OrderItem.master_product),
                selectinload(Order.delivery).selectinload(Delivery.delivery_partner),
                selectinload(Order.customer).selectinload(User.addresses),
                selectinload(Order.farmer).selectinload(Farmer.user).selectinload(User.addresses),
                selectinload(Order.review),
            )
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def list_for_customer(
        self,
        customer_id: int,
        *,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Order]:
        """Return all orders placed by a customer, newest first."""
        from app.models.delivery import Delivery  # noqa: PLC0415
        from app.models.farmer import Farmer  # noqa: PLC0415
        result = await self._db.execute(
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.items).selectinload(OrderItem.master_product),
                selectinload(Order.delivery).selectinload(Delivery.delivery_partner),
                selectinload(Order.customer),
                selectinload(Order.farmer).selectinload(Farmer.user).selectinload(User.addresses),
                selectinload(Order.review),
            )
            .where(Order.customer_id == customer_id)
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_for_customer(self, customer_id: int) -> int:
        result = await self._db.execute(
            select(func.count())
            .select_from(Order)
            .where(Order.customer_id == customer_id)
        )
        return result.scalar_one()

    async def list_for_farmer(
        self,
        farmer_id: int,
        *,
        offset: int = 0,
        limit: int = 20,
        status: OrderStatus | None = None,
    ) -> list[Order]:
        """Return all orders assigned to a farmer, newest first.

        Optionally filter by order status.  Eagerly loads items with their
        product names and the associated delivery record (with partner).
        """
        from app.models.delivery import Delivery  # noqa: PLC0415
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.items).selectinload(OrderItem.master_product),
                selectinload(Order.delivery).selectinload(Delivery.delivery_partner),
                selectinload(Order.customer),
                selectinload(Order.farmer),
                selectinload(Order.review),
            )
            .where(Order.farmer_id == farmer_id)
        )
        if status is not None:
            stmt = stmt.where(Order.status == status)
        stmt = stmt.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_for_farmer(
        self,
        farmer_id: int,
        *,
        status: OrderStatus | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(Order)
            .where(Order.farmer_id == farmer_id)
        )
        if status is not None:
            stmt = stmt.where(Order.status == status)
        result = await self._db.execute(stmt)
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Writes
    # ------------------------------------------------------------------

    async def create(
        self,
        *,
        customer_id: int,
        farmer_id: int,
        total_amount: Decimal,
        status: OrderStatus = OrderStatus.reserved,
        reservation_expires_at: datetime | None = None,
        payment_method: str | None = None,
    ) -> Order:
        """
        Create the order header.  Items are added separately via
        `add_items()` so the order ID is available for the FK.
        """
        from app.models.user import User
        from sqlalchemy import select
        res = await self._db.execute(select(User.is_demo).where(User.id == customer_id))
        is_demo_val = res.scalar() or False

        order = Order(
            customer_id=customer_id,
            farmer_id=farmer_id,
            total_amount=total_amount,
            status=status,
            is_demo=is_demo_val,
            reservation_expires_at=reservation_expires_at,
            payment_method=payment_method,
        )
        self._db.add(order)
        await self._db.flush()   # populates order.id
        return order

    async def add_items(self, items: list[OrderItem]) -> None:
        """Bulk-insert order items in a single flush."""
        for item in items:
            self._db.add(item)
        await self._db.flush()

    async def set_status(self, order: Order, new_status: OrderStatus) -> Order:
        """
        Transition an order to `new_status`.

        The caller is responsible for validating the transition is legal
        before calling this method.  The `updated_at` column is refreshed
        automatically via the onupdate lambda on the model.
        """
        order.status = new_status
        self._db.add(order)
        await self._db.flush()
        return order
