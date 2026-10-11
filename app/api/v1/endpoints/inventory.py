"""
app/api/v1/endpoints/inventory.py
====================================
Farmer Inventory endpoints.

Farmer-only routes (requires approved farmer role):
  POST   /inventory           Add inventory entry for a master product
  GET    /inventory/my        List own inventory entries
  PUT    /inventory/{id}      Update price / quantity / organic / harvest date
  DELETE /inventory/{id}      Deactivate (soft-remove) an inventory entry
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.inventory import (
    InventoryCreateRequest,
    InventoryOut,
    InventoryUpdateRequest,
    PaginatedInventoryOut,
)
from app.services.inventory_service import (
    InventoryService,
    InventoryAlreadyExistsError,
    InventoryNotFoundError,
    MasterProductNotFoundError,
)
from app.core.exceptions import PermissionDeniedError, FarmerNotApprovedError
from fastapi import HTTPException

router = APIRouter(prefix="/inventory", tags=["Inventory"])


# ─────────────────────────────────────────────────────────────────────────── #
# POST /inventory  — Add inventory entry
# ─────────────────────────────────────────────────────────────────────────── #

@router.post(
    "",
    response_model=InventoryOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add your stock for a master product",
    description=(
        "Approved farmer creates an inventory entry for an existing master catalogue product. "
        "Only one entry per product per farmer is allowed. "
        "To update existing stock, use PUT /inventory/{id}."
    ),
)
async def add_inventory(
    body: InventoryCreateRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InventoryOut:
    service = InventoryService(db)
    try:
        return await service.add_inventory(
            requesting_user=current_user,
            master_product_id=body.master_product_id,
            price=body.price,
            quantity=body.quantity,
            unit=body.unit,
            is_organic=body.is_organic,
            harvest_date=body.harvest_date,
            notes=body.notes,
        )
    except MasterProductNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InventoryAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except FarmerNotApprovedError:
        raise HTTPException(status_code=403, detail="Your farmer account is not yet approved.")
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────── #
# GET /inventory/my  — List own inventory
# ─────────────────────────────────────────────────────────────────────────── #

@router.get(
    "/my",
    response_model=PaginatedInventoryOut,
    status_code=status.HTTP_200_OK,
    summary="List my inventory entries",
    description="Returns all inventory entries created by the authenticated farmer.",
)
async def list_my_inventory(
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    include_inactive: bool = Query(False, description="Include deactivated entries"),
) -> PaginatedInventoryOut:
    service = InventoryService(db)
    try:
        return await service.list_my_inventory(
            requesting_user=current_user,
            page=page,
            page_size=page_size,
            include_inactive=include_inactive,
        )
    except FarmerNotApprovedError:
        raise HTTPException(status_code=403, detail="Your farmer account is not yet approved.")
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────── #
# PUT /inventory/{inventory_id}  — Update entry
# ─────────────────────────────────────────────────────────────────────────── #

@router.put(
    "/{inventory_id}",
    response_model=InventoryOut,
    status_code=status.HTTP_200_OK,
    summary="Update an inventory entry",
    description=(
        "Update price, quantity, organic flag, harvest date or notes "
        "for an existing inventory entry. Send only fields you wish to change. "
        "Only the owning farmer can update their own entries."
    ),
)
async def update_inventory(
    inventory_id: int,
    body: InventoryUpdateRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InventoryOut:
    service = InventoryService(db)
    try:
        return await service.update_inventory(
            requesting_user=current_user,
            inventory_id=inventory_id,
            **body.model_dump(exclude_none=True),
        )
    except InventoryNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FarmerNotApprovedError:
        raise HTTPException(status_code=403, detail="Your farmer account is not yet approved.")
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────── #
# DELETE /inventory/{inventory_id}  — Deactivate entry
# ─────────────────────────────────────────────────────────────────────────── #

@router.delete(
    "/{inventory_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Remove an inventory listing",
    description=(
        "Soft-deactivates the inventory entry (sets is_active=False). "
        "The entry is no longer visible to customers. "
        "Only the owning farmer can remove their listings."
    ),
)
async def deactivate_inventory(
    inventory_id: int,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    service = InventoryService(db)
    try:
        return await service.deactivate_inventory(
            requesting_user=current_user,
            inventory_id=inventory_id,
        )
    except InventoryNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FarmerNotApprovedError:
        raise HTTPException(status_code=403, detail="Your farmer account is not yet approved.")
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
