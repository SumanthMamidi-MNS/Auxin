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

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatus


class OrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    async def get_by_id(self, order_id: int) -> Order | None:
        """
        Fetch order by PK, eagerly loading items so callers never need a
        second query to access order_items.
        """
        result = await self._db.execute(
            select(Order)
            .options(selectinload(Order.items))
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
        result = await self._db.execute(
            select(Order)
            .options(selectinload(Order.items))
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
    ) -> list[Order]:
        """Return all orders assigned to a farmer, newest first."""
        result = await self._db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.farmer_id == farmer_id)
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_for_farmer(self, farmer_id: int) -> int:
        result = await self._db.execute(
            select(func.count())
            .select_from(Order)
            .where(Order.farmer_id == farmer_id)
        )
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
    ) -> Order:
        """
        Create the order header.  Items are added separately via
        `add_items()` so the order ID is available for the FK.
        """
        order = Order(
            customer_id=customer_id,
            farmer_id=farmer_id,
            total_amount=total_amount,
            status=OrderStatus.pending,
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
