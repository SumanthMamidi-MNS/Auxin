"""
app/services/demo_accounts.py
==============================
The permanent demo identities used by the Demo Workspace. They are created
without a Supabase link (supabase_uid NULL); the first sign-in with the same
verified email links them. Safe to call repeatedly.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository

DEMO_ACCOUNTS: list[tuple[str, str, str, UserRole]] = [
    ("demo.customer@auxin.app", "Demo Customer", "+919999999991", UserRole.customer),
    ("demo.farmer@auxin.app", "Demo Farmer", "+919999999992", UserRole.farmer),
    ("demo.delivery@auxin.app", "Demo Delivery Partner", "+919999999993", UserRole.delivery),
    ("demo.admin@auxin.app", "Demo Admin", "+919999999994", UserRole.admin),
]


async def ensure_demo_accounts(db: AsyncSession) -> list[User]:
    """Create any missing demo account (approved, flagged is_demo). Never touches real users."""
    repo = UserRepository(db)
    users: list[User] = []
    for email, name, phone, role in DEMO_ACCOUNTS:
        user = await repo.get_by_email(email)
        if user is None:
            if await repo.get_by_phone(phone) is not None:
                continue  # phone already owned by another account; leave it alone
            user = await repo.create(
                name=name, phone=phone, role=role, email=email, status=UserStatus.approved
            )
        user.is_demo = True
        db.add(user)
        users.append(user)
    await db.flush()
    return users
