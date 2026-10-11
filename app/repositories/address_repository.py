"""
app/repositories/address_repository.py
======================================
Database operations related to the `addresses` table.
"""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.address import Address
from app.models.user import User


class AddressRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, address_id: int) -> Address | None:
        result = await self._db.execute(select(Address).where(Address.id == address_id))
        return result.scalar_one_or_none()

    async def get_default(self, user_id: int) -> Address | None:
        result = await self._db.execute(
            select(Address)
            .where(Address.user_id == user_id, Address.is_default.is_(True))
            .order_by(Address.created_at.desc())
        )
        return result.scalars().first()

    async def list_for_user(self, user_id: int) -> list[Address]:
        result = await self._db.execute(
            select(Address)
            .where(Address.user_id == user_id)
            .order_by(Address.is_default.desc(), Address.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(
        self,
        *,
        user_id: int,
        house_flat: str,
        building: str | None = None,
        street: str,
        area: str,
        landmark: str | None = None,
        city: str,
        state: str,
        pin_code: str,
        address_type: str = "Home",
        is_default: bool = False,
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> Address:
        # Check if user has any existing addresses. If not, this MUST be the default.
        existing_res = await self._db.execute(select(Address).where(Address.user_id == user_id))
        has_addresses = len(existing_res.scalars().all()) > 0
        if not has_addresses:
            is_default = True

        address = Address(
            user_id=user_id,
            house_flat=house_flat,
            building=building,
            street=street,
            area=area,
            landmark=landmark,
            city=city,
            state=state,
            pin_code=pin_code,
            address_type=address_type,
            is_default=is_default,
            latitude=latitude,
            longitude=longitude,
        )
        self._db.add(address)
        await self._db.flush()

        if is_default:
            await self._set_only_default(user_id, address.id)
            await self._sync_user_address(user_id, address)

        return address

    async def update(self, address: Address, **updates) -> Address:
        for k, v in updates.items():
            if hasattr(address, k):
                setattr(address, k, v)
        self._db.add(address)
        await self._db.flush()

        if address.is_default:
            await self._set_only_default(address.user_id, address.id)
            await self._sync_user_address(address.user_id, address)
        else:
            default_address = await self.get_default(address.user_id)
            await self._sync_user_address(address.user_id, default_address)

        return address

    async def delete(self, address: Address) -> None:
        user_id = address.user_id
        was_default = address.is_default
        await self._db.delete(address)
        await self._db.flush()

        if was_default:
            # Promote the most recently created remaining address to default
            remaining = await self._db.execute(
                select(Address).where(Address.user_id == user_id).order_by(Address.created_at.desc())
            )
            all_rem = remaining.scalars().all()
            if all_rem:
                new_default = all_rem[0]
                new_default.is_default = True
                self._db.add(new_default)
                await self._db.flush()
                await self._set_only_default(user_id, new_default.id)
                await self._sync_user_address(user_id, new_default)
            else:
                await self._sync_user_address(user_id, None)

    async def set_default(self, user_id: int, address_id: int) -> Address | None:
        address = await self.get_by_id(address_id)
        if not address or address.user_id != user_id:
            return None

        address.is_default = True
        self._db.add(address)
        await self._db.flush()
        await self._set_only_default(user_id, address.id)
        await self._sync_user_address(user_id, address)
        return address

    async def _set_only_default(self, user_id: int, default_address_id: int) -> None:
        await self._db.execute(
            update(Address)
            .where(Address.user_id == user_id, Address.id != default_address_id)
            .values(is_default=False)
        )

    async def _sync_user_address(self, user_id: int, default_address: Address | None) -> None:
        user_res = await self._db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if user:
            user.address = default_address.to_formatted_string() if default_address else None
            self._db.add(user)
            await self._db.flush()
