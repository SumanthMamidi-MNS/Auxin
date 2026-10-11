"""
app/repositories/product_repository.py
========================================
All DB queries for the `products` table.

Expiry logic:
  A product is considered "expired" when its harvest_date is older than
  PRODUCT_EXPIRY_DAYS days from today.  This is enforced at the query
  level in `list_active()` so no background scheduler is required.
"""

from datetime import date, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.product import Product


class ProductRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _expiry_cutoff() -> date:
        """Return the earliest harvest_date still considered fresh."""
        return date.today() - timedelta(days=settings.PRODUCT_EXPIRY_DAYS)

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    async def get_by_id(self, product_id: int) -> Product | None:
        """Fetch any product by PK regardless of is_active / expiry."""
        result = await self._db.execute(
            select(Product).where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def list_active(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        farmer_id: int | None = None,
    ) -> list[Product]:
        """
        Return active, non-expired products.

        Filters:
          - is_active = True
          - harvest_date >= today - PRODUCT_EXPIRY_DAYS
          - Optionally restricted to a single farmer
        """
        cutoff = self._expiry_cutoff()
        stmt = (
            select(Product)
            .where(
                Product.is_active.is_(True),
                Product.harvest_date >= cutoff,
            )
            .order_by(Product.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if farmer_id is not None:
            stmt = stmt.where(Product.farmer_id == farmer_id)

        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_active(self, *, farmer_id: int | None = None) -> int:
        """Count active non-expired products (for pagination metadata)."""
        from sqlalchemy import func

        cutoff = self._expiry_cutoff()
        stmt = (
            select(func.count())
            .select_from(Product)
            .where(
                Product.is_active.is_(True),
                Product.harvest_date >= cutoff,
            )
        )
        if farmer_id is not None:
            stmt = stmt.where(Product.farmer_id == farmer_id)

        result = await self._db.execute(stmt)
        return result.scalar_one()

    async def list_all_for_farmer(
        self,
        *,
        farmer_id: int,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Product]:
        """Return ALL products for a farmer (active + inactive), newest first."""
        result = await self._db.execute(
            select(Product)
            .where(Product.farmer_id == farmer_id)
            .order_by(Product.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_all_for_farmer(self, *, farmer_id: int) -> int:
        """Count ALL products for a farmer (active + inactive)."""
        from sqlalchemy import func
        result = await self._db.execute(
            select(func.count())
            .select_from(Product)
            .where(Product.farmer_id == farmer_id)
        )
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Writes
    # ------------------------------------------------------------------

    async def create(
        self,
        *,
        farmer_id: int,
        name: str,
        description: str | None,
        price: float,
        quantity: int,
        unit: str,
        harvest_date: date,
        image_url: str,
    ) -> Product:
        from app.models.farmer import Farmer
        from app.models.user import User
        from sqlalchemy import select
        res = await self._db.execute(
            select(User.is_demo).join(Farmer, Farmer.user_id == User.id).where(Farmer.id == farmer_id)
        )
        is_demo_val = res.scalar() or False

        product = Product(
            farmer_id=farmer_id,
            name=name,
            description=description,
            price=price,
            quantity=quantity,
            unit=unit,
            harvest_date=harvest_date,
            image_url=image_url,
            is_active=True,
            is_demo=is_demo_val,
        )
        self._db.add(product)
        await self._db.flush()
        return product

    async def update(
        self,
        product: Product,
        *,
        name: str | None = None,
        description: str | None = None,
        price: float | None = None,
        quantity: int | None = None,
        unit: str | None = None,
        harvest_date: date | None = None,
        image_url: str | None = None,
    ) -> Product:
        """
        Apply partial updates.  Only fields that are explicitly supplied
        (not None) are written, so PATCH-style semantics work correctly.
        """
        if name is not None:
            product.name = name
        if description is not None:
            product.description = description
        if price is not None:
            product.price = price
        if quantity is not None:
            product.quantity = quantity
        if unit is not None:
            product.unit = unit
        if harvest_date is not None:
            product.harvest_date = harvest_date
        if image_url is not None:
            product.image_url = image_url

        self._db.add(product)
        await self._db.flush()
        return product

    async def soft_delete(self, product: Product) -> Product:
        """Mark product inactive (soft delete — record is preserved)."""
        product.is_active = False
        self._db.add(product)
        await self._db.flush()
        return product

    async def deactivate_expired(self) -> int:
        """
        Bulk-deactivate all products whose harvest_date has passed the expiry
        threshold.  Suitable for a nightly maintenance job.

        Returns:
            Number of rows updated.
        """
        cutoff = self._expiry_cutoff()
        result = await self._db.execute(
            update(Product)
            .where(
                Product.is_active.is_(True),
                Product.harvest_date < cutoff,
            )
            .values(is_active=False)
            .execution_options(synchronize_session="fetch")
        )
        await self._db.flush()
        return result.rowcount

    async def deduct_stock(self, product_id: int, qty: int) -> bool:
        """
        Atomically deduct `qty` units from product stock.

        Uses a conditional UPDATE that only fires when quantity >= qty,
        guaranteeing no negative stock even under concurrent requests.

        Returns:
            True  – deduction succeeded.
            False – insufficient stock (quantity < qty).
        """
        result = await self._db.execute(
            update(Product)
            .where(Product.id == product_id, Product.quantity >= qty)
            .values(quantity=Product.quantity - qty)
            .execution_options(synchronize_session="fetch")
        )
        await self._db.flush()
        return result.rowcount == 1

    async def restore_stock(self, product_id: int, qty: int) -> None:
        """
        Restore `qty` units back to a product (on cancel / reject).
        Safe to call multiple times; capped at no semantic upper bound
        (restoring more than deducted is a caller bug, not a DB concern).
        """
        await self._db.execute(
            update(Product)
            .where(Product.id == product_id)
            .values(quantity=Product.quantity + qty)
            .execution_options(synchronize_session="fetch")
        )
        await self._db.flush()

