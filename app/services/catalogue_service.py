"""
app/services/catalogue_service.py
===================================
Business logic for the Master Product Catalogue.

Admin-owned operations:
  - Create/update/deactivate categories
  - Create/update/deactivate master products

Public operations:
  - List categories with subcategories
  - List / search master products with aggregated inventory data
  - Autocomplete suggestions
"""

import math
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalogue import MasterCategory, MasterProduct
from app.models.user import User, UserRole
from app.repositories.catalogue_repository import CatalogueRepository
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.catalogue import (
    CatalogueProductOut,
    CategoryOut,
    MasterProductOut,
    PaginatedCatalogueOut,
    ProductSuggestionOut,
)


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class CategoryNotFoundError(Exception):
    pass


class MasterProductNotFoundError(Exception):
    pass


class SlugAlreadyExistsError(Exception):
    pass


# ---------------------------------------------------------------------------
# Helper: model → schema
# ---------------------------------------------------------------------------

def _category_to_out(cat: MasterCategory, *, include_children: bool = False) -> CategoryOut:
    children = []
    if include_children and cat.children:
        children = [_category_to_out(c) for c in cat.children if c.is_active]
    return CategoryOut(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        parent_id=cat.parent_id,
        icon_emoji=cat.icon_emoji,
        image_url=cat.image_url,
        display_order=cat.display_order,
        is_active=cat.is_active,
        subcategories=children,
    )


def _product_to_out(p: MasterProduct, cat: MasterCategory | None = None) -> MasterProductOut:
    return MasterProductOut(
        id=p.id,
        name=p.name,
        slug=p.slug,
        description=p.description,
        default_unit=p.default_unit,
        image_url=p.image_url,
        tags=p.tags,
        storage_info=p.storage_info,
        shelf_life_days=p.shelf_life_days,
        is_seasonal=p.is_seasonal,
        is_active=p.is_active,
        display_order=p.display_order,
        category_id=p.category_id,
        category_name=cat.name if cat else None,
        category_slug=cat.slug if cat else None,
        created_at=p.created_at.isoformat(),
        updated_at=p.updated_at.isoformat(),
    )


def _row_to_catalogue_out(row: dict) -> CatalogueProductOut:
    return CatalogueProductOut(
        id=row["id"],
        name=row["name"],
        slug=row["slug"],
        description=row.get("description"),
        default_unit=row["default_unit"],
        image_url=row.get("image_url"),
        is_seasonal=row.get("is_seasonal", False),
        shelf_life_days=row.get("shelf_life_days"),
        category_id=row["category_id"],
        category_name=row["category_name"],
        category_slug=row["category_slug"],
        category_icon=row.get("category_icon"),
        min_price=float(row["min_price"] or 0),
        max_price=float(row["max_price"] or 0),
        total_stock=int(row["total_stock"] or 0),
        farmer_count=int(row["farmer_count"] or 0),
        has_organic=bool(row.get("has_organic", False)),
    )


# ---------------------------------------------------------------------------
# CatalogueService
# ---------------------------------------------------------------------------

