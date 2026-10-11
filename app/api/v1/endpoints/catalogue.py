"""
app/api/v1/endpoints/catalogue.py
====================================
Master Product Catalogue endpoints.

Public routes (no auth required):
  GET  /catalogue                         List aggregated products (customer home)
  GET  /catalogue/suggest                 Autocomplete product name suggestions
  GET  /catalogue/categories              List root categories with subcategories
  GET  /catalogue/{product_id}            Master product detail
  GET  /catalogue/{product_id}/suppliers  Available farmers for a product

Admin-only routes (requires admin role):
  POST   /catalogue/admin/categories              Create category
  PUT    /catalogue/admin/categories/{id}         Update category
  POST   /catalogue/admin/products                Create master product
  GET    /catalogue/admin/products                List all master products (incl. inactive)
  PUT    /catalogue/admin/products/{id}           Update master product
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.catalogue import (
    CatalogueProductOut,
    CategoryCreateRequest,
    CategoryOut,
    CategoryUpdateRequest,
    MasterProductCreateRequest,
    MasterProductOut,
    MasterProductUpdateRequest,
    PaginatedCatalogueOut,
    ProductSuggestionOut,
)
from app.schemas.inventory import FarmerInventoryOut
from app.services.catalogue_service import (
    CatalogueService,
    CategoryNotFoundError,
    MasterProductNotFoundError,
    SlugAlreadyExistsError,
)
from app.services.inventory_service import InventoryService
from fastapi import HTTPException

router = APIRouter(prefix="/catalogue", tags=["Catalogue"])


# ─────────────────────────────────────────────────────────────────────────── #
# PUBLIC: Aggregated product listing (replaces GET /products for customers)
# ─────────────────────────────────────────────────────────────────────────── #

@router.get(
    "",
    response_model=PaginatedCatalogueOut,
    status_code=status.HTTP_200_OK,
    summary="Browse product catalogue",
    description=(
        "Returns aggregated products from the master catalogue. "
        "Each product shows best price, total stock across all farmers, and organic availability. "
        "Supports filtering by category, organic flag, and full-text search."
    ),
)
async def browse_catalogue(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None, description="Category slug to filter by"),
    organic: bool | None = Query(None, description="Filter by organic only"),
    q: str | None = Query(None, description="Search query"),
) -> PaginatedCatalogueOut:
    service = CatalogueService(db)
    return await service.list_catalogue(
        category_slug=category,
        organic_only=organic or False,
        query=q,
        page=page,
        page_size=page_size,
    )


# ─────────────────────────────────────────────────────────────────────────── #
# PUBLIC: Autocomplete suggestions
# ─────────────────────────────────────────────────────────────────────────── #

@router.get(
    "/suggest",
    response_model=list[ProductSuggestionOut],
    status_code=status.HTTP_200_OK,
    summary="Product name autocomplete",
    description="Returns up to 6 product name suggestions matching the given prefix.",
)
async def suggest_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1, description="Search prefix"),
    limit: int = Query(6, ge=1, le=20),
) -> list[ProductSuggestionOut]:
    service = CatalogueService(db)
    return await service.suggest(query=q, limit=limit)


# ─────────────────────────────────────────────────────────────────────────── #
# PUBLIC: Category listing
# ─────────────────────────────────────────────────────────────────────────── #

@router.get(
    "/categories",
    response_model=list[CategoryOut],
    status_code=status.HTTP_200_OK,
    summary="List product categories",
    description="Returns all root categories, each with their subcategories nested inside.",
)
async def list_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[CategoryOut]:
    service = CatalogueService(db)
    return await service.list_categories()


# ─────────────────────────────────────────────────────────────────────────── #
# PUBLIC: Product detail
# ─────────────────────────────────────────────────────────────────────────── #

@router.get(
    "/{product_id}",
    response_model=MasterProductOut,
    status_code=status.HTTP_200_OK,
    summary="Get master product detail",
)
async def get_product(
    product_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MasterProductOut:
    service = CatalogueService(db)
    try:
        return await service.get_master_product(product_id)
    except MasterProductNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────── #
# PUBLIC: Available suppliers for a product
# ─────────────────────────────────────────────────────────────────────────── #

@router.get(
    "/{product_id}/suppliers",
    response_model=list[FarmerInventoryOut],
    status_code=status.HTTP_200_OK,
    summary="List farmers selling this product",
    description="Returns all available farmer suppliers for the given master product, sorted by best price.",
)
async def list_product_suppliers(
    product_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    organic: bool | None = Query(None, description="Filter organic suppliers only"),
) -> list[FarmerInventoryOut]:
    service = InventoryService(db)
    return await service.list_suppliers_for_product(
        master_product_id=product_id,
        organic_only=organic or False,
    )


# ─────────────────────────────────────────────────────────────────────────── #
# ADMIN: Category management
# ─────────────────────────────────────────────────────────────────────────── #

@router.post(
    "/admin/categories",
    response_model=CategoryOut,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create a product category",
)
async def admin_create_category(
    body: CategoryCreateRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CategoryOut:
    service = CatalogueService(db)
    try:
        return await service.create_category(
            requesting_user=current_user,
            name=body.name,
            slug=body.slug,
            parent_id=body.parent_id,
            icon_emoji=body.icon_emoji,
            image_url=body.image_url,
            display_order=body.display_order,
        )
    except SlugAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except CategoryNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put(
    "/admin/categories/{category_id}",
    response_model=CategoryOut,
    status_code=status.HTTP_200_OK,
    summary="[Admin] Update a category",
)
async def admin_update_category(
    category_id: int,
    body: CategoryUpdateRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CategoryOut:
    service = CatalogueService(db)
    try:
        return await service.update_category(
            requesting_user=current_user,
            category_id=category_id,
            **body.model_dump(exclude_none=True),
        )
    except CategoryNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────── #
# ADMIN: Master product management
# ─────────────────────────────────────────────────────────────────────────── #

@router.post(
    "/admin/products",
    response_model=MasterProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Add a product to the master catalogue",
)
async def admin_create_master_product(
    body: MasterProductCreateRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MasterProductOut:
    service = CatalogueService(db)
    try:
        return await service.create_master_product(
            requesting_user=current_user,
            category_id=body.category_id,
            name=body.name,
            slug=body.slug,
            description=body.description,
            default_unit=body.default_unit,
            image_url=body.image_url,
            tags=body.tags,
            storage_info=body.storage_info,
            shelf_life_days=body.shelf_life_days,
            is_seasonal=body.is_seasonal,
            display_order=body.display_order,
        )
    except SlugAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except CategoryNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/admin/products",
    response_model=PaginatedCatalogueOut,
    status_code=status.HTTP_200_OK,
    summary="[Admin] List all master products",
)
async def admin_list_master_products(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    q: str | None = Query(None),
) -> PaginatedCatalogueOut:
    service = CatalogueService(db)
    # Admin list includes products even with zero inventory
    return await service.list_catalogue(
        category_slug=category,
        query=q,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/admin/products/{product_id}",
    response_model=MasterProductOut,
    status_code=status.HTTP_200_OK,
    summary="[Admin] Update a master product",
)
async def admin_update_master_product(
    product_id: int,
    body: MasterProductUpdateRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MasterProductOut:
    service = CatalogueService(db)
    try:
        return await service.update_master_product(
            requesting_user=current_user,
            product_id=product_id,
            **body.model_dump(exclude_none=True),
        )
    except MasterProductNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
