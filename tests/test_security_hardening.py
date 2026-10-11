"""
tests/test_security_hardening.py
=================================
Regression tests for the issues found in the 2026-10-11 security audit:

  * no self-registered administrators
  * no account takeover through /auth/sync-user
  * farmers cannot read other farmers' orders
  * public farmer profiles hide contact / bank details
  * Milo chat requires authentication
  * the doorstep-OTP debug backdoor is gone and guessing is bounded
  * demo reset requires password confirmation
"""

import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.farmer import Farmer
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole, UserStatus


def _token(sub: str, email: str | None = None) -> dict:
    claims = {"sub": sub, "role": "authenticated", "exp": 2000000000}
    if email:
        claims["email"] = email
    tok = jwt.encode(claims, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return {"Authorization": f"Bearer {tok}"}


def _sync_body(role: str = "customer", phone: str = "+919812345678", email: str | None = None) -> dict:
    body = {"name": "Some Person", "phone": phone, "role": role}
    if email:
        body["email"] = email
    return body


# ---------------------------------------------------------------------------
# /auth/sync-user
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cannot_self_register_as_admin(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/sync-user",
        json=_sync_body(role="admin", email="rand@example.com"),
        headers=_token(str(uuid.uuid4()), "rand@example.com"),
    )
    assert resp.status_code == 403, resp.text


@pytest.mark.asyncio
async def test_super_admin_bootstrap_needs_matching_verified_email(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(settings, "SUPER_ADMIN_EMAIL", "boss@example.com")

    # Same email only in the (unverified) body → rejected.
    bad = await client.post(
        "/api/v1/auth/sync-user",
        json=_sync_body(role="admin", phone="+919812345601", email="boss@example.com"),
        headers=_token(str(uuid.uuid4()), "someone-else@example.com"),
    )
    assert bad.status_code == 403

    # Verified JWT email matches → bootstrap allowed.
    ok = await client.post(
        "/api/v1/auth/sync-user",
        json=_sync_body(role="admin", phone="+919812345602", email="boss@example.com"),
        headers=_token(str(uuid.uuid4()), "boss@example.com"),
    )
    assert ok.status_code == 201, ok.text
    assert ok.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_sync_user_cannot_hijack_existing_account(client: AsyncClient, db: AsyncSession):
    victim = User(
        name="Victim",
        phone="+919812345611",
        email="victim@example.com",
        role=UserRole.customer,
        status=UserStatus.approved,
        supabase_uid="victim-uid",
    )
    db.add(victim)
    await db.commit()

    # Attacker is a different Supabase user claiming the victim's phone/email in the body.
    resp = await client.post(
        "/api/v1/auth/sync-user",
        json=_sync_body(phone="+919812345611", email="victim@example.com"),
        headers=_token("attacker-uid", "attacker@example.com"),
    )
    assert resp.status_code == 403, resp.text

    await db.refresh(victim)
    assert victim.supabase_uid == "victim-uid"


@pytest.mark.asyncio
async def test_unclaimed_legacy_row_links_only_via_verified_email(client: AsyncClient, db: AsyncSession):
    legacy = User(
        name="Legacy",
        phone="+919812345621",
        email="legacy@example.com",
        role=UserRole.customer,
        status=UserStatus.approved,
        supabase_uid=None,
    )
    db.add(legacy)
    await db.commit()

    resp = await client.post(
        "/api/v1/auth/sync-user",
        json=_sync_body(phone="+919812345621", email="legacy@example.com"),
        headers=_token("legacy-new-uid", "Legacy@Example.com"),  # case-insensitive match
    )
    assert resp.status_code == 201, resp.text
    await db.refresh(legacy)
    assert legacy.supabase_uid == "legacy-new-uid"


# ---------------------------------------------------------------------------
# Data isolation
# ---------------------------------------------------------------------------

async def _make_farmer(db: AsyncSession, n: int) -> tuple[User, Farmer, dict]:
    user = User(
        name=f"Farmer {n}",
        phone=f"+91981234570{n}",
        email=f"farmer{n}@example.com",
        role=UserRole.farmer,
        status=UserStatus.approved,
        supabase_uid=f"farmer-uid-{n}",
    )
    db.add(user)
    await db.flush()
    farmer = Farmer(
        user_id=user.id,
        full_name=f"Farmer {n}",
        phone=user.phone,
        location="Somewhere",
        bank_account_number="plain:123456789012",
        ifsc_code="HDFC0001234",
        upi_id=f"farmer{n}@upi",
        is_approved=True,
    )
    db.add(farmer)
    await db.commit()
    await db.refresh(farmer)
    return user, farmer, _token(user.supabase_uid)


@pytest.mark.asyncio
async def test_farmer_cannot_read_another_farmers_order(
    client: AsyncClient, db: AsyncSession, customer_tokens: dict
):
    _, farmer_a, headers_a = await _make_farmer(db, 1)
    _, _farmer_b, headers_b = await _make_farmer(db, 2)

    order = Order(
        customer_id=customer_tokens["user"]["id"],
        farmer_id=farmer_a.id,
        total_amount=Decimal("100.00"),
        status=OrderStatus.accepted,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    assert (await client.get(f"/api/v1/orders/{order.id}", headers=headers_a)).status_code == 200
    assert (await client.get(f"/api/v1/orders/{order.id}", headers=headers_b)).status_code == 403
    assert (
        await client.get(f"/api/v1/orders/{order.id}", headers=customer_tokens["headers"])
    ).status_code == 200


@pytest.mark.asyncio
async def test_public_farmer_profile_hides_contact_and_bank(
    client: AsyncClient, db: AsyncSession, customer_tokens: dict
):
    _, farmer, owner_headers = await _make_farmer(db, 3)

    public = await client.get(f"/api/v1/farmers/{farmer.id}", headers=customer_tokens["headers"])
    assert public.status_code == 200
    body = public.json()
    assert body["bank_account_number"] is None
    assert body["upi_id"] is None
    assert body["ifsc_code"] == ""
    assert body["phone"] == ""

    own = await client.get(f"/api/v1/farmers/{farmer.id}", headers=owner_headers)
    assert own.status_code == 200
    assert own.json()["upi_id"] == "farmer3@upi"


# ---------------------------------------------------------------------------
# Milo
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_milo_chat_requires_authentication(client: AsyncClient):
    resp = await client.post("/api/v1/milo/chat", json={"query": "hello"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Delivery OTP
# ---------------------------------------------------------------------------

def test_otp_debug_backdoor_removed(monkeypatch):
    from app.core.security import hash_delivery_otp, verify_delivery_otp

    monkeypatch.setattr(settings, "DEBUG", True)
    hashed = hash_delivery_otp("123456")
    assert verify_delivery_otp("000000", hashed) is False
    assert verify_delivery_otp("123456", hashed) is True


def test_otp_guessing_is_bounded():
    from app.services import delivery_service as ds

    delivery_id = 987654
    ds._otp_reset(delivery_id)
    assert not ds._otp_attempts_exceeded(delivery_id)
    for _ in range(ds._OTP_MAX_FAILURES):
        ds._otp_record_failure(delivery_id)
    assert ds._otp_attempts_exceeded(delivery_id)
    ds._otp_reset(delivery_id)
    assert not ds._otp_attempts_exceeded(delivery_id)


# ---------------------------------------------------------------------------
# Demo workspace reset
# ---------------------------------------------------------------------------

DEMO_EMAILS = {
    "demo.customer@auxin.app",
    "demo.farmer@auxin.app",
    "demo.delivery@auxin.app",
    "demo.admin@auxin.app",
}


@pytest.mark.asyncio
async def test_demo_reset_is_super_admin_only(client: AsyncClient, admin_tokens: dict):
    resp = await client.post("/api/v1/admin/demo/reset", json={}, headers=admin_tokens["headers"])
    assert resp.status_code == 403, resp.text


@pytest.mark.asyncio
async def test_demo_reset_gives_fresh_accounts_pending_requests_and_spares_real_data(
    client: AsyncClient, db: AsyncSession, super_admin_tokens: dict, customer_tokens: dict, admin_tokens: dict
):
    from sqlalchemy import func, select

    from app.models.address import Address
    from app.models.catalogue import FarmerInventory
    from app.models.delivery import DeliveryPartner
    from app.repositories.inventory_repository import InventoryRepository

    # A REAL (non-demo) order that must survive any number of resets.
    _, real_farmer, _ = await _make_farmer(db, 4)
    real_order = Order(
        customer_id=customer_tokens["user"]["id"],
        farmer_id=real_farmer.id,
        total_amount=Decimal("55.00"),
        status=OrderStatus.accepted,
    )
    db.add(real_order)
    await db.commit()
    await db.refresh(real_order)
    real_order_id = real_order.id

    # One click: no password, no body. Twice: it must be repeatable and idempotent.
    for _ in range(2):
        resp = await client.post("/api/v1/admin/demo/reset", json={}, headers=super_admin_tokens["headers"])
        assert resp.status_code == 200, resp.text
        assert resp.json()["success"] is True

    db.expire_all()

    rows = {
        r.email: r
        for r in (
            await db.execute(
                select(User.id, User.email, User.is_demo, User.status).where(User.email.in_(DEMO_EMAILS))
            )
        ).all()
    }
    assert set(rows) == DEMO_EMAILS

    # Three demo accounts + one normal (non-demo) admin.
    assert rows["demo.admin@auxin.app"].is_demo is False
    assert sum(1 for r in rows.values() if r.is_demo) == 3

    # Customer is fresh and approved; farmer and courier are PENDING (requests for the admin).
    assert rows["demo.customer@auxin.app"].status == UserStatus.approved
    assert rows["demo.farmer@auxin.app"].status == UserStatus.pending
    assert rows["demo.delivery@auxin.app"].status == UserStatus.pending
    assert rows["demo.admin@auxin.app"].status == UserStatus.approved

    customer_addresses = (
        await db.execute(
            select(func.count()).select_from(Address).where(Address.user_id == rows["demo.customer@auxin.app"].id)
        )
    ).scalar_one()
    assert customer_addresses == 0

    # The requests really show up for the admin.
    pending_farmers = await client.get("/api/v1/admin/farmers/pending", headers=admin_tokens["headers"])
    assert pending_farmers.status_code == 200, pending_farmers.text
    farmer_names = [f["full_name"] for f in pending_farmers.json()["items"]]
    assert "Demo Farmer" in farmer_names
    pending_partners = (
        await db.execute(select(func.count()).select_from(DeliveryPartner).where(DeliveryPartner.user_id == rows["demo.delivery@auxin.app"].id))
    ).scalar_one()
    assert pending_partners == 1

    # Baseline produce exists once, but customers cannot see it until the farmer is approved.
    inv_count = (
        await db.execute(select(func.count()).select_from(FarmerInventory).where(FarmerInventory.is_demo.is_(True)))
    ).scalar_one()
    assert inv_count == 6
    inv_repo = InventoryRepository(db)
    assert len(await inv_repo.list_for_product(master_product_id=7)) == 0

    # Admin approves the demo farmer -> produce becomes visible to customers.
    farmer_id = next(f["id"] for f in pending_farmers.json()["items"] if f["full_name"] == "Demo Farmer")
    approve = await client.post(f"/api/v1/farmers/{farmer_id}/approve", headers=admin_tokens["headers"])
    assert approve.status_code == 200, approve.text
    db.expire_all()
    assert len(await inv_repo.list_for_product(master_product_id=7)) == 1

    # Real data is untouched.
    survivors = (
        await db.execute(select(func.count()).select_from(Order).where(Order.id == real_order_id))
    ).scalar_one()
    assert survivors == 1
    real_customer_is_demo = (
        await db.execute(select(User.is_demo).where(User.id == customer_tokens["user"]["id"]))
    ).scalar_one()
    assert real_customer_is_demo is False
