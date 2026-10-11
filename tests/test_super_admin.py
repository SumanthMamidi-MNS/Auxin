import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.models.user import User, UserRole, UserStatus
from app.core.config import settings

@pytest.mark.asyncio
async def test_super_admin_delete_blocked(db):
    res = await db.execute(select(User).where(User.email == settings.SUPER_ADMIN_EMAIL))
    super_admin = res.scalar_one_or_none()
    
    # If not present in test db, create one
    if not super_admin:
        super_admin = User(
            name="Sumanth Mamidi",
            phone=settings.SUPER_ADMIN_PHONE,
            email=settings.SUPER_ADMIN_EMAIL,
            role=UserRole.admin,
            status=UserStatus.approved,
            is_super_admin=True
        )
        db.add(super_admin)
        await db.flush()

    with pytest.raises(ValueError, match="cannot be deleted"):
        await db.delete(super_admin)
        await db.flush()
    await db.rollback()

@pytest.mark.asyncio
async def test_super_admin_demotion_blocked(db):
    res = await db.execute(select(User).where(User.email == settings.SUPER_ADMIN_EMAIL))
    super_admin = res.scalar_one_or_none()
    if not super_admin:
        super_admin = User(
            name="Sumanth Mamidi",
            phone=settings.SUPER_ADMIN_PHONE,
            email=settings.SUPER_ADMIN_EMAIL,
            role=UserRole.admin,
            status=UserStatus.approved,
            is_super_admin=True
        )
        db.add(super_admin)
        await db.flush()

    super_admin.role = UserRole.farmer
    with pytest.raises(ValueError, match="cannot be demoted"):
        await db.flush()
    await db.rollback()

@pytest.mark.asyncio
async def test_super_admin_suspension_blocked(db):
    res = await db.execute(select(User).where(User.email == settings.SUPER_ADMIN_EMAIL))
    super_admin = res.scalar_one_or_none()
    if not super_admin:
        super_admin = User(
            name="Sumanth Mamidi",
            phone=settings.SUPER_ADMIN_PHONE,
            email=settings.SUPER_ADMIN_EMAIL,
            role=UserRole.admin,
            status=UserStatus.approved,
            is_super_admin=True
        )
        db.add(super_admin)
        await db.flush()

    super_admin.status = UserStatus.suspended
    with pytest.raises(ValueError, match="cannot be suspended"):
        await db.flush()
    await db.rollback()

@pytest.mark.asyncio
async def test_super_admin_privilege_loss_blocked(db):
    res = await db.execute(select(User).where(User.email == settings.SUPER_ADMIN_EMAIL))
    super_admin = res.scalar_one_or_none()
    if not super_admin:
        super_admin = User(
            name="Sumanth Mamidi",
            phone=settings.SUPER_ADMIN_PHONE,
            email=settings.SUPER_ADMIN_EMAIL,
            role=UserRole.admin,
            status=UserStatus.approved,
            is_super_admin=True
        )
        db.add(super_admin)
        await db.flush()

    super_admin.is_super_admin = False
    with pytest.raises(ValueError, match="cannot lose Super Admin privileges"):
        await db.flush()
    await db.rollback()

@pytest.mark.asyncio
async def test_second_super_admin_blocked(db):
    # Check if a super admin already exists to avoid unique constraint clash on insert
    res = await db.execute(select(User).where(User.is_super_admin == True))
    exists = res.scalar_one_or_none()
    
    if not exists:
        super_admin = User(
            name="Sumanth Mamidi",
            phone=settings.SUPER_ADMIN_PHONE,
            email=settings.SUPER_ADMIN_EMAIL,
            role=UserRole.admin,
            status=UserStatus.approved,
            is_super_admin=True
        )
        db.add(super_admin)
        await db.flush()

    user2 = User(
        name="Second Super Admin",
        phone="+917777777779",
        email="admin2@auxin.app",
        role=UserRole.admin,
        status=UserStatus.approved,
        is_super_admin=True,
    )
    db.add(user2)
    with pytest.raises(IntegrityError):
        await db.flush()
    await db.rollback()
