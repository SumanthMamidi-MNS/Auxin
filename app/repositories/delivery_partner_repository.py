"""
app/repositories/delivery_partner_repository.py
=================================================
All DB queries for the `delivery_partners` table.

Assignment strategy:
  `find_available()` returns the first available + active partner.
  If the caller wants proximity-based assignment it should call
  `find_all_available()` and sort by distance in the service layer.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delivery import DeliveryPartner


class DeliveryPartnerRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, partner_id: int) -> DeliveryPartner | None:
        result = await self._db.execute(
            select(DeliveryPartner).where(DeliveryPartner.id == partner_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int) -> DeliveryPartner | None:
        result = await self._db.execute(
            select(DeliveryPartner).where(DeliveryPartner.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        user_id: int,
        full_name: str,
        phone: str,
    ) -> DeliveryPartner:
        partner = DeliveryPartner(
            user_id=user_id,
            full_name=full_name,
            phone=phone,
            is_active=True,
            is_available=False,
        )
        self._db.add(partner)
        await self._db.flush()
        return partner

    async def set_availability(
        self,
        partner: DeliveryPartner,
        is_available: bool,
    ) -> DeliveryPartner:
        partner.is_available = is_available
        self._db.add(partner)
        await self._db.flush()
        return partner

    async def update_location(
        self,
        partner: DeliveryPartner,
        latitude: float,
        longitude: float,
        accuracy: float | None = None,
    ) -> DeliveryPartner:
        from datetime import datetime, timezone
        partner.current_latitude = latitude
        partner.current_longitude = longitude
        partner.location_accuracy = accuracy
        partner.location_updated_at = datetime.now(tz=timezone.utc)
        self._db.add(partner)
        await self._db.flush()
        return partner

    async def find_available(self) -> DeliveryPartner | None:
        """
        Return the first active + available delivery partner.

        Order: by id ascending (FIFO).  The service layer may override
        this with proximity sorting when coordinates are available.
        """
        result = await self._db.execute(
            select(DeliveryPartner)
            .where(
                DeliveryPartner.is_active.is_(True),
                DeliveryPartner.is_available.is_(True),
            )
            .order_by(DeliveryPartner.id.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def find_all_available(self) -> list[DeliveryPartner]:
        """
        Return all active + available delivery partners.

        Used by the service when proximity-sorting is needed.
        """
        result = await self._db.execute(
            select(DeliveryPartner)
            .where(
                DeliveryPartner.is_active.is_(True),
                DeliveryPartner.is_available.is_(True),
            )
            .order_by(DeliveryPartner.id.asc())
        )
        return list(result.scalars().all())
