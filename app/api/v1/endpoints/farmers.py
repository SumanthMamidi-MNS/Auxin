"""
app/api/v1/endpoints/farmers.py
================================
Farmer profile endpoints.

Routes:
  POST   /farmers/profile              – Create farmer profile (farmer only)
  GET    /farmers/profile/me           – Get own farmer profile (farmer only)
  GET    /farmers/{farmer_id}          – Get any farmer profile (authenticated)
  POST   /farmers/{farmer_id}/approve  – Approve farmer (admin only)
  POST   /farmers/{farmer_id}/revoke   – Revoke approval (admin only)
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles, require_roles_for_profile
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.farmer import (
    CreateFarmerProfileRequest,
    FarmerApprovalOut,
    FarmerProfileOut,
    UpdateFarmerProfileRequest,
)
from app.services.farmer_service import FarmerService

router = APIRouter(prefix="/farmers", tags=["Farmers"])


# ---------------------------------------------------------------------------
# POST /farmers/profile
# ---------------------------------------------------------------------------

@router.post(
    "/profile",
    response_model=FarmerProfileOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create farmer profile",
    description=(
        "Creates a farmer profile for the authenticated user. "
        "The user must have role='farmer'. "
        "Only one profile is allowed per account."
    ),
)
async def create_farmer_profile(
    body: CreateFarmerProfileRequest,
    current_user: Annotated[User, Depends(require_roles_for_profile(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FarmerProfileOut:
    service = FarmerService(db)
    return await service.create_profile(
        requesting_user=current_user,
        full_name=body.full_name,
        phone=body.phone,
        location=body.location,
        bank_account_number=body.bank_account_number,
        ifsc_code=body.ifsc_code,
    )


# ---------------------------------------------------------------------------
# GET /farmers/profile/me
# ---------------------------------------------------------------------------

@router.get(
    "/profile/me",
    response_model=FarmerProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Get own farmer profile",
    description="Returns the farmer profile of the currently authenticated farmer.",
)
async def get_my_farmer_profile(
    current_user: Annotated[User, Depends(require_roles_for_profile(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FarmerProfileOut:
    service = FarmerService(db)
    return await service.get_profile(user_id=current_user.id)


# ---------------------------------------------------------------------------
# PUT /farmers/profile/me
# ---------------------------------------------------------------------------

@router.put(
    "/profile/me",
    response_model=FarmerProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Update own farmer profile",
)
async def update_my_farmer_profile(
    body: UpdateFarmerProfileRequest,
    current_user: Annotated[User, Depends(require_roles_for_profile(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FarmerProfileOut:
    service = FarmerService(db)
    return await service.update_profile(
        user_id=current_user.id,
        location=body.location,
        bank_name=body.bank_name,
        account_holder_name=body.account_holder_name,
        bank_account_number=body.bank_account_number,
        ifsc_code=body.ifsc_code,
        upi_id=body.upi_id,
        farm_name=body.farm_name,
        farm_category=body.farm_category,
    )


# ---------------------------------------------------------------------------
# GET /farmers/{farmer_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{farmer_id}",
    response_model=FarmerProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Get a farmer profile by ID",
    description="Returns a farmer profile. Requires authentication.",
)
async def get_farmer_profile(
    farmer_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FarmerProfileOut:
    service = FarmerService(db)
    return await service.get_profile_by_farmer_id(
        farmer_id=farmer_id,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# POST /farmers/{farmer_id}/approve  (admin only)
# ---------------------------------------------------------------------------

@router.post(
    "/{farmer_id}/approve",
    response_model=FarmerApprovalOut,
    status_code=status.HTTP_200_OK,
    summary="Approve a farmer profile",
    description="Admin-only. Marks a farmer as approved, enabling them to list products.",
)
async def approve_farmer(
    farmer_id: int,
    admin_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FarmerApprovalOut:
    service = FarmerService(db)
    return await service.approve_farmer(farmer_id=farmer_id, admin_user=admin_user)


# ---------------------------------------------------------------------------
# POST /farmers/{farmer_id}/revoke  (admin only)
# ---------------------------------------------------------------------------

@router.post(
    "/{farmer_id}/revoke",
    response_model=FarmerApprovalOut,
    status_code=status.HTTP_200_OK,
    summary="Revoke farmer approval",
    description="Admin-only. Revokes approval, preventing the farmer from listing products.",
)
async def revoke_farmer_approval(
    farmer_id: int,
    admin_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FarmerApprovalOut:
    service = FarmerService(db)
    return await service.revoke_farmer_approval(
        farmer_id=farmer_id, admin_user=admin_user
    )
