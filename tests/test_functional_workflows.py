"""
tests/test_functional_workflows.py
====================================
End-to-end functional integration tests for Auxin V3.0 across all 4 roles:
- Customer (Order, Review, Dispute)
- Farmer (Profile, Approval, Inventory, Order Packing)
- Delivery Partner (Profile, Approval, Availability, Location, Lifecycle Handshake, OTP Verification)
- Admin / Super Admin (Governance, Approvals, Disputes, Telemetry, Audit Trail)
"""

import pytest
from datetime import date
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole, UserStatus
from app.models.farmer import Farmer
from app.models.catalogue import MasterProduct, MasterCategory, FarmerInventory
from app.models.address import Address


@pytest.mark.asyncio
async def test_farmer_onboarding_and_approval_flow(
    client: AsyncClient,
    farmer_tokens: dict,
    admin_tokens: dict,
    db: AsyncSession,
):
    """Test farmer creates profile, admin approves, and farmer manages inventory."""
    # 1. Farmer creates profile
    profile_payload = {
        "full_name": "Ramesh Organic Farms",
        "phone": "+919876543211",
        "location": "Kolar, Karnataka",
        "bank_account_number": "123456789012",
        "ifsc_code": "SBIN0001234",
    }
    resp = await client.post(
        "/api/v1/farmers/profile",
        json=profile_payload,
        headers=farmer_tokens["headers"],
    )
    assert resp.status_code == 201, resp.text
    farmer_data = resp.json()
    assert farmer_data["full_name"] == "Ramesh Organic Farms"
    assert farmer_data["is_approved"] is False

    # 2. Admin views pending farmers
    resp = await client.get(
        "/api/v1/admin/farmers/pending",
        headers=admin_tokens["headers"],
    )
    assert resp.status_code == 200
    pending_list = resp.json()["items"]
    assert any(f["id"] == farmer_data["id"] for f in pending_list)

    # 3. Admin approves farmer (PATCH /admin/farmers/{id}/approve)
    resp = await client.patch(
        f"/api/v1/admin/farmers/{farmer_data['id']}/approve",
        headers=admin_tokens["headers"],
    )
    assert resp.status_code == 200
    assert resp.json()["is_approved"] is True

    # 4. Create a Master Product in db for farmer to list against
    cat = MasterCategory(name="Vegetables", slug="vegetables")
    db.add(cat)
    await db.commit()
    await db.refresh(cat)

    master_prod = MasterProduct(
        name="Organic Tomato",
        slug="organic-tomato",
        category_id=cat.id,
        default_unit="kg",
        is_active=True,
    )
    db.add(master_prod)
    await db.commit()
    await db.refresh(master_prod)

    # 5. Approved farmer adds inventory listing
    inv_payload = {
        "master_product_id": master_prod.id,
        "price": 45.0,
        "quantity": 100,
        "unit": "kg",
        "is_organic": True,
        "harvest_date": date.today().isoformat(),
        "notes": "Fresh red tomatoes",
    }
    resp = await client.post(
        "/api/v1/inventory",
        json=inv_payload,
        headers=farmer_tokens["headers"],
    )
    assert resp.status_code == 201, resp.text
    inv_data = resp.json()
    assert inv_data["price"] == 45.0
    assert inv_data["quantity"] == 100

    # 6. Farmer updates inventory listing
    resp = await client.put(
        f"/api/v1/inventory/{inv_data['id']}",
        json={"price": 50.0, "quantity": 80},
        headers=farmer_tokens["headers"],
    )
    assert resp.status_code == 200
    assert resp.json()["price"] == 50.0
    assert resp.json()["quantity"] == 80


