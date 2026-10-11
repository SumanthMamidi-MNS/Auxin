"""
app/api/v1/endpoints/profile.py
================================
User profile endpoints.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_for_profile
from app.core.exceptions import AddressNotFoundError, ProfileNotFoundError
from app.db.session import get_db
from app.models.user import User, UserStatus
from app.repositories.address_repository import AddressRepository
from app.repositories.user_repository import UserRepository
from app.schemas.profile import (
    AddressCreate,
    AddressOut,
    AddressUpdate,
    CreateProfileRequest,
    ProfileOut,
    UpdateProfileRequest,
)

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get(
    "/me",
    response_model=ProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Get own profile",
    description="Returns the profile of the currently authenticated user with their addresses.",
)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileOut:
    if not current_user.address:
        # Address is None if they haven't created a profile yet
        raise ProfileNotFoundError("Profile has not been set up yet. Address is missing.")

    addr_repo = AddressRepository(db)
    addresses = await addr_repo.list_for_user(current_user.id)

    return ProfileOut(
        id=current_user.id,
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        address=current_user.address,
        role=current_user.role,
        status=current_user.status,
        addresses=[AddressOut.model_validate(addr) for addr in addresses],
    )
async def _sync_role_profile(
    db: AsyncSession,
    user: User,
    location: str | None = None,
    farm_name: str | None = None,
    farm_category: str | None = None,
) -> None:
    from app.repositories.farmer_repository import FarmerRepository
    from app.repositories.delivery_partner_repository import DeliveryPartnerRepository
    from app.core.encryption import encrypt_field
    from app.models.user import UserRole

    if user.role == UserRole.farmer:
        farmer_repo = FarmerRepository(db)
        farmer = await farmer_repo.get_by_user_id(user.id)
        if not farmer:
            await farmer_repo.create(
                user_id=user.id,
                full_name=user.name,
                phone=user.phone,
                location=location or user.address or "Location not set",
                bank_account_number=encrypt_field("0000000000"),
                ifsc_code="AAAA0000000",
                farm_name=farm_name,
                farm_category=farm_category,
            )
        else:
            farmer.full_name = user.name
            farmer.phone = user.phone
            if location or user.address:
                farmer.location = location or user.address
            if farm_name:
                farmer.farm_name = farm_name
            if farm_category:
                farmer.farm_category = farm_category
            db.add(farmer)
            await db.flush()
    elif user.role == UserRole.delivery:
        dp_repo = DeliveryPartnerRepository(db)
        dp = await dp_repo.get_by_user_id(user.id)
        if not dp:
            await dp_repo.create(
                user_id=user.id,
                full_name=user.name,
                phone=user.phone,
            )
        else:
            dp.full_name = user.name
            dp.phone = user.phone
            db.add(dp)
            await db.flush()


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
    user_repo = UserRepository(db)
    addr_repo = AddressRepository(db)

    # 1. Update profile fields (name and phone)
    updated_user = await user_repo.update_profile(
        current_user,
        name=body.name,
        phone=body.phone,
    )

    # Check if a default address already exists for this user
    default_address = await addr_repo.get_default(current_user.id)

    if default_address is not None:
        # Update existing default address instead of creating a new one
        first_address = await addr_repo.update(
            default_address,
            house_flat=body.house_flat,
            building=body.building,
            street=body.street,
            area=body.area,
            landmark=body.landmark,
            city=body.city,
            state=body.state,
            pin_code=body.pin_code,
            address_type=body.address_type,
            is_default=True,
            latitude=body.latitude,
            longitude=body.longitude,
        )
    else:
        # Create the first default address
        first_address = await addr_repo.create(
            user_id=current_user.id,
            house_flat=body.house_flat,
            building=body.building,
            street=body.street,
            area=body.area,
            landmark=body.landmark,
            city=body.city,
            state=body.state,
            pin_code=body.pin_code,
            address_type=body.address_type,
            is_default=True,
            latitude=body.latitude,
            longitude=body.longitude,
        )

    if current_user.status == UserStatus.rejected:
        updated_user.status = UserStatus.pending
        updated_user.rejected_at = None
        updated_user.rejection_reason = None
        db.add(updated_user)

    # Automatically create or sync farmer/delivery profiles
    await _sync_role_profile(
        db, 
        updated_user, 
        first_address.to_formatted_string() if first_address else None,
        farm_name=body.farm_name,
        farm_category=body.farm_category,
    )

    await db.commit()
    await db.refresh(updated_user)

    addresses = await addr_repo.list_for_user(updated_user.id)

    return ProfileOut(
        id=updated_user.id,
        name=updated_user.name,
        phone=updated_user.phone,
        email=updated_user.email,
        address=updated_user.address,
        role=updated_user.role,
        status=updated_user.status,
        addresses=[AddressOut.model_validate(addr) for addr in addresses],
    )


@router.put(
    "",
    response_model=ProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Update profile name and phone",
    description="Updates the profile for the authenticated user. Email is locked and cannot be changed.",
)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileOut:
    user_repo = UserRepository(db)
    addr_repo = AddressRepository(db)

    # Update profile fields (email is locked forever)
    updated_user = await user_repo.update_profile(
        current_user,
        name=body.name,
        phone=body.phone,
    )
    if current_user.status == UserStatus.rejected:
        updated_user.status = UserStatus.pending
        updated_user.rejected_at = None
        updated_user.rejection_reason = None
        db.add(updated_user)

    # Automatically create or sync farmer/delivery profiles
    await _sync_role_profile(db, updated_user)

    await db.commit()
    await db.refresh(updated_user)

    addresses = await addr_repo.list_for_user(updated_user.id)

    return ProfileOut(
        id=updated_user.id,
        name=updated_user.name,
        phone=updated_user.phone,
        email=updated_user.email,
        address=updated_user.address,
        role=updated_user.role,
        status=updated_user.status,
        addresses=[AddressOut.model_validate(addr) for addr in addresses],
    )


@router.post(
    "/resubmit",
    response_model=ProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Resubmit profile application",
    description="Resubmits a rejected farmer or delivery partner application, setting status back to pending.",
)
async def resubmit_profile(
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileOut:
    from app.core.exceptions import UserInvalidStatusTransitionError
    if current_user.status != UserStatus.rejected:
        raise UserInvalidStatusTransitionError("Only rejected profiles can be resubmitted.")

    current_user.status = UserStatus.pending
    current_user.rejected_at = None
    current_user.rejection_reason = None
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    addr_repo = AddressRepository(db)
    addresses = await addr_repo.list_for_user(current_user.id)

    return ProfileOut(
        id=current_user.id,
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        address=current_user.address,
        role=current_user.role,
        status=current_user.status,
        addresses=[AddressOut.model_validate(addr) for addr in addresses],
    )


# ===========================================================================
# Structured Address Sub-routes
# ===========================================================================

@router.get(
    "/addresses",
    response_model=list[AddressOut],
    status_code=status.HTTP_200_OK,
    summary="List user addresses",
)
async def list_addresses(
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AddressOut]:
    addr_repo = AddressRepository(db)
    addresses = await addr_repo.list_for_user(current_user.id)
    return [AddressOut.model_validate(addr) for addr in addresses]


@router.post(
    "/addresses",
    response_model=AddressOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create address",
)
async def create_address(
    body: AddressCreate,
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AddressOut:
    addr_repo = AddressRepository(db)
    address = await addr_repo.create(
        user_id=current_user.id,
        house_flat=body.house_flat,
        building=body.building,
        street=body.street,
        area=body.area,
        landmark=body.landmark,
        city=body.city,
        state=body.state,
        pin_code=body.pin_code,
        address_type=body.address_type,
        is_default=body.is_default,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    await db.commit()
    await db.refresh(address)
    return AddressOut.model_validate(address)


@router.put(
    "/addresses/{address_id}",
    response_model=AddressOut,
    status_code=status.HTTP_200_OK,
    summary="Update address",
)
async def update_address(
    address_id: int,
    body: AddressUpdate,
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AddressOut:
    addr_repo = AddressRepository(db)
    address = await addr_repo.get_by_id(address_id)
    if not address or address.user_id != current_user.id:
        raise AddressNotFoundError()

    # Get non-None updates to pass to update method
    updates = body.model_dump(exclude_unset=True)
    updated_address = await addr_repo.update(address, **updates)
    await db.commit()
    await db.refresh(updated_address)
    return AddressOut.model_validate(updated_address)


@router.delete(
    "/addresses/{address_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete address",
)
async def delete_address(
    address_id: int,
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    addr_repo = AddressRepository(db)
    address = await addr_repo.get_by_id(address_id)
    if not address or address.user_id != current_user.id:
        raise AddressNotFoundError()

    await addr_repo.delete(address)
    await db.commit()
    return {"success": True}


@router.put(
    "/addresses/{address_id}/default",
    response_model=AddressOut,
    status_code=status.HTTP_200_OK,
    summary="Set default address",
)
async def set_default_address(
    address_id: int,
    current_user: Annotated[User, Depends(get_current_user_for_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AddressOut:
    addr_repo = AddressRepository(db)
    address = await addr_repo.set_default(current_user.id, address_id)
    if not address:
        raise AddressNotFoundError()

    await db.commit()
    await db.refresh(address)
    return AddressOut.model_validate(address)
