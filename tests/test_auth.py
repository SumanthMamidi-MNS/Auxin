"""
tests/test_auth.py
===================
Auth module tests: sync-user, /auth/me, validation, RBAC, and invalid tokens.
"""

import pytest
from httpx import AsyncClient
from tests.conftest import create_mock_supabase_token

PHONE = "+919876543233"


# ---------------------------------------------------------------------------
# 1. Sync User — success
# ---------------------------------------------------------------------------

async def test_sync_user_success(client: AsyncClient):
    token = create_mock_supabase_token("new-uuid-1", PHONE, "customer")
    r = await client.post(
        "/api/v1/auth/sync-user",
        json={
            "phone": PHONE,
            "name":  "Alice",
            "role":  "customer",
            "email": "alice@example.com",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["phone"] == PHONE
    assert data["name"] == "Alice"
    assert data["role"] == "customer"
    assert data["status"] == "approved"


# ---------------------------------------------------------------------------
# 2. Get Me — success
# ---------------------------------------------------------------------------

async def test_get_me_success(customer_tokens: dict, client: AsyncClient):
    r = await client.get("/api/v1/auth/me", headers=customer_tokens["headers"])
    assert r.status_code == 200
    data = r.json()
    assert data["phone"] == "+919876543210"
    assert data["role"] == "customer"


# ---------------------------------------------------------------------------
# 3. Get Me — missing token
# ---------------------------------------------------------------------------

async def test_get_me_no_token(client: AsyncClient):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401
    body = r.json()
    assert body["success"] is False
    assert "TOKEN" in body["code"].upper()


# ---------------------------------------------------------------------------
# 4. Get Me — invalid token
# ---------------------------------------------------------------------------

async def test_get_me_invalid_token(client: AsyncClient):
    r = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer totally.invalid.jwt"},
    )
    assert r.status_code == 401
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 5. RBAC — farmer accessing customer-only endpoint
# ---------------------------------------------------------------------------

async def test_rbac_farmer_cannot_place_order(farmer_tokens: dict, client: AsyncClient):
    # Place order requires customer role
    r = await client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": 1, "quantity": 1}]},
        headers=farmer_tokens["headers"],
    )
    assert r.status_code == 403
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 6. Input validation — phone must contain exactly 10 digits
# ---------------------------------------------------------------------------

async def test_sync_user_invalid_phone(client: AsyncClient):
    token = create_mock_supabase_token("new-uuid-2", "+91123", "customer")
    r = await client.post(
        "/api/v1/auth/sync-user",
        json={
            "phone": "not-a-phone",
            "name":  "X",
            "role":  "customer",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422
    body = r.json()
    assert body["success"] is False
    assert body["code"] == "VALIDATION_ERROR"
