"""
app/services/product_service.py
=================================
Business logic for the product lifecycle.

Key rules enforced here (not at the HTTP layer):
  1. Only approved farmers can create products.
  2. Farmer must own the product to update or delete it.
  3. Price > 0, quantity >= 0 (enforced at schema level, double-checked here).
  4. Products with harvest_date past PRODUCT_EXPIRY_DAYS are filtered at
     query level; creating an already-expired product is blocked.
"""

import math
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    FarmerNotApprovedError,
    FarmerNotFoundError,
    PermissionDeniedError,
    ProductForbiddenError,
    ProductNotFoundError,
)
from app.models.product import Product
from app.models.user import User, UserRole
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.product import (
    PaginatedProductsOut,
    ProductOut,
    UpdateProductRequest,
)


def _product_to_out(product: Product) -> ProductOut:
    return ProductOut(
        id=product.id,
        farmer_id=product.farmer_id,
        name=product.name,
        description=product.description,
        price=float(product.price),
        quantity=product.quantity,
        unit=product.unit,
        harvest_date=product.harvest_date.isoformat(),
        image_url=product.image_url,
        is_active=product.is_active,
        created_at=product.created_at.isoformat(),
        updated_at=product.updated_at.isoformat(),
    )


class ProductService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._product_repo = ProductRepository(db)
        self._farmer_repo = FarmerRepository(db)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_approved_farmer_for_user(self, user: User):
        """
        Fetch the farmer profile for `user` and assert it is approved.

        Raises:
            PermissionDeniedError  – user is not a farmer
            FarmerNotFoundError    – user has no farmer profile yet
            FarmerNotApprovedError – profile exists but not yet approved
        """
        if user.role != UserRole.farmer:
            raise PermissionDeniedError("Only farmers can perform this action.")

        farmer = await self._farmer_repo.get_by_user_id(user.id)
        if farmer is None:
            raise FarmerNotFoundError(
                "You do not have a farmer profile. Please create one first."
            )
        if not farmer.is_approved:
            raise FarmerNotApprovedError()
        return farmer

    # ------------------------------------------------------------------
    # 1. Create product
    # ------------------------------------------------------------------

    async def create_product(
        self,
        *,
        requesting_user: User,
        name: str,
        description: str | None,
        price: float,
        quantity: int,
        unit: str,
        harvest_date: date,
        image_url: str,
    ) -> ProductOut:
        """
        Create a product listing.

        Guards:
          - requesting_user must be an approved farmer.

        Raises:
            PermissionDeniedError  – not a farmer
            FarmerNotFoundError    – no profile
            FarmerNotApprovedError – not yet approved
        """
        farmer = await self._get_approved_farmer_for_user(requesting_user)

        product = await self._product_repo.create(
            farmer_id=farmer.id,
            name=name,
            description=description,
            price=float(price),
            quantity=quantity,
            unit=unit,
            harvest_date=harvest_date,
            image_url=image_url,
        )
        return _product_to_out(product)

    # ------------------------------------------------------------------
    # 2. List active products (public)
    # ------------------------------------------------------------------

    async def list_products(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        farmer_id: int | None = None,
    ) -> PaginatedProductsOut:
        """
        Return a paginated list of active, non-expired products.

        Anyone (including unauthenticated callers) can read this endpoint.
        """
        page = max(1, page)
        page_size = min(max(1, page_size), 100)  # clamp between 1 and 100
        offset = (page - 1) * page_size

        products = await self._product_repo.list_active(
            offset=offset,
            limit=page_size,
            farmer_id=farmer_id,
        )
        total = await self._product_repo.count_active(farmer_id=farmer_id)
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        return PaginatedProductsOut(
            items=[_product_to_out(p) for p in products],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 2b. List farmer's own products (farmer-only, includes inactive)
    # ------------------------------------------------------------------

    async def list_my_products(
        self,
        *,
        requesting_user: User,
        page: int = 1,
        page_size: int = 50,
    ) -> PaginatedProductsOut:
        """
        Return all products created by the authenticated farmer,
        including inactive / soft-deleted ones.

        Raises:
            PermissionDeniedError – not a farmer
            FarmerNotFoundError   – no farmer profile
        """
        if requesting_user.role != UserRole.farmer:
            raise PermissionDeniedError("Only farmers can view their own product listings.")

        farmer = await self._farmer_repo.get_by_user_id(requesting_user.id)
        if farmer is None:
            raise FarmerNotFoundError("You do not have a farmer profile.")

        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        products = await self._product_repo.list_all_for_farmer(
            farmer_id=farmer.id, offset=offset, limit=page_size
        )
        total = await self._product_repo.count_all_for_farmer(farmer_id=farmer.id)
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        return PaginatedProductsOut(
            items=[_product_to_out(p) for p in products],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 3. Get single product (public)
    # ------------------------------------------------------------------

    async def get_product(self, *, product_id: int) -> ProductOut:
        """
        Fetch a product by ID.  Returns even inactive products (so the
        farmer can see their own soft-deleted listings if needed).

        Raises:
            ProductNotFoundError – not found
        """
        product = await self._product_repo.get_by_id(product_id)
        if product is None:
            raise ProductNotFoundError()
        return _product_to_out(product)

    # ------------------------------------------------------------------
    # 4. Update product
    # ------------------------------------------------------------------

    async def update_product(
        self,
        *,
        product_id: int,
        requesting_user: User,
        updates: UpdateProductRequest,
    ) -> ProductOut:
        """
        Partially update a product.

        Guards:
          - requesting_user must be an approved farmer.
          - Farmer must own the product.

        Raises:
            PermissionDeniedError  – not a farmer
            FarmerNotFoundError    – no profile
            FarmerNotApprovedError – not yet approved
            ProductNotFoundError   – product_id not found
            ProductForbiddenError  – farmer does not own this product
        """
        farmer = await self._get_approved_farmer_for_user(requesting_user)

        product = await self._product_repo.get_by_id(product_id)
        if product is None:
            raise ProductNotFoundError()
        if product.farmer_id != farmer.id:
            raise ProductForbiddenError()

        # Coerce Decimal → float for storage
        price_val = float(updates.price) if updates.price is not None else None

        updated = await self._product_repo.update(
            product,
            name=updates.name,
            description=updates.description,
            price=price_val,
            quantity=updates.quantity,
            unit=updates.unit,
            harvest_date=updates.harvest_date,
            image_url=updates.image_url,
        )
        return _product_to_out(updated)

    # ------------------------------------------------------------------
    # 5. Soft-delete product
    # ------------------------------------------------------------------

    async def delete_product(
        self,
        *,
        product_id: int,
        requesting_user: User,
    ) -> dict:
        """
        Soft-delete a product (sets is_active = False).

        Guards:
          - requesting_user must be an approved farmer.
          - Farmer must own the product.

        Raises:
            PermissionDeniedError  – not a farmer
            FarmerNotFoundError    – no profile
            FarmerNotApprovedError – not yet approved
            ProductNotFoundError   – product_id not found
            ProductForbiddenError  – farmer does not own this product
        """
        farmer = await self._get_approved_farmer_for_user(requesting_user)

        product = await self._product_repo.get_by_id(product_id)
        if product is None:
            raise ProductNotFoundError()
        if product.farmer_id != farmer.id:
            raise ProductForbiddenError()

        await self._product_repo.soft_delete(product)
        return {"message": f"Product '{product.name}' has been deactivated."}
