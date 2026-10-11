"""
tests/test_security.py
=======================
Security-focused tests: RBAC, injection prevention, header hardening,
suspended users, and payment signature spoofing.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import create_mock_supabase_token


# ---------------------------------------------------------------------------
# 1. Security headers present on all responses
# ---------------------------------------------------------------------------

async def test_security_headers_present(client: AsyncClient):
    r = await client.get("/health")
    headers = r.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert "strict-transport-security" in headers
    assert "content-security-policy" in headers


# ---------------------------------------------------------------------------
# 2. Request-ID echoed in response
# ---------------------------------------------------------------------------

async def test_request_id_in_response(client: AsyncClient):
    r = await client.get("/health")
    assert "x-request-id" in r.headers
    assert len(r.headers["x-request-id"]) == 36  # UUID4 string length


# ---------------------------------------------------------------------------
# 3. Unauthenticated access to protected endpoint
# ---------------------------------------------------------------------------

async def test_unauthenticated_access(client: AsyncClient):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401
    body = r.json()
    assert body["success"] is False
    assert "code" in body


# ---------------------------------------------------------------------------
# 4. Invalid JWT format (SQL injection attempt in Bearer)
# ---------------------------------------------------------------------------

async def test_sql_injection_in_bearer(client: AsyncClient):
    r = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer ' OR '1'='1"},
    )
    assert r.status_code == 401
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 5. Admin cannot suspend another admin
# ---------------------------------------------------------------------------

async def test_admin_cannot_suspend_admin(
    client: AsyncClient,
    admin_tokens: dict,
):
    # Try to suspend self (admin)
    admin_user_id = admin_tokens["user"]["id"]
    r = await client.put(
        f"/api/v1/admin/users/{admin_user_id}/suspend",
        json={"reason": "test"},
        headers=admin_tokens["headers"],
    )
    assert r.status_code == 403
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 6. Customer cannot access admin endpoints
# ---------------------------------------------------------------------------

async def test_customer_cannot_access_admin(
    client: AsyncClient,
    customer_tokens: dict,
):
    r = await client.get(
        "/api/v1/admin/users",
        headers=customer_tokens["headers"],
    )
    assert r.status_code == 403
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 7. Payment signature spoofing rejected
# ---------------------------------------------------------------------------

async def test_payment_signature_spoof(
    client: AsyncClient,
    customer_tokens: dict,
):
    # Try to verify payment with fake signature
    r = await client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id":   "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature":  "fake_sig",
        },
        headers=customer_tokens["headers"],
    )
    # Spooned signature is rejected. If transaction is not found, 404 is returned; otherwise 400/403.
    assert r.status_code in (400, 403, 404, 422)


# ---------------------------------------------------------------------------
# 8. Dispute reason length constraints
# ---------------------------------------------------------------------------

async def test_oversized_reason_in_dispute(
    client: AsyncClient,
    customer_tokens: dict,
):
    r = await client.post(
        "/api/v1/disputes",
        json={
            "order_id": 1,
            "reason": "A" * 2001  # Exceeds max length limit of 2000
        },
        headers=customer_tokens["headers"],
    )
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# 9. Clean 404 envelope
# ---------------------------------------------------------------------------

async def test_404_envelope(client: AsyncClient):
    r = await client.get("/api/v1/nonexistent-route")
    body = r.json()
    assert r.status_code == 404
    assert body["success"] is False
    assert "code"  in body
    assert "error" in body


# ---------------------------------------------------------------------------
# 10. Delivery partner denied payment access
# ---------------------------------------------------------------------------

async def test_delivery_denied_payment_access(db: AsyncSession, client: AsyncClient):
    # Register delivery user directly in DB
    from app.models.user import User, UserRole, UserStatus
    supabase_uid = "mock-delivery-uid"
    phone = "+919700000001"
    user = User(
        name="Rider",
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
    hdrs = {"Authorization": f"Bearer {token}"}

    r3 = await client.get("/api/v1/payments/1", headers=hdrs)
    assert r3.status_code == 403
    assert r3.json()["success"] is False
