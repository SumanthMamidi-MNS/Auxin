"""
app/repositories/inventory_repository.py
==========================================
Database access layer for FarmerInventory.

Key responsibilities:
  - CRUD for farmer inventory entries
  - Aggregate stock queries (total_stock, min_price, has_organic per master product)
  - Atomic stock decrement for order placement
  - Stock restoration for cancellations / rejections
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Sequence

from sqlalchemy import case, func, select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalogue import FarmerInventory, MasterProduct, MasterCategory
from app.models.farmer import Farmer


# Products older than this many days are considered stale (mirrors existing config)
_EXPIRY_DAYS = 30


class InventoryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------ #
    # Single entry lookups
    # ------------------------------------------------------------------ #

    async def get_by_id(self, inventory_id: int) -> FarmerInventory | None:
        result = await self._db.execute(
            select(FarmerInventory)
            .options(selectinload(FarmerInventory.farmer))
            .where(FarmerInventory.id == inventory_id)
        )
        return result.scalar_one_or_none()

    async def get_by_farmer_and_product(
        self, *, farmer_id: int, master_product_id: int
    ) -> FarmerInventory | None:
        result = await self._db.execute(
            select(FarmerInventory).where(
                FarmerInventory.farmer_id == farmer_id,
                FarmerInventory.master_product_id == master_product_id,
            )
        )
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------ #
    # Farmer's own inventory list
    # ------------------------------------------------------------------ #

    async def list_for_farmer(
        self,
        *,
        farmer_id: int,
        include_inactive: bool = False,
        offset: int = 0,
        limit: int = 50,
    ) -> Sequence[FarmerInventory]:
        stmt = (
            select(FarmerInventory)
            .where(FarmerInventory.farmer_id == farmer_id)
            .order_by(FarmerInventory.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if not include_inactive:
            stmt = stmt.where(FarmerInventory.is_active.is_(True))
        result = await self._db.execute(stmt)
        return result.scalars().all()

    async def count_for_farmer(
        self, *, farmer_id: int, include_inactive: bool = False
    ) -> int:
        stmt = select(func.count()).select_from(FarmerInventory).where(
            FarmerInventory.farmer_id == farmer_id
        )
        if not include_inactive:
            stmt = stmt.where(FarmerInventory.is_active.is_(True))
        result = await self._db.execute(stmt)
        return result.scalar_one()

    # ------------------------------------------------------------------ #
    # Per master-product available supplier list
    # ------------------------------------------------------------------ #

    async def list_for_product(
        self,
        *,
        master_product_id: int,
        organic_only: bool = False,
    ) -> Sequence[FarmerInventory]:
        """Return active, in-stock, non-expired suppliers for a master product."""
        cutoff = date.today() - timedelta(days=_EXPIRY_DAYS)
        stmt = (
            select(FarmerInventory)
            .options(selectinload(FarmerInventory.farmer))
            .where(
                FarmerInventory.master_product_id == master_product_id,
                FarmerInventory.is_active.is_(True),
                FarmerInventory.quantity > 0,
                FarmerInventory.harvest_date >= cutoff,
                # Produce from farmers who are not yet approved is never shown to customers.
                FarmerInventory.farmer_id.in_(select(Farmer.id).where(Farmer.is_approved.is_(True))),
            )
            .order_by(FarmerInventory.price.asc())
        )
        if organic_only:
            stmt = stmt.where(FarmerInventory.is_organic.is_(True))
        result = await self._db.execute(stmt)
        return result.scalars().all()

    # ------------------------------------------------------------------ #
    # Aggregated catalogue view (for customer listing)
    # ------------------------------------------------------------------ #

    async def get_aggregated_catalogue(
        self,
        *,
        category_slug: str | None = None,
        organic_only: bool = False,
        query: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[dict]:
        """
        Returns aggregated product rows for the customer catalogue view.

        Each row contains:
          id, name, slug, image_url, default_unit, category_id, category_name,
          category_slug, min_price, max_price, total_stock, farmer_count,
          has_organic, is_seasonal, description, shelf_life_days
        """
        cutoff = date.today() - timedelta(days=_EXPIRY_DAYS)

        # Base subquery: aggregate inventory per master_product
        inv_agg = (
            select(
                FarmerInventory.master_product_id.label("mp_id"),
                func.min(FarmerInventory.price).label("min_price"),
                func.max(FarmerInventory.price).label("max_price"),
                func.sum(FarmerInventory.quantity).label("total_stock"),
                func.count(FarmerInventory.farmer_id.distinct()).label("farmer_count"),
                func.max(
                    case((FarmerInventory.is_organic.is_(True), 1), else_=0)
                ).label("has_organic"),
            )
            .where(
                FarmerInventory.is_active.is_(True),
                FarmerInventory.quantity > 0,
                FarmerInventory.harvest_date >= cutoff,
                # Produce from farmers who are not yet approved is never shown to customers.
                FarmerInventory.farmer_id.in_(select(Farmer.id).where(Farmer.is_approved.is_(True))),
            )
            .group_by(FarmerInventory.master_product_id)
        )
        if organic_only:
            inv_agg = inv_agg.where(FarmerInventory.is_organic.is_(True))
        inv_agg = inv_agg.subquery("inv_agg")

        stmt = (
            select(
                MasterProduct.id,
                MasterProduct.name,
                MasterProduct.slug,
                MasterProduct.image_url,
                MasterProduct.default_unit,
                MasterProduct.description,
                MasterProduct.is_seasonal,
                MasterProduct.shelf_life_days,
                MasterProduct.display_order,
                MasterCategory.id.label("category_id"),
                MasterCategory.name.label("category_name"),
                MasterCategory.slug.label("category_slug"),
                MasterCategory.icon_emoji.label("category_icon"),
                inv_agg.c.min_price,
                inv_agg.c.max_price,
                inv_agg.c.total_stock,
                inv_agg.c.farmer_count,
                inv_agg.c.has_organic,
            )
            .join(MasterCategory, MasterProduct.category_id == MasterCategory.id)
            .join(inv_agg, MasterProduct.id == inv_agg.c.mp_id)
            .where(MasterProduct.is_active.is_(True))
            .order_by(MasterProduct.display_order.asc(), MasterProduct.name.asc())
            .offset(offset)
            .limit(limit)
        )

        if category_slug:
            stmt = stmt.where(MasterCategory.slug == category_slug)
        if query:
            stmt = stmt.where(MasterProduct.name.ilike(f"%{query.strip()}%"))

        result = await self._db.execute(stmt)
        rows = result.mappings().all()
        return [{**dict(r), "has_organic": bool(r.get("has_organic"))} for r in rows]

    async def count_aggregated_catalogue(
        self,
        *,
        category_slug: str | None = None,
        organic_only: bool = False,
        query: str | None = None,
    ) -> int:
        cutoff = date.today() - timedelta(days=_EXPIRY_DAYS)
        inv_agg = (
            select(FarmerInventory.master_product_id.label("mp_id"))
            .where(
                FarmerInventory.is_active.is_(True),
                FarmerInventory.quantity > 0,
                FarmerInventory.harvest_date >= cutoff,
                # Produce from farmers who are not yet approved is never shown to customers.
                FarmerInventory.farmer_id.in_(select(Farmer.id).where(Farmer.is_approved.is_(True))),
            )
            .group_by(FarmerInventory.master_product_id)
        )
        if organic_only:
            inv_agg = inv_agg.where(FarmerInventory.is_organic.is_(True))
        inv_agg = inv_agg.subquery("inv_agg_cnt")

        stmt = (
            select(func.count())
            .select_from(MasterProduct)
            .join(MasterCategory, MasterProduct.category_id == MasterCategory.id)
            .join(inv_agg, MasterProduct.id == inv_agg.c.mp_id)
            .where(MasterProduct.is_active.is_(True))
        )
        if category_slug:
            stmt = stmt.where(MasterCategory.slug == category_slug)
        if query:
            stmt = stmt.where(MasterProduct.name.ilike(f"%{query.strip()}%"))
        result = await self._db.execute(stmt)
        return result.scalar_one()

    # ------------------------------------------------------------------ #
    # CRUD operations
    # ------------------------------------------------------------------ #

    async def create(
        self,
        *,
        master_product_id: int,
        farmer_id: int,
        price: Decimal,
        quantity: int,
        unit: str,
        is_organic: bool,
        harvest_date: date,
        notes: str | None = None,
    ) -> FarmerInventory:
        entry = FarmerInventory(
            master_product_id=master_product_id,
            farmer_id=farmer_id,
            price=price,
            quantity=quantity,
            unit=unit,
            is_organic=is_organic,
            harvest_date=harvest_date,
            notes=notes,
        )
        self._db.add(entry)
        await self._db.flush()
        return entry

    async def update(
        self, entry: FarmerInventory, **fields
    ) -> FarmerInventory:
        for k, v in fields.items():
            if v is not None:
                setattr(entry, k, v)
        self._db.add(entry)
        await self._db.flush()
        return entry

    async def deactivate(self, entry: FarmerInventory) -> FarmerInventory:
        entry.is_active = False
        self._db.add(entry)
        await self._db.flush()
        return entry

    # ------------------------------------------------------------------ #
    # Stock management (atomic operations)
    # ------------------------------------------------------------------ #

    async def decrement_stock(
        self, *, inventory_id: int, qty: int
    ) -> FarmerInventory | None:
        """
        Atomically decrement quantity. Returns the updated row if successful,
        None if stock was insufficient (race condition guard).
        """
        stmt = (
            update(FarmerInventory)
            .where(
                FarmerInventory.id == inventory_id,
                FarmerInventory.quantity >= qty,
                FarmerInventory.is_active.is_(True),
            )
            .values(quantity=FarmerInventory.quantity - qty)
            .returning(FarmerInventory)
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def restore_stock(self, *, inventory_id: int, qty: int) -> None:
        """Restore stock on order cancellation or rejection."""
        await self._db.execute(
            update(FarmerInventory)
            .where(FarmerInventory.id == inventory_id)
            .values(quantity=FarmerInventory.quantity + qty)
        )

    # ------------------------------------------------------------------ #
    # Demo reset helper
    # ------------------------------------------------------------------ #

    async def delete_demo_inventory(self) -> None:
        """Remove all demo inventory entries (called during sandbox reset)."""
        from sqlalchemy import delete
        await self._db.execute(
            delete(FarmerInventory).where(FarmerInventory.is_demo.is_(True))
        )
