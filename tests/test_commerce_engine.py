"""
tests/test_commerce_engine.py
================================
Tests for Phase 3.11 Commerce Engine.
Validates inventory reservation, expiry release, demo Cash on Delivery,
and transition validation constraints.
"""

import pytest
from httpx import AsyncClient
from datetime import date, datetime, timezone, timedelta
from app.models.order import OrderStatus
from app.models.payment import PaymentStatus
from app.services.order_service import OrderService
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import Order
from app.models.user import User


async def _setup_catalogue_and_inventory(
    client: AsyncClient,
    farmer_hdrs: dict,
    admin_hdrs: dict,
) -> int:
    """Sets up a category, master product, approved farmer, and inventory. Returns inventory_id."""
    # 1. Create a category
    cat_resp = await client.post(
        "/api/v1/catalogue/admin/categories",
        json={"name": "Organic Fruits", "slug": "organic-fruits", "icon_emoji": "🍎", "display_order": 1},
        headers=admin_hdrs,
    )
    assert cat_resp.status_code == 201
    category_id = cat_resp.json()["id"]

    # 2. Create master product
    prod_resp = await client.post(
        "/api/v1/catalogue/admin/products",
        json={
            "category_id": category_id,
            "name": "Kashmiri Apple",
            "slug": "kashmiri-apple",
            "default_unit": "kg",
            "shelf_life_days": 10,
            "is_seasonal": False,
        },
        headers=admin_hdrs,
    )
    assert prod_resp.status_code == 201
    master_product_id = prod_resp.json()["id"]

    # 3. Farmer profile
    farmer_profile = await client.post(
        "/api/v1/farmers/profile",
        json={
            "full_name": "Satish Singh",
            "phone": "+919988776611",
            "location": "Shimla Apple Valley",
            "bank_account_number": "1234567890123",
            "ifsc_code": "SBIN0004321",
        },
        headers=farmer_hdrs,
    )
    assert farmer_profile.status_code == 201
    farmer_profile_id = farmer_profile.json()["id"]

    # 4. Approve farmer
    ap = await client.patch(
        f"/api/v1/admin/farmers/{farmer_profile_id}/approve",
        headers=admin_hdrs,
    )
    assert ap.status_code == 200

    # 5. Add farmer inventory (qty = 100)
    inv_resp = await client.post(
        "/api/v1/inventory",
        json={
            "master_product_id": master_product_id,
            "price": 120.0,
            "quantity": 100,
            "unit": "kg",
            "is_organic": True,
            "harvest_date": date.today().isoformat(),
        },
        headers=farmer_hdrs,
    )
    assert inv_resp.status_code == 201
    return inv_resp.json()["id"]


async def test_order_reservation_and_cod(
    client: AsyncClient,
    customer_tokens: dict,
    farmer_tokens: dict,
    admin_tokens: dict,
    db: AsyncSession,
):
    """Verify order is created in reserved status, stock is decremented, and COD simulated payment confirms order."""
    inventory_id = await _setup_catalogue_and_inventory(
        client,
        farmer_tokens["headers"],
        admin_tokens["headers"],
    )

    # Make the customer user a demo user in the DB
    await db.execute(
        update(User)
        .where(User.phone == "+919876543210")
        .values(is_demo=True)
    )
    await db.commit()

    # 1. Place Order (Reserved status, payment_method='cod')
    order_resp = await client.post(
        "/api/v1/orders",
        json={
            "items": [{"inventory_id": inventory_id, "quantity": 5}],
            "payment_method": "cod",
        },
        headers=customer_tokens["headers"],
    )
    assert order_resp.status_code == 201, order_resp.text
    order_data = order_resp.json()
    assert order_data["status"] == "reserved"
    assert order_data["payment_method"] == "cod"
    order_id = order_data["id"]

    # Verify stock decremented immediately (100 - 5 = 95)
    my_inv = await client.get("/api/v1/inventory/my", headers=farmer_tokens["headers"])
    assert my_inv.json()["items"][0]["quantity"] == 95

    # 2. Simulate COD payment (only allowed for demo users)
    pay_resp = await client.post(
        "/api/v1/payments/create",
        json={"order_id": order_id},
        headers=customer_tokens["headers"],
    )
    assert pay_resp.status_code == 201, pay_resp.text
    assert pay_resp.json()["status"] == "paid"

    # Verify order is now accepted
    get_order_resp = await client.get(f"/api/v1/orders/{order_id}", headers=customer_tokens["headers"])
    assert get_order_resp.json()["status"] == "accepted"


async def test_reservation_expiry_release(
    client: AsyncClient,
    customer_tokens: dict,
    farmer_tokens: dict,
    admin_tokens: dict,
    db: AsyncSession,
):
    """Verify expired reservations are automatically released and stock restored."""
    inventory_id = await _setup_catalogue_and_inventory(
        client,
        farmer_tokens["headers"],
        admin_tokens["headers"],
    )

    # 1. Place order (reserved)
    order_resp = await client.post(
        "/api/v1/orders",
        json={
            "items": [{"inventory_id": inventory_id, "quantity": 10}],
            "payment_method": "razorpay",
        },
        headers=customer_tokens["headers"],
    )
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    # Verify stock decremented (100 - 10 = 90)
    my_inv = await client.get("/api/v1/inventory/my", headers=farmer_tokens["headers"])
    assert my_inv.json()["items"][0]["quantity"] == 90

    # 2. Manually alter reservation_expires_at in DB using update statement to avoid lazy load MissingGreenlet
    await db.execute(
        update(Order)
        .where(Order.id == order_id)
        .values(reservation_expires_at=datetime.now(tz=timezone.utc) - timedelta(minutes=10))
    )
    await db.commit()

    # 3. Trigger any query / order service action to trigger lazy release
    # Let's call list my orders
    await client.get("/api/v1/orders/my", headers=customer_tokens["headers"])

    # 4. Verify order is now cancelled
    get_order_resp = await client.get(f"/api/v1/orders/{order_id}", headers=customer_tokens["headers"])
    assert get_order_resp.json()["status"] == "cancelled"

    # Verify stock was restored to 100
    my_inv_restored = await client.get("/api/v1/inventory/my", headers=farmer_tokens["headers"])
    assert my_inv_restored.json()["items"][0]["quantity"] == 100
