"""
app/repositories/catalogue_repository.py
==========================================
Database access layer for MasterCategory and MasterProduct.

All write operations belong to Super Admin (enforced at service layer).
Read operations are public.
"""

import math
from typing import Sequence

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalogue import MasterCategory, MasterProduct


class CatalogueRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------ #
    # MasterCategory
    # ------------------------------------------------------------------ #

    async def list_categories(
        self,
        *,
        parent_id: int | None = None,
        include_inactive: bool = False,
    ) -> Sequence[MasterCategory]:
        """List all categories, optionally filtered by parent and active status."""
        stmt = select(MasterCategory).order_by(MasterCategory.display_order)
        if parent_id is not None:
            stmt = stmt.where(MasterCategory.parent_id == parent_id)
        else:
            # Return only root categories by default when no parent specified
            stmt = stmt.where(MasterCategory.parent_id.is_(None))
        if not include_inactive:
            stmt = stmt.where(MasterCategory.is_active.is_(True))
        result = await self._db.execute(stmt)
        return result.scalars().all()

    async def list_all_categories(
        self, *, include_inactive: bool = False
    ) -> Sequence[MasterCategory]:
        """List every category (root + subcategories)."""
        stmt = select(MasterCategory).order_by(
            MasterCategory.parent_id.nullsfirst(), MasterCategory.display_order
        )
        if not include_inactive:
            stmt = stmt.where(MasterCategory.is_active.is_(True))
        result = await self._db.execute(stmt)
        return result.scalars().all()

    async def get_category_by_id(self, category_id: int) -> MasterCategory | None:
        result = await self._db.execute(
            select(MasterCategory).where(MasterCategory.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_category_by_slug(self, slug: str) -> MasterCategory | None:
        result = await self._db.execute(
            select(MasterCategory).where(MasterCategory.slug == slug)
        )
        return result.scalar_one_or_none()

    async def create_category(
        self,
        *,
        name: str,
        slug: str,
        parent_id: int | None = None,
        icon_emoji: str | None = None,
        image_url: str | None = None,
        display_order: int = 0,
    ) -> MasterCategory:
        cat = MasterCategory(
            name=name,
            slug=slug,
            parent_id=parent_id,
            icon_emoji=icon_emoji,
            image_url=image_url,
            display_order=display_order,
        )
        self._db.add(cat)
        await self._db.flush()
        return cat

    async def update_category(
        self,
        category: MasterCategory,
        **fields,
    ) -> MasterCategory:
        for k, v in fields.items():
            if v is not None:
                setattr(category, k, v)
        self._db.add(category)
        await self._db.flush()
        return category

    # ------------------------------------------------------------------ #
    # MasterProduct
    # ------------------------------------------------------------------ #

    async def list_products(
        self,
        *,
        category_id: int | None = None,
        include_inactive: bool = False,
        offset: int = 0,
        limit: int = 20,
    ) -> Sequence[MasterProduct]:
        stmt = (
            select(MasterProduct)
            .order_by(MasterProduct.display_order, MasterProduct.name)
            .offset(offset)
            .limit(limit)
        )
        if category_id is not None:
            stmt = stmt.where(MasterProduct.category_id == category_id)
        if not include_inactive:
            stmt = stmt.where(MasterProduct.is_active.is_(True))
        result = await self._db.execute(stmt)
        return result.scalars().all()

    async def count_products(
        self,
        *,
        category_id: int | None = None,
        include_inactive: bool = False,
    ) -> int:
        stmt = select(func.count()).select_from(MasterProduct)
        if category_id is not None:
            stmt = stmt.where(MasterProduct.category_id == category_id)
        if not include_inactive:
            stmt = stmt.where(MasterProduct.is_active.is_(True))
        result = await self._db.execute(stmt)
        return result.scalar_one()

    async def get_product_by_id(self, product_id: int) -> MasterProduct | None:
        result = await self._db.execute(
            select(MasterProduct).where(MasterProduct.id == product_id)
        )
        return result.scalar_one_or_none()

    async def get_product_by_slug(self, slug: str) -> MasterProduct | None:
        result = await self._db.execute(
            select(MasterProduct).where(MasterProduct.slug == slug)
        )
        return result.scalar_one_or_none()

    async def create_product(
        self,
        *,
        category_id: int,
        name: str,
        slug: str,
        description: str | None = None,
        default_unit: str = "kg",
        image_url: str | None = None,
        tags: str | None = None,
        storage_info: str | None = None,
        shelf_life_days: int | None = None,
        is_seasonal: bool = False,
        display_order: int = 0,
        created_by: int | None = None,
    ) -> MasterProduct:
        product = MasterProduct(
            category_id=category_id,
            name=name,
            slug=slug,
            description=description,
            default_unit=default_unit,
            image_url=image_url,
            tags=tags,
            storage_info=storage_info,
            shelf_life_days=shelf_life_days,
            is_seasonal=is_seasonal,
            display_order=display_order,
            created_by=created_by,
        )
        self._db.add(product)
        await self._db.flush()
        return product

    async def update_product(
        self,
        product: MasterProduct,
        **fields,
    ) -> MasterProduct:
        for k, v in fields.items():
            if v is not None:
                setattr(product, k, v)
        self._db.add(product)
        await self._db.flush()
        return product

    async def search_products(
        self,
        *,
        query: str | None = None,
        category_slug: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Sequence[MasterProduct]:
        """Simple name-based search (PostgreSQL ILIKE prefix + contains)."""
        stmt = (
            select(MasterProduct)
            .join(MasterCategory, MasterProduct.category_id == MasterCategory.id)
            .where(MasterProduct.is_active.is_(True))
            .order_by(MasterProduct.display_order, MasterProduct.name)
            .offset(offset)
            .limit(limit)
        )
        if query:
            pattern = f"%{query.strip()}%"
            stmt = stmt.where(MasterProduct.name.ilike(pattern))
        if category_slug:
            stmt = stmt.where(MasterCategory.slug == category_slug)
        result = await self._db.execute(stmt)
        return result.scalars().all()

    async def suggest_products(
        self, *, query: str, limit: int = 6
    ) -> Sequence[MasterProduct]:
        """Prefix-match for autocomplete."""
        pattern = f"{query.strip()}%"
        stmt = (
            select(MasterProduct)
            .where(MasterProduct.is_active.is_(True))
            .where(MasterProduct.name.ilike(pattern))
            .order_by(MasterProduct.display_order, MasterProduct.name)
            .limit(limit)
        )
        result = await self._db.execute(stmt)
        return result.scalars().all()
