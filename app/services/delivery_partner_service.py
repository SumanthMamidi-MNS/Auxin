"""
app/services/delivery_partner_service.py
==========================================
Business logic for delivery partner profile management.

Responsibilities:
  1. create_profile   – role check → duplicate check → persist
  2. toggle_availability – go online / offline
  3. update_location     – update GPS coordinates
  4. get_profile         – fetch own profile
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    DeliveryPartnerInactiveError,
    DeliveryPartnerNotFoundError,
    DeliveryPartnerProfileExistsError,
    PermissionDeniedError,
)
from app.models.delivery import DeliveryPartner
from app.models.user import User, UserRole
from app.repositories.delivery_partner_repository import DeliveryPartnerRepository
from app.schemas.delivery import DeliveryPartnerOut


def _to_out(partner: DeliveryPartner) -> DeliveryPartnerOut:
    return DeliveryPartnerOut(
        id=partner.id,
        user_id=partner.user_id,
        full_name=partner.full_name,
        phone=partner.phone,
        is_active=partner.is_active,
        is_available=partner.is_available,
        current_latitude=partner.current_latitude,
        current_longitude=partner.current_longitude,
        created_at=partner.created_at.isoformat(),
    )


class DeliveryPartnerService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = DeliveryPartnerRepository(db)

    # ------------------------------------------------------------------
    # 1. Create profile
    # ------------------------------------------------------------------

    async def create_profile(
        self,
        *,
        requesting_user: User,
        full_name: str,
        phone: str,
    ) -> DeliveryPartnerOut:
        """
        Create a delivery partner profile.

        Rules:
          - requesting_user.role must be UserRole.delivery
          - Only one profile per user

        Raises:
            PermissionDeniedError                – wrong role
            DeliveryPartnerProfileExistsError    – duplicate profile
        """
        if requesting_user.role != UserRole.delivery:
            raise PermissionDeniedError(
                "Only users with the 'delivery' role can create a delivery partner profile."
            )

        existing = await self._repo.get_by_user_id(requesting_user.id)
        if existing is not None:
            raise DeliveryPartnerProfileExistsError()

        partner = await self._repo.create(
            user_id=requesting_user.id,
            full_name=full_name,
            phone=phone,
        )
        return _to_out(partner)

    # ------------------------------------------------------------------
    # 2. Get own profile
    # ------------------------------------------------------------------

    async def get_my_profile(self, *, requesting_user: User) -> DeliveryPartnerOut:
        """
        Fetch the delivery partner profile for the authenticated user.

        Raises:
            PermissionDeniedError          – wrong role
            DeliveryPartnerNotFoundError   – profile does not exist yet
        """
        if requesting_user.role != UserRole.delivery:
            raise PermissionDeniedError(
                "Only delivery users can view delivery partner profiles."
            )
        partner = await self._repo.get_by_user_id(requesting_user.id)
        if partner is None:
            raise DeliveryPartnerNotFoundError(
                "You do not have a delivery partner profile. Please create one first."
            )
        return _to_out(partner)

    # ------------------------------------------------------------------
    # 3. Toggle availability
    # ------------------------------------------------------------------

    async def toggle_availability(
        self,
        *,
        requesting_user: User,
        is_available: bool,
    ) -> DeliveryPartnerOut:
        """
        Set the partner's availability (online/offline).

        An inactive (admin-deactivated) partner cannot go available.

        Raises:
            PermissionDeniedError          – wrong role
            DeliveryPartnerNotFoundError   – no profile
            DeliveryPartnerInactiveError   – admin-deactivated account
        """
        if requesting_user.role != UserRole.delivery:
            raise PermissionDeniedError(
                "Only delivery users can update their availability."
            )
        partner = await self._repo.get_by_user_id(requesting_user.id)
        if partner is None:
            raise DeliveryPartnerNotFoundError()
        if not partner.is_active:
            raise DeliveryPartnerInactiveError()

        partner = await self._repo.set_availability(partner, is_available)
        return _to_out(partner)

    # ------------------------------------------------------------------
    # 4. Update location
    # ------------------------------------------------------------------

    async def update_location(
        self,
        *,
        requesting_user: User,
        latitude: float,
        longitude: float,
    ) -> DeliveryPartnerOut:
        """
        Update the partner's current GPS coordinates.

        Raises:
            PermissionDeniedError          – wrong role
            DeliveryPartnerNotFoundError   – no profile
        """
        if requesting_user.role != UserRole.delivery:
            raise PermissionDeniedError(
                "Only delivery users can update their location."
            )
        partner = await self._repo.get_by_user_id(requesting_user.id)
        if partner is None:
            raise DeliveryPartnerNotFoundError()

        partner = await self._repo.update_location(partner, latitude, longitude)
        return _to_out(partner)
