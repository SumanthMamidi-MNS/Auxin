"""
tests/test_catalogue_orders.py
=================================
Tests for the V3.0 Master Catalogue and Farmer Inventory order placement flows.
"""

import pytest
from httpx import AsyncClient
from datetime import date, timedelta


async def _setup_catalogue_and_inventory(
    client: AsyncClient,
    farmer_hdrs: dict,
    admin_hdrs: dict,
) -> int:
    """
    Sets up a master category, a master product, an approved farmer, and
    farmer inventory. Returns the inventory_id.
    """
    # 1. Create a category as Admin
    cat_resp = await client.post(
        "/api/v1/catalogue/admin/categories",
        json={
            "name": "Organic Greens",
            "slug": "organic-greens",
            "icon_emoji": "🥬",
            "display_order": 1,
        },
        headers=admin_hdrs,
    )
    assert cat_resp.status_code == 201, cat_resp.text
    category_id = cat_resp.json()["id"]

    # 2. Create a master product as Admin
    prod_resp = await client.post(
        "/api/v1/catalogue/admin/products",
        json={
            "category_id": category_id,
            "name": "Organic Spinach",
            "slug": "organic-spinach",
            "description": "Crispy fresh organic spinach leaves",
            "default_unit": "kg",
            "shelf_life_days": 4,
            "is_seasonal": False,
        },
        headers=admin_hdrs,
    )
    assert prod_resp.status_code == 201, prod_resp.text
    master_product_id = prod_resp.json()["id"]

    # 3. Setup Farmer Profile
    farmer_profile = await client.post(
        "/api/v1/farmers/profile",
        json={
            "full_name": "Rajesh Kumar",
            "phone": "+919988776655",
            "location": "Punjab Farms",
            "bank_account_number": "9876543210123",
            "ifsc_code": "SBIN0001234",
        },
        headers=farmer_hdrs,
    )
    assert farmer_profile.status_code == 201, farmer_profile.text
    farmer_profile_id = farmer_profile.json()["id"]

    # 4. Admin Approves Farmer
    approve_resp = await client.patch(
        f"/api/v1/admin/farmers/{farmer_profile_id}/approve",
        headers=admin_hdrs,
    )
    assert approve_resp.status_code == 200, approve_resp.text

    # 5. Add Farmer Inventory for the Master Product
    inv_resp = await client.post(
        "/api/v1/inventory",
        json={
            "master_product_id": master_product_id,
            "price": 45.0,
            "quantity": 150,
            "unit": "kg",
            "is_organic": True,
            "harvest_date": date.today().isoformat(),
            "notes": "Premium quality spinach, zero pesticides.",
        },
        headers=farmer_hdrs,
    )
    assert inv_resp.status_code == 201, inv_resp.text
    return inv_resp.json()["id"]


async def test_catalogue_order_success(
    client: AsyncClient,
    customer_tokens: dict,
    farmer_tokens: dict,
    admin_tokens: dict,
):
    """
    Test placing an order using farmer inventory_id.
    """
    inventory_id = await _setup_catalogue_and_inventory(
        client,
        farmer_tokens["headers"],
        admin_tokens["headers"],
    )

    # Place order as Customer
    order_resp = await client.post(
        "/api/v1/orders",
        json={
            "items": [
                {
                    "inventory_id": inventory_id,
                    "quantity": 10,
                }
            ]
        },
        headers=customer_tokens["headers"],
    )
    assert order_resp.status_code == 201, order_resp.text
    order_data = order_resp.json()
    assert order_data["status"] == "reserved"
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["inventory_id"] == inventory_id
    assert order_data["items"][0]["quantity"] == 10
    assert order_data["items"][0]["price_at_order_time"] == 45.0
    assert order_data["items"][0]["subtotal"] == 450.0

    # Verify inventory decrement
    my_inv = await client.get(
        "/api/v1/inventory/my",
        headers=farmer_tokens["headers"],
    )
    assert my_inv.status_code == 200, my_inv.text
    # Remaining quantity should be 150 - 10 = 140
    assert my_inv.json()["items"][0]["quantity"] == 140
