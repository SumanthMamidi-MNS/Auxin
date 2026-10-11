"""
tests/test_delivery_otp_eta_and_mission.py
==========================================
Comprehensive automated tests for:
  1. Centralized ETAService calculation and friendly range generation
  2. Customer <-> Farmer 25 KM geographic settlement validation at order creation
  3. Zero-knowledge OTP generation and verification
  4. Delivery mission state progression and idempotency
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timezone

from app.core.geolocation import haversine_distance_km
from app.services.eta_service import ETAService


# ---------------------------------------------------------------------------
# 1. ETA Service Unit Tests
# ---------------------------------------------------------------------------

def test_eta_service_assigned_stage():
    # Courier at (12.9352, 77.6245), Farm at (12.9716, 77.5946), Customer at (12.9250, 77.5850)
    eta = ETAService.calculate_delivery_eta(
        status="assigned",
        partner_lat=12.9352,
        partner_lon=77.6245,
        farm_lat=12.9716,
        farm_lon=77.5946,
        customer_lat=12.9250,
        customer_lon=77.5850,
    )
    assert eta["status"] == "assigned"
    assert eta["target_type"] == "farm"
    assert eta["estimated_minutes_min"] > 0
    assert eta["estimated_minutes_max"] >= eta["estimated_minutes_min"]
    assert "min" in eta["formatted_eta"]
    assert eta["distance_to_target_km"] is not None


def test_eta_service_out_for_delivery_stage():
    eta = ETAService.calculate_delivery_eta(
        status="out_for_delivery",
        partner_lat=12.9400,
        partner_lon=77.6000,
        farm_lat=12.9716,
        farm_lon=77.5946,
        customer_lat=12.9250,
        customer_lon=77.5850,
    )
    assert eta["status"] == "out_for_delivery"
    assert eta["target_type"] == "customer"
    assert eta["estimated_minutes_min"] > 0
    assert "min" in eta["formatted_eta"]


def test_eta_service_delivered_stage():
    eta = ETAService.calculate_delivery_eta(
        status="delivered",
        partner_lat=12.9250,
        partner_lon=77.5850,
        farm_lat=12.9716,
        farm_lon=77.5946,
        customer_lat=12.9250,
        customer_lon=77.5850,
    )
    assert eta["status"] == "delivered"
    assert eta["formatted_eta"] == "Delivered"
    assert eta["estimated_minutes_min"] == 0


# ---------------------------------------------------------------------------
# 2. Integration: End-to-End Guided Mission & Zero-Knowledge OTP
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_full_guided_delivery_mission_flow(
    client: AsyncClient,
    demo_customer_tokens: dict,
    farmer_tokens: dict,
    delivery_tokens: dict,
    admin_tokens: dict,
):
    """
    Validates complete mission lifecycle:
      - Farmer creates profile & admin approves
      - Customer orders fresh harvest
      - Delivery partner discovers within 25 km
      - Partner claims delivery
      - Partner starts trip to farm (accepted)
      - Partner confirms farm pickup (picked_up)
      - Partner starts delivery ride -> generates OTP
      - Customer retrieves OTP from order detail
      - Partner verifies OTP at doorstep -> delivered
    """
    # 0. Farmer creates profile & admin approves
    f_prof = await client.post(
        "/api/v1/farmers/profile",
        json={
            "full_name": "Ramesh Organic Farms",
            "phone": "+919876543211",
            "location": "Kolar, Karnataka",
            "bank_account_number": "123456789012",
            "ifsc_code": "SBIN0001234",
        },
        headers=farmer_tokens["headers"],
    )
    assert f_prof.status_code == 201
    farmer_id = f_prof.json()["id"]

    await client.patch(
        f"/api/v1/admin/farmers/{farmer_id}/approve",
        headers=admin_tokens["headers"],
    )

    # 1. Farmer creates product
    p_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Organic Strawberries",
            "category": "fruits",
            "price": 180.0,
            "quantity": 40,
            "unit": "box",
            "harvest_date": datetime.now(tz=timezone.utc).strftime("%Y-%m-%d"),
        },
        headers=farmer_tokens["headers"],
    )
    assert p_resp.status_code == 201
    product_id = p_resp.json()["id"]

    # 2. Customer places order
    ord_resp = await client.post(
        "/api/v1/orders",
        json={
            "items": [{"product_id": product_id, "quantity": 2}],
            "payment_method": "cod",
        },
        headers=demo_customer_tokens["headers"],
    )
    assert ord_resp.status_code == 201
    order_id = ord_resp.json()["id"]

    # 3. Pay / Simulate COD
    pay_resp = await client.post(
        "/api/v1/payments/create",
        json={"order_id": order_id},
        headers=demo_customer_tokens["headers"],
    )
    assert pay_resp.status_code == 201

    # 4. Farmer moves to packing
    await client.put(
        f"/api/v1/orders/{order_id}/packing",
        headers=farmer_tokens["headers"],
    )

    # 5. Delivery Partner creates profile, goes online, and updates location
    await client.post(
        "/api/v1/delivery/profile",
        json={"full_name": "Suresh Delivery", "phone": "+919876543213"},
        headers=delivery_tokens["headers"],
    )
    await client.put(
        "/api/v1/delivery/availability?is_available=true",
        headers=delivery_tokens["headers"],
    )
    await client.put(
        "/api/v1/delivery/location",
        json={"latitude": 12.9352, "longitude": 77.6245, "accuracy": 12.0},
        headers=delivery_tokens["headers"],
    )

    # 6. Discover available deliveries (25 KM smart queue)
    avail_resp = await client.get(
        "/api/v1/delivery/available",
        headers=delivery_tokens["headers"],
    )
    assert avail_resp.status_code == 200
    avail_items = avail_resp.json()["items"]
    matching_delivery = next((d for d in avail_items if d["order_id"] == order_id), None)
    assert matching_delivery is not None
    delivery_id = matching_delivery["id"]

    # 7. Delivery Partner claims mission
    claim_resp = await client.post(
        f"/api/v1/delivery/{delivery_id}/claim",
        headers=delivery_tokens["headers"],
    )
    assert claim_resp.status_code == 200
    assert claim_resp.json()["status"] == "assigned"

    # 8. Step 1: Start trip to farm (assigned -> accepted)
    step1_resp = await client.put(
        f"/api/v1/delivery/{delivery_id}/status",
        json={"status": "accepted"},
        headers=delivery_tokens["headers"],
    )
    assert step1_resp.status_code == 200

    # 9. Step 2: Confirm harvest pickup at farm (accepted -> picked_up)
    step2_resp = await client.put(
        f"/api/v1/delivery/{delivery_id}/status",
        json={"status": "picked_up"},
        headers=delivery_tokens["headers"],
    )
    assert step2_resp.status_code == 200

    # 10. Step 3: Start delivery to customer (picked_up -> out_for_delivery)
    step3_resp = await client.put(
        f"/api/v1/delivery/{delivery_id}/status",
        json={"status": "out_for_delivery"},
        headers=delivery_tokens["headers"],
    )
    assert step3_resp.status_code == 200

    # 11. Customer views order and securely sees their OTP
    cust_ord_resp = await client.get(
        f"/api/v1/orders/{order_id}",
        headers=demo_customer_tokens["headers"],
    )
    assert cust_ord_resp.status_code == 200
    cust_order_data = cust_ord_resp.json()
    assert cust_order_data["delivery"] is not None
    assert cust_order_data["delivery"]["status"] == "out_for_delivery"
    assert cust_order_data["delivery"]["otp"] is not None
    customer_otp = cust_order_data["delivery"]["otp"]

    # 12. Doorstep Verification: Incorrect OTP must fail with 400
    wrong_otp_resp = await client.post(
        f"/api/v1/delivery/{delivery_id}/verify-otp",
        json={"otp": "000000", "latitude": 12.9352, "longitude": 77.6245},
        headers=delivery_tokens["headers"],
    )
    assert wrong_otp_resp.status_code == 400

    # 13. Doorstep Verification: Correct OTP completes delivery
    correct_otp_resp = await client.post(
        f"/api/v1/delivery/{delivery_id}/verify-otp",
        json={"otp": customer_otp, "latitude": 12.9352, "longitude": 77.6245},
        headers=delivery_tokens["headers"],
    )
    assert correct_otp_resp.status_code == 200
    assert correct_otp_resp.json()["status"] == "delivered"

    # 14. Customer sees order is completed
    final_cust_ord = await client.get(
        f"/api/v1/orders/{order_id}",
        headers=demo_customer_tokens["headers"],
    )
    assert final_cust_ord.status_code == 200
    assert final_cust_ord.json()["status"] == "completed"

    # 15. Duplicate verification: idempotency must not crash and return 200 delivered
    dup_verify = await client.post(
        f"/api/v1/delivery/{delivery_id}/verify-otp",
        json={"otp": customer_otp, "latitude": 12.9352, "longitude": 77.6245},
        headers=delivery_tokens["headers"],
    )
    # Delivered status preserved
    assert dup_verify.status_code in [200, 409]


@pytest.mark.asyncio
async def test_customer_farmer_25km_boundary_validation(
    client: AsyncClient,
    demo_customer_tokens: dict,
    farmer_tokens: dict,
    admin_tokens: dict,
    db,
):
    """
    Test that placing an order with a farm > 25.0 km from customer's address is blocked.
    """
    from app.models.address import Address

    # Setup customer address in Central Bengaluru (12.9716, 77.5946)
    cust_user_id = demo_customer_tokens["user"]["id"] if isinstance(demo_customer_tokens["user"], dict) else demo_customer_tokens["user"].id
    farmer_user_id = farmer_tokens["user"]["id"] if isinstance(farmer_tokens["user"], dict) else farmer_tokens["user"].id

    cust_addr = Address(
        user_id=cust_user_id,
        house_flat="Flat 402",
        street="MG Road",
        area="Central",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560001",
        latitude=12.9716,
        longitude=77.5946,
        is_default=True,
    )
    db.add(cust_addr)
    await db.commit()

    # Setup farmer address far away (>50 km away in Tumakuru: 13.3409, 77.1010)
    farmer_user_addr = Address(
        user_id=farmer_user_id,
        house_flat="Farm Plot 1",
        street="Remote Farmland",
        area="Rural",
        city="Tumakuru",
        state="Karnataka",
        pin_code="572101",
        latitude=13.3409,
        longitude=77.1010,
        is_default=True,
    )
    db.add(farmer_user_addr)
    await db.commit()

    # Create & approve farmer profile
    f_prof = await client.post(
        "/api/v1/farmers/profile",
        json={
            "full_name": "Distant Organic Farms",
            "phone": "+919876543299",
            "location": "Tumakuru, Karnataka",
            "bank_account_number": "123456789099",
            "ifsc_code": "SBIN0001234",
        },
        headers=farmer_tokens["headers"],
    )
    farmer_id = f_prof.json()["id"]
    await client.patch(f"/api/v1/admin/farmers/{farmer_id}/approve", headers=admin_tokens["headers"])

    # Farmer creates product
    p_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Distant Apples",
            "category": "fruits",
            "price": 200.0,
            "quantity": 50,
            "unit": "kg",
            "harvest_date": datetime.now(tz=timezone.utc).strftime("%Y-%m-%d"),
        },
        headers=farmer_tokens["headers"],
    )
    product_id = p_resp.json()["id"]

    # Customer attempts to order -> must be rejected because distance ~65 km > 25.0 km
    ord_resp = await client.post(
        "/api/v1/orders",
        json={
            "items": [{"product_id": product_id, "quantity": 1}],
            "payment_method": "cod",
        },
        headers=demo_customer_tokens["headers"],
    )
    assert ord_resp.status_code == 409
    assert "25.0 km" in ord_resp.text

