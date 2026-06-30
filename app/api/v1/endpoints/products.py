"""
app/api/v1/endpoints/products.py
==================================
Product CRUD endpoints.

Routes:
  POST   /products           – Create product (approved farmers only)
  GET    /products           – List active products (public)
  GET    /products/{id}      – Get product detail (public)
  PUT    /products/{id}      – Update product (owning approved farmer only)
  DELETE /products/{id}      – Soft-delete product (owning approved farmer only)
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.product import (
    CreateProductRequest,
    PaginatedProductsOut,
    ProductOut,
    UpdateProductRequest,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


# ---------------------------------------------------------------------------
# POST /products
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product listing",
    description=(
        "Creates a new product. "
        "The caller must be an authenticated, **approved** farmer. "
        "Unapproved farmers receive 403."
    ),
)
async def create_product(
    body: CreateProductRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProductOut:
    service = ProductService(db)
    return await service.create_product(
        requesting_user=current_user,
        name=body.name,
        description=body.description,
        price=float(body.price),
        quantity=body.quantity,
        unit=body.unit,
        harvest_date=body.harvest_date,
        image_url=body.image_url,
    )


# ---------------------------------------------------------------------------
# GET /products  (public)
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=PaginatedProductsOut,
    status_code=status.HTTP_200_OK,
    summary="List active products",
    description=(
        "Returns a paginated list of active, non-expired products. "
        "Public endpoint — no authentication required. "
        "Products older than PRODUCT_EXPIRY_DAYS are excluded automatically."
    ),
)
async def list_products(
    page: int = Query(1, ge=1, description="Page number (1-indexed)."),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)."),
    farmer_id: int | None = Query(None, description="Filter by farmer ID."),
    db: Annotated[AsyncSession, Depends(get_db)] = ...,
) -> PaginatedProductsOut:
    service = ProductService(db)
    return await service.list_products(
        page=page,
        page_size=page_size,
        farmer_id=farmer_id,
    )


# ---------------------------------------------------------------------------
# GET /products/my  (farmer-only — includes inactive)
# ---------------------------------------------------------------------------

@router.get(
    "/my",
    response_model=PaginatedProductsOut,
    status_code=status.HTTP_200_OK,
    summary="List my products",
    description=(
        "Returns all products created by the authenticated farmer, "
        "including inactive (soft-deleted) listings. "
        "Farmer role required."
    ),
)
async def list_my_products(
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
) -> PaginatedProductsOut:
    service = ProductService(db)
    return await service.list_my_products(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )


# ---------------------------------------------------------------------------
# GET /products/{product_id}  (public)
# ---------------------------------------------------------------------------

@router.get(
    "/{product_id}",
    response_model=ProductOut,
    status_code=status.HTTP_200_OK,
    summary="Get a product by ID",
    description="Returns full product details. Public endpoint.",
)
async def get_product(
    product_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProductOut:
    service = ProductService(db)
    return await service.get_product(product_id=product_id)


# ---------------------------------------------------------------------------
# PUT /products/{product_id}
# ---------------------------------------------------------------------------

@router.put(
    "/{product_id}",
    response_model=ProductOut,
    status_code=status.HTTP_200_OK,
    summary="Update a product",
    description=(
        "Partially update a product listing. "
        "Only the owning approved farmer may update their own products. "
        "Send only the fields you wish to change."
    ),
)
async def update_product(
    product_id: int,
    body: UpdateProductRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProductOut:
    service = ProductService(db)
    return await service.update_product(
        product_id=product_id,
        requesting_user=current_user,
        updates=body,
    )


# ---------------------------------------------------------------------------
# DELETE /products/{product_id}  (soft delete)
# ---------------------------------------------------------------------------

@router.delete(
    "/{product_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Soft-delete a product",
    description=(
        "Sets is_active=False for the product (soft delete). "
        "Only the owning approved farmer can delete their products."
    ),
)
async def delete_product(
    product_id: int,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    service = ProductService(db)
    return await service.delete_product(
        product_id=product_id,
        requesting_user=current_user,
    )
