"""
app/repositories/user_repository.py
=====================================
All DB queries related to the `users` table are encapsulated here.
Business logic must NOT be placed in this layer.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole, UserStatus, default_status_for_role


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self._db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> User | None:
        result = await self._db.execute(select(User).where(User.phone == phone))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(func.lower(User.email) == email.strip().lower())
        )
        return result.scalar_one_or_none()

    async def get_by_supabase_uid(self, supabase_uid: str) -> User | None:
        """Look up a user by their Supabase Auth UUID (JWT sub claim)."""
        result = await self._db.execute(
            select(User).where(User.supabase_uid == supabase_uid)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        name: str,
        phone: str,
        role: UserRole,
        email: str | None = None,
        supabase_uid: str | None = None,
        status: UserStatus | None = None,
    ) -> User:
        """
        Create a new user row.

        If `status` is not supplied, it is derived from the role:
          - customer / admin → approved  (immediate access)
          - farmer / delivery → pending  (awaiting admin approval)
        """
        resolved_status = status if status is not None else default_status_for_role(role)
        user = User(
            name=name,
            phone=phone,
            role=role,
            email=email,
            status=resolved_status,
            supabase_uid=supabase_uid,
        )
        self._db.add(user)
        await self._db.flush()  # Get DB-assigned id without committing
        return user

    async def update_supabase_uid(self, user: User, supabase_uid: str) -> User:
        """Set or update the Supabase UID on an existing user record."""
        user.supabase_uid = supabase_uid
        self._db.add(user)
        await self._db.flush()
        return user

    async def update_status(self, user: User, status: UserStatus) -> User:
        """Update the account status of a user and flush to DB."""
        user.status = status
        self._db.add(user)
        await self._db.flush()
        return user

    async def update_profile(
        self,
        user: User,
        *,
        name: str | None = None,
        phone: str | None = None,
        address: str | None = None,
    ) -> User:
        """Update user profile fields."""
        if name is not None:
            user.name = name
        if phone is not None:
            user.phone = phone
        if address is not None:
            user.address = address
        self._db.add(user)
        await self._db.flush()
        return user

