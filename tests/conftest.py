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


# ---------------------------------------------------------------------------
# Convenience fixture: authenticated customer token
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def customer_tokens(client: AsyncClient) -> dict:
    """Register + authenticate a customer; return token pair + user dict."""
    phone = "+919876543210"
    # Register
    r = await client.post("/api/v1/auth/request-otp", json={
        "phone": phone, "name": "Test Customer", "role": "customer",
    })
    assert r.status_code == 200
    # Extract OTP from dev response
    otp = _extract_dev_otp(r.json()["message"])
    # Verify
    r2 = await client.post("/api/v1/auth/verify-otp", json={"phone": phone, "otp": otp})
    assert r2.status_code == 200
    data = r2.json()
    return {
        "access_token":  data["tokens"]["access_token"],
        "refresh_token": data["tokens"]["refresh_token"],
        "user":          data["user"],
        "headers":       {"Authorization": f"Bearer {data['tokens']['access_token']}"},
    }


@pytest_asyncio.fixture
async def farmer_tokens(client: AsyncClient) -> dict:
    """Register + authenticate a farmer; return token pair + user dict."""
    phone = "+919876543211"
    r = await client.post("/api/v1/auth/request-otp", json={
        "phone": phone, "name": "Test Farmer", "role": "farmer",
    })
    assert r.status_code == 200
    otp = _extract_dev_otp(r.json()["message"])
    r2 = await client.post("/api/v1/auth/verify-otp", json={"phone": phone, "otp": otp})
    assert r2.status_code == 200
    data = r2.json()
    return {
        "access_token":  data["tokens"]["access_token"],
        "refresh_token": data["tokens"]["refresh_token"],
        "user":          data["user"],
        "headers":       {"Authorization": f"Bearer {data['tokens']['access_token']}"},
    }


@pytest_asyncio.fixture
async def admin_tokens(client: AsyncClient) -> dict:
    """Register + authenticate an admin; return token pair + user dict."""
    phone = "+919876543212"
    r = await client.post("/api/v1/auth/request-otp", json={
        "phone": phone, "name": "Test Admin", "role": "admin",
    })
    assert r.status_code == 200
    otp = _extract_dev_otp(r.json()["message"])
    r2 = await client.post("/api/v1/auth/verify-otp", json={"phone": phone, "otp": otp})
    assert r2.status_code == 200
    data = r2.json()
    return {
        "access_token":  data["tokens"]["access_token"],
        "refresh_token": data["tokens"]["refresh_token"],
        "user":          data["user"],
        "headers":       {"Authorization": f"Bearer {data['tokens']['access_token']}"},
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _extract_dev_otp(message: str) -> str:
    """
    Parse the OTP out of the dev-mode message:
    'OTP sent successfully. [DEV ONLY] OTP: 123456'
    """
    return message.split("OTP:")[-1].strip()
