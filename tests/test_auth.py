"""
tests/test_auth.py
===================
Auth module tests: OTP flow, JWT tokens, rate limiting, edge cases.
"""

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _otp_from(message: str) -> str:
    return message.split("OTP:")[-1].strip()

PHONE = "+919876543210"
PHONE2 = "+919876543211"


# ---------------------------------------------------------------------------
# 1. OTP request — success
# ---------------------------------------------------------------------------

async def test_request_otp_new_user(client: AsyncClient):
    r = await client.post("/api/v1/auth/request-otp", json={
        "phone": PHONE,
        "name":  "Alice",
        "role":  "customer",
    })
    assert r.status_code == 200
    assert "OTP" in r.json()["message"]


# ---------------------------------------------------------------------------
# 2. OTP verify — success (full login flow)
# ---------------------------------------------------------------------------

async def test_verify_otp_success(client: AsyncClient):
    # Request OTP
    r1 = await client.post("/api/v1/auth/request-otp", json={
        "phone": PHONE, "name": "Alice", "role": "customer",
    })
    otp = _otp_from(r1.json()["message"])

    # Verify OTP
    r2 = await client.post("/api/v1/auth/verify-otp", json={
        "phone": PHONE, "otp": otp,
    })
    assert r2.status_code == 200
    data = r2.json()
    assert "tokens" in data
    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]
    assert data["user"]["phone"] == PHONE
    assert data["user"]["role"] == "customer"


# ---------------------------------------------------------------------------
# 3. OTP verify — wrong code increments attempts
# ---------------------------------------------------------------------------

async def test_verify_otp_wrong_code(client: AsyncClient):
    await client.post("/api/v1/auth/request-otp", json={
        "phone": PHONE, "name": "Alice", "role": "customer",
    })

    r = await client.post("/api/v1/auth/verify-otp", json={
        "phone": PHONE, "otp": "000000",
    })
    assert r.status_code in (400, 401, 422)
    body = r.json()
    assert body["success"] is False


# ---------------------------------------------------------------------------
# 4. OTP verify — no OTP requested
# ---------------------------------------------------------------------------

async def test_verify_otp_not_found(client: AsyncClient):
    r = await client.post("/api/v1/auth/verify-otp", json={
        "phone": "+911111111111", "otp": "123456",
    })
    assert r.status_code == 404
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 5. JWT — access protected route
# ---------------------------------------------------------------------------

async def test_get_me_with_valid_token(customer_tokens: dict, client: AsyncClient):
    r = await client.get("/api/v1/auth/me", headers=customer_tokens["headers"])
    assert r.status_code == 200
    assert r.json()["phone"] == "+919876543210"


# ---------------------------------------------------------------------------
# 6. JWT — missing token
# ---------------------------------------------------------------------------

async def test_get_me_no_token(client: AsyncClient):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401
    body = r.json()
    assert body["success"] is False
    assert "TOKEN" in body["code"].upper()


# ---------------------------------------------------------------------------
# 7. JWT — invalid (tampered) token
# ---------------------------------------------------------------------------

async def test_get_me_invalid_token(client: AsyncClient):
    r = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer totally.invalid.jwt"},
    )
    assert r.status_code == 401
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 8. Refresh token rotation
# ---------------------------------------------------------------------------

async def test_refresh_token_rotation(customer_tokens: dict, client: AsyncClient):
    r = await client.post("/api/v1/auth/refresh-token", json={
        "refresh_token": customer_tokens["refresh_token"],
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["access_token"] != customer_tokens["access_token"]


# ---------------------------------------------------------------------------
# 9. Refresh token — replay after rotation
# ---------------------------------------------------------------------------

async def test_refresh_token_replay(customer_tokens: dict, client: AsyncClient):
    old_rt = customer_tokens["refresh_token"]
    # Use it once
    r1 = await client.post("/api/v1/auth/refresh-token", json={"refresh_token": old_rt})
    assert r1.status_code == 200

    # Replay old token
    r2 = await client.post("/api/v1/auth/refresh-token", json={"refresh_token": old_rt})
    assert r2.status_code in (401, 404)
    assert r2.json()["success"] is False


# ---------------------------------------------------------------------------
# 10. OTP rate limit
# ---------------------------------------------------------------------------

async def test_otp_rate_limit(client: AsyncClient):
    """After 3 OTP requests, the 4th must be rejected."""
    for _ in range(3):
        await client.post("/api/v1/auth/request-otp", json={
            "phone": PHONE2, "name": "Bob", "role": "customer",
        })

    r = await client.post("/api/v1/auth/request-otp", json={
        "phone": PHONE2, "name": "Bob", "role": "customer",
    })
    assert r.status_code == 429
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 11. RBAC — farmer accessing customer-only endpoint
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
# 12. Input validation — phone must be E.164
# ---------------------------------------------------------------------------

async def test_request_otp_invalid_phone(client: AsyncClient):
    r = await client.post("/api/v1/auth/request-otp", json={
        "phone": "not-a-phone", "name": "X", "role": "customer",
    })
    assert r.status_code == 422
    body = r.json()
    assert body["success"] is False
    assert body["code"] == "VALIDATION_ERROR"
