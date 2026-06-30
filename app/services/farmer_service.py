"""
app/services/farmer_service.py
================================
Business logic for farmer profile management.

Responsibilities:
  1. create_profile  – role check → duplicate check → encrypt bank account → persist
  2. get_profile     – fetch and decrypt bank account for the owner
  3. approve_farmer  – admin action
  4. revoke_approval – admin action
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.encryption import encrypt_field
from app.core.exceptions import (
    FarmerNotFoundError,
    FarmerProfileExistsError,
    PermissionDeniedError,
)
from app.models.farmer import Farmer
from app.models.user import User, UserRole
from app.repositories.farmer_repository import FarmerRepository
from app.schemas.farmer import FarmerApprovalOut, FarmerProfileOut


def _to_out(farmer: Farmer) -> FarmerProfileOut:
    """Convert ORM Farmer → FarmerProfileOut (bank account is NOT included)."""
    return FarmerProfileOut(
        id=farmer.id,
        user_id=farmer.user_id,
        full_name=farmer.full_name,
        phone=farmer.phone,
        location=farmer.location,
        ifsc_code=farmer.ifsc_code,
        is_approved=farmer.is_approved,
        created_at=farmer.created_at.isoformat(),
    )


class FarmerService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._farmer_repo = FarmerRepository(db)

    # ------------------------------------------------------------------
    # 1. Create farmer profile
    # ------------------------------------------------------------------

    async def create_profile(
        self,
        *,
        requesting_user: User,
        full_name: str,
        phone: str,
        location: str,
        bank_account_number: str,
        ifsc_code: str,
    ) -> FarmerProfileOut:
        """
        Create a new farmer profile for `requesting_user`.

        Rules:
          - requesting_user.role must be UserRole.farmer
          - No existing profile may exist for this user (unique constraint)

        Raises:
            PermissionDeniedError    – user is not a farmer
            FarmerProfileExistsError – profile already exists
        """
        if requesting_user.role != UserRole.farmer:
            raise PermissionDeniedError(
                "Only users with the 'farmer' role can create a farmer profile."
            )

        existing = await self._farmer_repo.get_by_user_id(requesting_user.id)
        if existing is not None:
            raise FarmerProfileExistsError()

        encrypted_account = encrypt_field(bank_account_number)

        farmer = await self._farmer_repo.create(
            user_id=requesting_user.id,
            full_name=full_name,
            phone=phone,
            location=location,
            bank_account_number=encrypted_account,
            ifsc_code=ifsc_code,
        )
        return _to_out(farmer)

    # ------------------------------------------------------------------
    # 2. Get farmer profile
    # ------------------------------------------------------------------

    async def get_profile(self, *, user_id: int) -> FarmerProfileOut:
        """
        Fetch farmer profile by user_id.

        Raises:
            FarmerNotFoundError – no profile for this user
        """
        farmer = await self._farmer_repo.get_by_user_id(user_id)
        if farmer is None:
            raise FarmerNotFoundError()
        return _to_out(farmer)

    async def get_profile_by_farmer_id(self, *, farmer_id: int) -> FarmerProfileOut:
        """
        Fetch farmer profile by its own PK (farmer.id).

        Raises:
            FarmerNotFoundError – not found
        """
        farmer = await self._farmer_repo.get_by_id(farmer_id)
        if farmer is None:
            raise FarmerNotFoundError()
        return _to_out(farmer)

    # ------------------------------------------------------------------
    # 3. Admin: approve farmer
    # ------------------------------------------------------------------

    async def approve_farmer(
        self,
        *,
        farmer_id: int,
        admin_user: User,
    ) -> FarmerApprovalOut:
        """
        Approve a farmer profile. Only admins may call this.

        Raises:
            PermissionDeniedError – caller is not an admin
            FarmerNotFoundError   – farmer_id not found
        """
        if admin_user.role != UserRole.admin:
            raise PermissionDeniedError("Only admins can approve farmer profiles.")

        farmer = await self._farmer_repo.get_by_id(farmer_id)
        if farmer is None:
            raise FarmerNotFoundError()

        farmer = await self._farmer_repo.approve(farmer)
        return FarmerApprovalOut(
            id=farmer.id,
            user_id=farmer.user_id,
            full_name=farmer.full_name,
            is_approved=farmer.is_approved,
            message="Farmer profile approved successfully.",
        )

    # ------------------------------------------------------------------
    # 4. Admin: revoke farmer approval
    # ------------------------------------------------------------------

    async def revoke_farmer_approval(
        self,
        *,
        farmer_id: int,
        admin_user: User,
    ) -> FarmerApprovalOut:
        """
        Revoke approval for a farmer profile. Only admins may call this.

        Raises:
            PermissionDeniedError – caller is not an admin
            FarmerNotFoundError   – farmer_id not found
        """
        if admin_user.role != UserRole.admin:
            raise PermissionDeniedError("Only admins can revoke farmer approvals.")

        farmer = await self._farmer_repo.get_by_id(farmer_id)
        if farmer is None:
            raise FarmerNotFoundError()

        farmer = await self._farmer_repo.revoke_approval(farmer)
        return FarmerApprovalOut(
            id=farmer.id,
            user_id=farmer.user_id,
            full_name=farmer.full_name,
            is_approved=farmer.is_approved,
            message="Farmer approval revoked.",
        )
