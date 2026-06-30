"""
app/api/v1/endpoints/profile.py
================================
User profile endpoints.

Routes:
  GET  /profile/me  - Get current user profile (returns 404 if address is not set)
  POST /profile     - Create profile (sets name, phone, address)
  PUT  /profile     - Update profile (updates name, phone, address)
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_for_profile
from app.core.exceptions import ProfileNotFoundError
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.profile import CreateProfileRequest, ProfileOut, UpdateProfileRequest

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get(
    "/me",
    response_model=ProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Get own profile",
    description="Returns the profile of the currently authenticated user. Raises 404 if no profile exists (address not set).",
)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
) -> ProfileOut:
    if not current_user.address:
        raise ProfileNotFoundError("Profile has not been set up yet. Address is missing.")

    return ProfileOut(
        id=current_user.id,
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        address=current_user.address,
        role=current_user.role,
        status=current_user.status,
    )


@router.post(
    "",
    response_model=ProfileOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create profile",
    description="Creates the profile for the authenticated user. Email is locked and read from session.",
)
async def create_profile(
    body: CreateProfileRequest,
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileOut:
    repo = UserRepository(db)
    
    # Update profile fields (email is locked forever)
    updated_user = await repo.update_profile(
        current_user,
        name=body.name,
        phone=body.phone,
        address=body.address,
    )
    await db.commit()
    await db.refresh(updated_user)

    return ProfileOut(
        id=updated_user.id,
        name=updated_user.name,
        phone=updated_user.phone,
        email=updated_user.email,
        address=updated_user.address,
        role=updated_user.role,
        status=updated_user.status,
    )


@router.put(
    "",
    response_model=ProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Update profile",
    description="Updates the profile for the authenticated user. Email is locked and cannot be changed.",
)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileOut:
    repo = UserRepository(db)
    
    # Update profile fields (email is locked forever)
    updated_user = await repo.update_profile(
        current_user,
        name=body.name,
        phone=body.phone,
        address=body.address,
    )
    await db.commit()
    await db.refresh(updated_user)

    return ProfileOut(
        id=updated_user.id,
        name=updated_user.name,
        phone=updated_user.phone,
        email=updated_user.email,
        address=updated_user.address,
        role=updated_user.role,
        status=updated_user.status,
    )