@pytest.mark.asyncio
async def test_delivery_partner_onboarding_and_lifecycle_flow(
    client: AsyncClient,
    delivery_tokens: dict,
    admin_tokens: dict,
    demo_customer_tokens: dict,
    demo_farmer_tokens: dict,
    db: AsyncSession,
):
    """Test delivery partner onboarding, GPS/availability toggling, and complete delivery OTP handshake."""
    # 1. Create delivery partner profile
    resp = await client.post(
        "/api/v1/delivery/profile",
        json={"full_name": "Suresh Delivery", "phone": "+919876543213"},
        headers=delivery_tokens["headers"],
    )
    assert resp.status_code == 201, resp.text

    # 2. Toggle availability & update GPS location
    resp = await client.put(
        "/api/v1/delivery/availability?is_available=true",
        headers=delivery_tokens["headers"],
    )
    assert resp.status_code == 200
    assert resp.json()["is_available"] is True

    resp = await client.put(
        "/api/v1/delivery/location",
        json={"latitude": 12.9716, "longitude": 77.5946},
        headers=delivery_tokens["headers"],
    )
    assert resp.status_code == 200

    # 3. Setup Customer address & Farmer with Approved produce
    cust_user = await db.get(User, demo_customer_tokens["user"]["id"])
    cust_addr = Address(
        user_id=cust_user.id,
        house_flat="Flat 401",
        street="Palm Avenue",
        area="Koramangala",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560034",
        address_type="home",
        latitude=12.9352,
        longitude=77.6245,
        is_default=True,
    )
    db.add(cust_addr)

    farmer_user = await db.get(User, demo_farmer_tokens["user"]["id"])
    farmer = Farmer(
        user_id=farmer_user.id,
        full_name="Farm Direct",
        phone=farmer_user.phone,
        location="Bengaluru Rural",
        bank_account_number="123456789012",
        ifsc_code="SBIN0001234",
        is_approved=True,
    )
    db.add(farmer)
    await db.commit()
    await db.refresh(farmer)

    cat = MasterCategory(name="Fruits", slug="fruits")
    db.add(cat)
    await db.commit()
    await db.refresh(cat)

    master_prod = MasterProduct(name="Alphonso Mango", slug="alphonso-mango", category_id=cat.id, default_unit="kg")
    db.add(master_prod)
    await db.commit()
    await db.refresh(master_prod)

    inv = FarmerInventory(
        farmer_id=farmer.id,
        master_product_id=master_prod.id,
        price=150.0,
        quantity=50,
        unit="kg",
        is_organic=True,
        harvest_date=date.today(),
        is_active=True,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)

    # 4. Customer places COD order
    order_resp = await client.post(
        "/api/v1/orders",
        json={
            "items": [{"inventory_id": inv.id, "quantity": 2}],
            "payment_method": "cod",
        },
        headers=demo_customer_tokens["headers"],
    )
    assert order_resp.status_code == 201, order_resp.text
    order_data = order_resp.json()
    order_id = order_data["id"]

    # 5. Customer initiates COD payment (auto-accepts and assigns delivery)
    pay_resp = await client.post(
        "/api/v1/payments/create",
        json={"order_id": order_id},
        headers=demo_customer_tokens["headers"],
    )
    assert pay_resp.status_code == 201, pay_resp.text

    # 6. Farmer accepts & packs order
    resp = await client.put(f"/api/v1/orders/{order_id}/packing", headers=demo_farmer_tokens["headers"])
    assert resp.status_code == 200
    assert resp.json()["status"] == "packing"

    resp = await client.put(f"/api/v1/orders/{order_id}/ready-for-pickup", headers=demo_farmer_tokens["headers"])
    assert resp.status_code == 200
    assert resp.json()["status"] == "ready_for_pickup"

    # 7. Delivery partner fetches assigned trips
    resp = await client.get("/api/v1/delivery/assigned", headers=delivery_tokens["headers"])
    assert resp.status_code == 200
    deliveries = resp.json()["items"]
    assert len(deliveries) >= 1
    target_delivery = next(d for d in deliveries if d["order_id"] == order_id)
    delivery_id = target_delivery["id"]

    # 8. Delivery Partner accepts assignment
    resp = await client.put(
        f"/api/v1/delivery/{delivery_id}/status",
        json={"status": "accepted"},
        headers=delivery_tokens["headers"],
    )
    assert resp.status_code == 200

    # 9. Delivery Partner marks picked up
    resp = await client.put(
        f"/api/v1/delivery/{delivery_id}/status",
        json={"status": "picked_up"},
        headers=delivery_tokens["headers"],
    )
    assert resp.status_code == 200

    # 10. Delivery Partner moves to out for delivery -> generates OTP
    resp = await client.put(
        f"/api/v1/delivery/{delivery_id}/status",
        json={"status": "out_for_delivery"},
        headers=delivery_tokens["headers"],
    )
    assert resp.status_code == 200
    # The OTP is a customer-held secret: the partner response must not carry it.
    assert "otp" not in resp.json()
    cust_resp = await client.get(
        f"/api/v1/orders/{order_id}", headers=demo_customer_tokens["headers"]
    )
    assert cust_resp.status_code == 200
    generated_otp = cust_resp.json()["delivery"]["otp"]
    assert generated_otp

    # 11. Delivery Partner completes drop-off with customer OTP verification
    verify_resp = await client.post(
        f"/api/v1/delivery/{delivery_id}/verify-otp",
        json={
            "otp": generated_otp,
            "latitude": 12.9352,
            "longitude": 77.6245,
        },
        headers=delivery_tokens["headers"],
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["status"] == "delivered"


@pytest.mark.asyncio
async def test_consumer_review_and_dispute_flows(
    client: AsyncClient,
    demo_customer_tokens: dict,
    admin_tokens: dict,
    demo_farmer_tokens: dict,
    delivery_tokens: dict,
    db: AsyncSession,
):
    """Test customer submitting order review and raising dispute with admin resolution."""
    # 1. Setup Delivery partner profile
    await client.post(
        "/api/v1/delivery/profile",
        json={"full_name": "Fast Delivery", "phone": "+919876543213"},
        headers=delivery_tokens["headers"],
    )
    await client.put("/api/v1/delivery/availability?is_available=true", headers=delivery_tokens["headers"])
    await client.put("/api/v1/delivery/location", json={"latitude": 12.9784, "longitude": 77.6408}, headers=delivery_tokens["headers"])

    # Setup farmer, customer address, and produce
    farmer_user = await db.get(User, demo_farmer_tokens["user"]["id"])
    farmer = Farmer(
        user_id=farmer_user.id,
        full_name="Green Valley",
        phone=farmer_user.phone,
        location="Mysuru",
        bank_account_number="123456789012",
        ifsc_code="SBIN0001234",
        is_approved=True,
    )
    db.add(farmer)

    cust_user = await db.get(User, demo_customer_tokens["user"]["id"])
    cust_addr = Address(
        user_id=cust_user.id,
        house_flat="Flat 102",
        street="Rose Road",
        area="Indiranagar",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560038",
        address_type="home",
        latitude=12.9784,
        longitude=77.6408,
        is_default=True,
    )
    db.add(cust_addr)
    await db.commit()
    await db.refresh(farmer)

    cat = MasterCategory(name="Grains", slug="grains")
    db.add(cat)
    await db.commit()
    await db.refresh(cat)

    master_prod = MasterProduct(name="Basmati Rice", slug="basmati-rice", category_id=cat.id, default_unit="kg")
    db.add(master_prod)
    await db.commit()
    await db.refresh(master_prod)

    inv = FarmerInventory(
        farmer_id=farmer.id,
        master_product_id=master_prod.id,
        price=90.0,
        quantity=20,
        unit="kg",
        is_organic=True,
        harvest_date=date.today(),
        is_active=True,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)

    # 2. Place order & pay
    order_resp = await client.post(
        "/api/v1/orders",
        json={"items": [{"inventory_id": inv.id, "quantity": 1}], "payment_method": "cod"},
        headers=demo_customer_tokens["headers"],
    )
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    pay_resp = await client.post(
        "/api/v1/payments/create",
        json={"order_id": order_id},
        headers=demo_customer_tokens["headers"],
    )
    assert pay_resp.status_code == 201

    # 3. Farmer packs and gets ready for pickup
    await client.put(f"/api/v1/orders/{order_id}/packing", headers=demo_farmer_tokens["headers"])
    await client.put(f"/api/v1/orders/{order_id}/ready-for-pickup", headers=demo_farmer_tokens["headers"])

    # 4. Courier delivers order
    resp = await client.get("/api/v1/delivery/assigned", headers=delivery_tokens["headers"])
    deliveries = resp.json()["items"]
    delivery_id = next(d["id"] for d in deliveries if d["order_id"] == order_id)

    await client.put(f"/api/v1/delivery/{delivery_id}/status", json={"status": "accepted"}, headers=delivery_tokens["headers"])
    await client.put(f"/api/v1/delivery/{delivery_id}/status", json={"status": "picked_up"}, headers=delivery_tokens["headers"])
    otp_resp = await client.put(f"/api/v1/delivery/{delivery_id}/status", json={"status": "out_for_delivery"}, headers=delivery_tokens["headers"])
    assert "otp" not in otp_resp.json()
    cust_view = await client.get(
        f"/api/v1/orders/{order_id}", headers=demo_customer_tokens["headers"]
    )
    plain_otp = cust_view.json()["delivery"]["otp"]

    await client.post(
        f"/api/v1/delivery/{delivery_id}/verify-otp",
        json={"otp": plain_otp, "latitude": 12.9784, "longitude": 77.6408},
        headers=delivery_tokens["headers"],
    )

    # 5. Customer submits review on completed order
    review_resp = await client.post(
        f"/api/v1/orders/{order_id}/review",
        json={
            "farmer_rating": 5,
            "farmer_review": "Exceptional grain quality and clean aroma!",
            "delivery_rating": 5,
            "delivery_review": "On time delivery",
        },
        headers=demo_customer_tokens["headers"],
    )
    assert review_resp.status_code == 201
    assert review_resp.json()["farmer_rating"] == 5

    # 6. Admin inspects review analytics
    analytics_resp = await client.get("/api/v1/admin/reviews/analytics", headers=admin_tokens["headers"])
    assert analytics_resp.status_code == 200
    assert analytics_resp.json()["total_reviews"] >= 1

    # 7. Customer raises a dispute
    dispute_resp = await client.post(
        "/api/v1/disputes",
        json={
            "order_id": order_id,
            "reason": "Bag packaging was slightly torn during transit.",
        },
        headers=demo_customer_tokens["headers"],
    )
    assert dispute_resp.status_code == 201, dispute_resp.text
    dispute_id = dispute_resp.json()["id"]

    # 8. Admin resolves the dispute
    resolve_resp = await client.put(
        f"/api/v1/admin/disputes/{dispute_id}",
        json={
            "new_status": "resolved",
            "resolution_note": "Replaced item and credited wallet voucher.",
            "trigger_refund": False,
        },
        headers=admin_tokens["headers"],
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "resolved"


@pytest.mark.asyncio
async def test_live_admin_system_health_telemetry(
    client: AsyncClient,
    admin_tokens: dict,
):
    """Test admin system telemetry endpoint returning live operational indicators."""
    resp = await client.get("/api/v1/admin/system/health", headers=admin_tokens["headers"])
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "database" in data
    assert data["database"]["status"] == "online"
    assert "api_gateway" in data
    assert data["api_gateway"]["status"] == "online"
    assert "auth_service" in data
    assert "storage" in data
    assert "payment_gateway" in data
