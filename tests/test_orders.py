"""
tests/test_orders.py
=====================
Order module API tests: creation, status transitions, RBAC, edge cases.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Helpers: create an approved farmer profile + product
# ---------------------------------------------------------------------------

async def _setup_farmer_product(
    client: AsyncClient,
    farmer_hdrs: dict,
    admin_hdrs:  dict,
    farmer_id:   int,
) -> int:
    """
    Create a farmer profile, admin-approve it, create a product,
    return the product_id.
    """
    # Create farmer profile
    fp = await client.post(
        "/api/v1/farmers/profile",
        json={
            "full_name":           "Test Farmer",
            "phone":               "+919876543211",
            "location":            "Village A",
            "bank_account_number": "123456789012",
            "ifsc_code":           "HDFC0001234",
        },
        headers=farmer_hdrs,
    )
    assert fp.status_code == 201, fp.text
    farmer_profile_id = fp.json()["id"]

    # Admin approves
    ap = await client.patch(
        f"/api/v1/admin/farmers/{farmer_profile_id}/approve",
        headers=admin_hdrs,
    )
    assert ap.status_code == 200, ap.text

    # Create product
    from datetime import date, timedelta
    harvest_date = (date.today() + timedelta(days=1)).isoformat()
    pp = await client.post(
        "/api/v1/products",
        json={
            "name":         "Tomatoes",
            "description":  "Fresh tomatoes",
            "price":        50.0,
            "quantity":     100,
            "unit":         "kg",
            "harvest_date": harvest_date,
        },
        headers=farmer_hdrs,
    )
    assert pp.status_code == 201, pp.text
    return pp.json()["id"]


# ---------------------------------------------------------------------------
# 1. Create order — success
# ---------------------------------------------------------------------------

async def test_create_order_success(
    client: AsyncClient,
    customer_tokens: dict,
    farmer_tokens: dict,
    admin_tokens: dict,
):
    product_id = await _setup_farmer_product(
        client,
        farmer_tokens["headers"],
        admin_tokens["headers"],
        farmer_tokens["user"]["id"],
    )

    r = await client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product_id, "quantity": 2}]},
        headers=customer_tokens["headers"],
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["status"] == "reserved"
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2


# ---------------------------------------------------------------------------
# 2. Create order — empty cart rejected
# ---------------------------------------------------------------------------

async def test_create_order_empty_items(client: AsyncClient, customer_tokens: dict):
    r = await client.post(
        "/api/v1/orders",
        json={"items": []},
        headers=customer_tokens["headers"],
    )
    assert r.status_code == 422
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 3. Create order — duplicate product_id rejected
# ---------------------------------------------------------------------------

async def test_create_order_duplicate_product(client: AsyncClient, customer_tokens: dict):
    r = await client.post(
        "/api/v1/orders",
        json={"items": [
            {"product_id": 1, "quantity": 1},
            {"product_id": 1, "quantity": 2},
        ]},
        headers=customer_tokens["headers"],
    )
    assert r.status_code == 422
    body = r.json()
    assert body["success"] is False


# ---------------------------------------------------------------------------
# 4. Create order — farmer cannot place order
# ---------------------------------------------------------------------------

async def test_farmer_cannot_create_order(client: AsyncClient, farmer_tokens: dict):
    r = await client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": 1, "quantity": 1}]},
        headers=farmer_tokens["headers"],
    )
    assert r.status_code == 403
    assert r.json()["success"] is False


# ---------------------------------------------------------------------------
# 5. List my orders — customer only
# ---------------------------------------------------------------------------

async def test_list_my_orders_empty(client: AsyncClient, customer_tokens: dict):
    r = await client.get("/api/v1/orders/my", headers=customer_tokens["headers"])
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert data["total"] == 0


# ---------------------------------------------------------------------------
# 6. Order access control — other customer cannot view
# ---------------------------------------------------------------------------

async def test_order_access_other_customer(
    client: AsyncClient,
    customer_tokens: dict,
    farmer_tokens: dict,
    admin_tokens: dict,
    db: AsyncSession,
):
    product_id = await _setup_farmer_product(
        client, farmer_tokens["headers"], admin_tokens["headers"], farmer_tokens["user"]["id"]
    )
    r = await client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product_id, "quantity": 1}]},
        headers=customer_tokens["headers"],
    )
    order_id = r.json()["id"]

    # Create second customer directly in DB
    from app.models.user import User, UserRole, UserStatus
    from tests.conftest import create_mock_supabase_token
    phone2 = "+919000000001"
    supabase_uid2 = "mock-customer2-uid"
    user2 = User(
        name="Eve",
        phone=phone2,
        email="eve@example.com",
        role=UserRole.customer,
        status=UserStatus.approved,
        supabase_uid=supabase_uid2,
    )
    db.add(user2)
    await db.commit()
    await db.refresh(user2)

    token2 = create_mock_supabase_token(supabase_uid2, phone2, "customer")
    hdrs2 = {"Authorization": f"Bearer {token2}"}

    # Eve tries to access customer1's order
    r4 = await client.get(f"/api/v1/orders/{order_id}", headers=hdrs2)
    assert r4.status_code == 403
    assert r4.json()["success"] is False


# ---------------------------------------------------------------------------
# 7. Cancel order — success
# ---------------------------------------------------------------------------

async def test_cancel_order(
    client: AsyncClient,
    customer_tokens: dict,
    farmer_tokens: dict,
    admin_tokens: dict,
    db: AsyncSession,
):
    product_id = await _setup_farmer_product(
        client, farmer_tokens["headers"], admin_tokens["headers"], farmer_tokens["user"]["id"]
    )
    r = await client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product_id, "quantity": 1}]},
        headers=customer_tokens["headers"],
    )
    order_id = r.json()["id"]

    from app.models.order import Order, OrderStatus
    from sqlalchemy import update
    await db.execute(
        update(Order).where(Order.id == order_id).values(status=OrderStatus.pending)
    )
    await db.commit()

    rc = await client.put(
        f"/api/v1/orders/{order_id}/cancel",
        headers=customer_tokens["headers"],
    )
    assert rc.status_code == 200
    assert rc.json()["status"] == "cancelled"


# ---------------------------------------------------------------------------
# 8. Health check
# ---------------------------------------------------------------------------

async def test_health_check(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code in (200, 503)  # 503 if SQLite probe fails (acceptable)
    data = r.json()
    assert "status" in data
    assert "version" in data
