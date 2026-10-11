"""
tests/conftest.py
==================
Shared pytest fixtures for the Auxin test suite.

Uses an in-memory SQLite database for speed. Each test gets a fresh
database, ensuring full isolation.

Async support: pytest-asyncio with asyncio_mode = "auto".
HTTP client:   httpx.AsyncClient with ASGITransport.
"""

import asyncio
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from jose import jwt

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from main import app

# ---------------------------------------------------------------------------
# In-memory SQLite engine (test isolation)
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@pytest_asyncio.fixture(scope="function", autouse=True)
async def reset_db():
    """Drop and recreate all tables for each test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Override the DB dependency with the test session
# ---------------------------------------------------------------------------

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


# ---------------------------------------------------------------------------
# Async HTTP client
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTPX client wired to the FastAPI app (no real HTTP)."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """AsyncSession fixture for tests to query/write database directly."""
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ---------------------------------------------------------------------------
# Mock Token Generator
# ---------------------------------------------------------------------------

def create_mock_supabase_token(supabase_uid: str, phone: str, role: str) -> str:
    payload = {
        "sub": supabase_uid,
        "phone": phone,
        "role": "authenticated",
        "exp": 2000000000,
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


# ---------------------------------------------------------------------------
# Convenience fixtures for authenticated roles
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def customer_tokens(db: AsyncSession) -> dict:
    """Register + authenticate a customer; return token pair + user dict."""
    from app.models.user import User, UserRole, UserStatus
    supabase_uid = "mock-customer-uid"
    phone = "+919876543210"
    user = User(
        name="Test Customer",
        phone=phone,
        email="customer@example.com",
        role=UserRole.customer,
        status=UserStatus.approved,
        supabase_uid=supabase_uid,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_mock_supabase_token(supabase_uid, phone, "customer")
    return {
        "access_token":  token,
        "refresh_token": "mock-refresh-token",
        "user": {
            "id":     user.id,
            "phone":  user.phone,
            "role":   user.role.value,
            "status": user.status.value,
        },
        "headers":       {"Authorization": f"Bearer {token}"},
    }


@pytest_asyncio.fixture
async def farmer_tokens(db: AsyncSession) -> dict:
    """Register + authenticate a farmer; return token pair + user dict."""
    from app.models.user import User, UserRole, UserStatus
    supabase_uid = "mock-farmer-uid"
    phone = "+919876543211"
    user = User(
        name="Test Farmer",
        phone=phone,
        email="farmer@example.com",
        role=UserRole.farmer,
        status=UserStatus.pending,  # Must be pending to trigger the approval flow in tests!
        supabase_uid=supabase_uid,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_mock_supabase_token(supabase_uid, phone, "farmer")
    return {
        "access_token":  token,
        "refresh_token": "mock-refresh-token",
        "user": {
            "id":     user.id,
            "phone":  user.phone,
            "role":   user.role.value,
            "status": user.status.value,
        },
        "headers":       {"Authorization": f"Bearer {token}"},
    }


@pytest_asyncio.fixture
async def demo_customer_tokens(db: AsyncSession) -> dict:
    """Register + authenticate a demo customer."""
    from app.models.user import User, UserRole, UserStatus
    supabase_uid = "mock-demo-customer-uid"
    phone = "+919999999991"
    user = User(
        name="Demo Customer",
        phone=phone,
        email="demo.customer@auxin.app",
        role=UserRole.customer,
        status=UserStatus.approved,
        is_demo=True,
        supabase_uid=supabase_uid,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_mock_supabase_token(supabase_uid, phone, "customer")
    return {
        "access_token":  token,
        "refresh_token": "mock-refresh-token",
        "user": {
            "id":     user.id,
            "phone":  user.phone,
            "role":   user.role.value,
            "status": user.status.value,
            "is_demo": True,
        },
        "headers":       {"Authorization": f"Bearer {token}"},
    }


@pytest_asyncio.fixture
async def demo_farmer_tokens(db: AsyncSession) -> dict:
    """Register + authenticate a demo farmer."""
    from app.models.user import User, UserRole, UserStatus
    supabase_uid = "mock-demo-farmer-uid"
    phone = "+919999999992"
    user = User(
        name="Demo Farmer",
        phone=phone,
        email="demo.farmer@auxin.app",
        role=UserRole.farmer,
        status=UserStatus.approved,
        is_demo=True,
        supabase_uid=supabase_uid,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_mock_supabase_token(supabase_uid, phone, "farmer")
    return {
        "access_token":  token,
        "refresh_token": "mock-refresh-token",
        "user": {
            "id":     user.id,
            "phone":  user.phone,
            "role":   user.role.value,
            "status": user.status.value,
            "is_demo": True,
        },
        "headers":       {"Authorization": f"Bearer {token}"},
    }



@pytest_asyncio.fixture
async def admin_tokens(db: AsyncSession) -> dict:
    """Register + authenticate an admin; return token pair + user dict."""
    from app.models.user import User, UserRole, UserStatus
    supabase_uid = "mock-admin-uid"
    phone = "+919876543212"
    user = User(
        name="Test Admin",
        phone=phone,
        email="admin@example.com",
        role=UserRole.admin,
        status=UserStatus.approved,
        supabase_uid=supabase_uid,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_mock_supabase_token(supabase_uid, phone, "admin")
    return {
        "access_token":  token,
        "refresh_token": "mock-refresh-token",
        "user": {
            "id":     user.id,
            "phone":  user.phone,
            "role":   user.role.value,
            "status": user.status.value,
        },
        "headers":       {"Authorization": f"Bearer {token}"},
    }


@pytest_asyncio.fixture
async def super_admin_tokens(db: AsyncSession) -> dict:
    """Register + authenticate a super admin; return token pair + user dict."""
    from app.models.user import User, UserRole, UserStatus
    supabase_uid = "mock-super-admin-uid"
    phone = "+917661920205"
    user = User(
        name="Test Super Admin",
        phone=phone,
        email="sumanthmamidi74@gmail.com",
        role=UserRole.admin,
        status=UserStatus.approved,
        is_super_admin=True,
        supabase_uid=supabase_uid,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_mock_supabase_token(supabase_uid, phone, "admin")
    return {
        "access_token":  token,
        "refresh_token": "mock-refresh-token",
        "user": {
            "id":     user.id,
            "phone":  user.phone,
            "role":   user.role.value,
            "status": user.status.value,
            "is_super_admin": True,
        },
        "headers":       {"Authorization": f"Bearer {token}"},
    }


@pytest_asyncio.fixture
async def delivery_tokens(db: AsyncSession) -> dict:
    """Register + authenticate a delivery partner; return token pair + user dict."""
    from app.models.user import User, UserRole, UserStatus
    supabase_uid = "mock-delivery-uid"
    phone = "+919876543213"
    user = User(
        name="Test Delivery Partner",
        phone=phone,
        email="delivery@example.com",
        role=UserRole.delivery,
        status=UserStatus.approved,
        supabase_uid=supabase_uid,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_mock_supabase_token(supabase_uid, phone, "delivery")
    return {
        "access_token":  token,
        "refresh_token": "mock-refresh-token",
        "user": {
            "id":     user.id,
            "phone":  user.phone,
            "role":   user.role.value,
            "status": user.status.value,
        },
        "headers":       {"Authorization": f"Bearer {token}"},
    }