class CatalogueService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = CatalogueRepository(db)
        self._inv_repo = InventoryRepository(db)

    # ------------------------------------------------------------------ #
    # Category operations
    # ------------------------------------------------------------------ #

    async def list_categories(self, *, include_inactive: bool = False) -> list[CategoryOut]:
        """
        Return all root categories, each with their subcategories nested inside.
        """
        roots = await self._repo.list_categories(include_inactive=include_inactive)
        result = []
        for root in roots:
            # Eagerly load children (one extra query per root)
            await self._db.refresh(root, ["children"])
            result.append(_category_to_out(root, include_children=True))
        return result

    async def get_category(self, category_id: int) -> CategoryOut:
        cat = await self._repo.get_category_by_id(category_id)
        if not cat:
            raise CategoryNotFoundError(f"Category {category_id} not found.")
        await self._db.refresh(cat, ["children"])
        return _category_to_out(cat, include_children=True)

    async def create_category(
        self,
        *,
        requesting_user: User,
        name: str,
        slug: str,
        parent_id: int | None = None,
        icon_emoji: str | None = None,
        image_url: str | None = None,
        display_order: int = 0,
    ) -> CategoryOut:
        _require_super_admin(requesting_user)
        # Check slug uniqueness
        existing = await self._repo.get_category_by_slug(slug)
        if existing:
            raise SlugAlreadyExistsError(f"Slug '{slug}' is already in use.")
        if parent_id:
            parent = await self._repo.get_category_by_id(parent_id)
            if not parent:
                raise CategoryNotFoundError(f"Parent category {parent_id} not found.")
        cat = await self._repo.create_category(
            name=name, slug=slug, parent_id=parent_id,
            icon_emoji=icon_emoji, image_url=image_url, display_order=display_order,
        )
        await self._db.commit()
        return _category_to_out(cat)

    async def update_category(
        self,
        *,
        requesting_user: User,
        category_id: int,
        **fields,
    ) -> CategoryOut:
        _require_super_admin(requesting_user)
        cat = await self._repo.get_category_by_id(category_id)
        if not cat:
            raise CategoryNotFoundError(f"Category {category_id} not found.")
        cat = await self._repo.update_category(cat, **fields)
        await self._db.commit()
        return _category_to_out(cat)

    # ------------------------------------------------------------------ #
    # Master product operations
    # ------------------------------------------------------------------ #

    async def get_master_product(self, product_id: int) -> MasterProductOut:
        p = await self._repo.get_product_by_id(product_id)
        if not p:
            raise MasterProductNotFoundError(f"Product {product_id} not found.")
        cat = await self._repo.get_category_by_id(p.category_id)
        return _product_to_out(p, cat)

    async def get_master_product_by_slug(self, slug: str) -> MasterProductOut:
        p = await self._repo.get_product_by_slug(slug)
        if not p:
            raise MasterProductNotFoundError(f"Product slug '{slug}' not found.")
        cat = await self._repo.get_category_by_id(p.category_id)
        return _product_to_out(p, cat)

    async def create_master_product(
        self,
        *,
        requesting_user: User,
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
    ) -> MasterProductOut:
        _require_super_admin(requesting_user)
        existing = await self._repo.get_product_by_slug(slug)
        if existing:
            raise SlugAlreadyExistsError(f"Slug '{slug}' is already in use.")
        cat = await self._repo.get_category_by_id(category_id)
        if not cat:
            raise CategoryNotFoundError(f"Category {category_id} not found.")
        p = await self._repo.create_product(
            category_id=category_id, name=name, slug=slug, description=description,
            default_unit=default_unit, image_url=image_url, tags=tags,
            storage_info=storage_info, shelf_life_days=shelf_life_days,
            is_seasonal=is_seasonal, display_order=display_order,
            created_by=requesting_user.id,
        )
        await self._db.commit()
        return _product_to_out(p, cat)

    async def update_master_product(
        self,
        *,
        requesting_user: User,
        product_id: int,
        **fields,
    ) -> MasterProductOut:
        _require_super_admin(requesting_user)
        p = await self._repo.get_product_by_id(product_id)
        if not p:
            raise MasterProductNotFoundError(f"Product {product_id} not found.")
        p = await self._repo.update_product(p, **fields)
        await self._db.commit()
        cat = await self._repo.get_category_by_id(p.category_id)
        return _product_to_out(p, cat)

    # ------------------------------------------------------------------ #
    # Public listing / search
    # ------------------------------------------------------------------ #

    async def list_catalogue(
        self,
        *,
        category_slug: str | None = None,
        organic_only: bool = False,
        query: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedCatalogueOut:
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        rows = await self._inv_repo.get_aggregated_catalogue(
            category_slug=category_slug,
            organic_only=organic_only,
            query=query,
            offset=offset,
            limit=page_size,
        )
        total = await self._inv_repo.count_aggregated_catalogue(
            category_slug=category_slug,
            organic_only=organic_only,
            query=query,
        )
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        return PaginatedCatalogueOut(
            items=[_row_to_catalogue_out(r) for r in rows],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def suggest(self, *, query: str, limit: int = 6) -> list[ProductSuggestionOut]:
        if not query or len(query.strip()) < 1:
            return []
        products = await self._repo.suggest_products(query=query, limit=limit)
        result = []
        for p in products:
            cat = await self._repo.get_category_by_id(p.category_id)
            result.append(ProductSuggestionOut(
                id=p.id,
                name=p.name,
                slug=p.slug,
                category_name=cat.name if cat else None,
                category_icon=cat.icon_emoji if cat else None,
                default_unit=p.default_unit,
            ))
        return result


# ---------------------------------------------------------------------------
# Guard helpers
# ---------------------------------------------------------------------------

def _require_super_admin(user: User) -> None:
    """Raise PermissionError if user is not a super_admin."""
    from app.core.exceptions import PermissionDeniedError
    if user.role not in (UserRole.admin,):
        raise PermissionDeniedError("Only admins can manage the master catalogue.")
