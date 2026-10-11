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
    from app.core.encryption import decrypt_field
    decrypted_acc = None
    if partner.bank_account_number:
        try:
            decrypted_acc = decrypt_field(partner.bank_account_number)
        except Exception:
            decrypted_acc = partner.bank_account_number

    return DeliveryPartnerOut(
        id=partner.id,
        user_id=partner.user_id,
        full_name=partner.full_name,
        phone=partner.phone,
        is_active=partner.is_active,
        is_available=partner.is_available,
        current_latitude=partner.current_latitude,
        current_longitude=partner.current_longitude,
        location_updated_at=partner.location_updated_at.isoformat() if partner.location_updated_at else None,
        location_accuracy=partner.location_accuracy,
        created_at=partner.created_at.isoformat(),
        bank_name=partner.bank_name,
        account_holder_name=partner.account_holder_name,
        bank_account_number=decrypted_acc,
        ifsc_code=partner.ifsc_code,
        upi_id=partner.upi_id,
        vehicle_type=partner.vehicle_type,
        vehicle_number=partner.vehicle_number,
        driving_license=partner.driving_license,
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

    async def update_profile(
        self,
        *,
        user_id: int,
        bank_name: str | None = None,
        account_holder_name: str | None = None,
        bank_account_number: str | None = None,
        ifsc_code: str | None = None,
        upi_id: str | None = None,
        vehicle_type: str | None = None,
        vehicle_number: str | None = None,
        driving_license: str | None = None,
    ) -> DeliveryPartnerOut:
        from app.core.encryption import encrypt_field
        partner = await self._repo.get_by_user_id(user_id)
        if partner is None:
            raise DeliveryPartnerNotFoundError()

        if bank_name is not None:
            partner.bank_name = bank_name
        if account_holder_name is not None:
            partner.account_holder_name = account_holder_name
        if bank_account_number is not None:
            partner.bank_account_number = encrypt_field(bank_account_number)
        if ifsc_code is not None:
            partner.ifsc_code = ifsc_code
        if upi_id is not None:
            partner.upi_id = upi_id
        if vehicle_type is not None:
            partner.vehicle_type = vehicle_type
        if vehicle_number is not None:
            partner.vehicle_number = vehicle_number
        if driving_license is not None:
            partner.driving_license = driving_license

        self._db.add(partner)
        await self._db.commit()
        await self._db.refresh(partner)
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
        accuracy: float | None = None,
    ) -> DeliveryPartnerOut:
        """
        Update the partner's current GPS coordinates with validation.

        Raises:
            PermissionDeniedError          – wrong role
            DeliveryPartnerNotFoundError   – no profile
            ValueError                     – invalid coordinates
        """
        if requesting_user.role != UserRole.delivery:
            raise PermissionDeniedError(
                "Only delivery users can update their location."
            )
        from app.core.geolocation import validate_coordinates
        lat_valid, lon_valid = validate_coordinates(latitude, longitude)

        partner = await self._repo.get_by_user_id(requesting_user.id)
        if partner is None:
            raise DeliveryPartnerNotFoundError()

        partner = await self._repo.update_location(partner, lat_valid, lon_valid, accuracy=accuracy)
        return _to_out(partner)
