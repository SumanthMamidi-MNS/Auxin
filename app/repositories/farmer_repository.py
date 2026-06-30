"""
app/repositories/farmer_repository.py
=======================================
All DB queries related to the `farmers` table.
No business logic lives here.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.farmer import Farmer


class FarmerRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, farmer_id: int) -> Farmer | None:
        result = await self._db.execute(
            select(Farmer).where(Farmer.id == farmer_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int) -> Farmer | None:
        """Fetch the farmer profile for a given user, or None if not found."""
        result = await self._db.execute(
            select(Farmer).where(Farmer.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        user_id: int,
        full_name: str,
        phone: str,
        location: str,
        bank_account_number: str,  # already encrypted by the caller
        ifsc_code: str,
    ) -> Farmer:
        farmer = Farmer(
            user_id=user_id,
            full_name=full_name,
            phone=phone,
            location=location,
            bank_account_number=bank_account_number,
            ifsc_code=ifsc_code,
            is_approved=False,
        )
        self._db.add(farmer)
        await self._db.flush()
        return farmer

    async def approve(self, farmer: Farmer) -> Farmer:
        """Set is_approved = True (admin action)."""
        farmer.is_approved = True
        self._db.add(farmer)
        await self._db.flush()
        return farmer

    async def revoke_approval(self, farmer: Farmer) -> Farmer:
        """Set is_approved = False (admin action)."""
        farmer.is_approved = False
        self._db.add(farmer)
        await self._db.flush()
        return farmer
