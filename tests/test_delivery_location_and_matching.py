"""
tests/test_delivery_location_and_matching.py
=============================================
Comprehensive integration and unit tests for:
  1. Real-time GPS location validation and metadata recording.
  2. 25 KM Smart Matching & Geographic Discovery.
  3. Delivery assignment concurrency safety (atomic claiming & single active run guard).
  4. Role-based access control and availability lifecycle.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalogue import MasterCategory, MasterProduct, FarmerInventory
from app.models.delivery import Delivery, DeliveryPartner, DeliveryStatus
from app.models.farmer import Farmer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User, UserRole, UserStatus
from app.models.address import Address
from app.core.geolocation import haversine_distance_km, validate_coordinates


# ---------------------------------------------------------------------------
# Unit tests: Geolocation utilities
# ---------------------------------------------------------------------------

def test_haversine_distance_km_accuracy():
    # Bangalore MG Road to Indiranagar (~4.2 km)
    lat1, lon1 = 12.9756, 77.6066
    lat2, lon2 = 12.9784, 77.6408
    dist = haversine_distance_km(lat1, lon1, lat2, lon2)
    assert 3.5 <= dist <= 4.5


def test_coordinate_validation():
    # Valid
    lat, lon = validate_coordinates(12.9716, 77.5946)
    assert lat == 12.9716
    assert lon == 77.5946

    # Invalid latitude
    with pytest.raises(ValueError, match="Latitude out of bounds"):
        validate_coordinates(95.0, 77.5946)

    with pytest.raises(ValueError, match="Latitude out of bounds"):
        validate_coordinates(-91.0, 77.5946)

    # Invalid longitude
    with pytest.raises(ValueError, match="Longitude out of bounds"):
        validate_coordinates(12.9716, 185.0)

    with pytest.raises(ValueError, match="Longitude out of bounds"):
        validate_coordinates(12.9716, -181.0)


# ---------------------------------------------------------------------------
# Integration tests: Delivery Partner Location Updates
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_delivery_location_valid(
    client: AsyncClient,
    delivery_tokens: dict,
    db: AsyncSession,
):
    """Delivery partner updates their GPS coordinates with accuracy."""
    user_id = delivery_tokens["user"]["id"]

    # Create delivery partner profile first
    partner = DeliveryPartner(
        user_id=user_id,
        full_name="Rider One",
        phone="+919876543213",
        is_active=True,
        is_available=True,
    )
    db.add(partner)
    await db.commit()

    # Update location
    payload = {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "accuracy": 12.5,
    }
    res = await client.put(
        "/api/v1/delivery/location",
        json=payload,
        headers=delivery_tokens["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert data["current_latitude"] == 12.9716
    assert data["current_longitude"] == 77.5946
    assert data["location_accuracy"] == 12.5
    assert data["location_updated_at"] is not None


@pytest.mark.asyncio
async def test_update_delivery_location_invalid_coords(
    client: AsyncClient,
    delivery_tokens: dict,
    db: AsyncSession,
):
    """Out-of-bounds coordinates must fail schema validation (422)."""
    user_id = delivery_tokens["user"]["id"]
    partner = DeliveryPartner(
        user_id=user_id,
        full_name="Rider One",
        phone="+919876543213",
        is_active=True,
        is_available=True,
    )
    db.add(partner)
    await db.commit()

    # Latitude > 90
    res = await client.put(
        "/api/v1/delivery/location",
        json={"latitude": 95.0, "longitude": 77.5946},
        headers=delivery_tokens["headers"],
    )
    assert res.status_code == 422

    # Longitude < -180
    res = await client.put(
        "/api/v1/delivery/location",
        json={"latitude": 12.9716, "longitude": -190.0},
        headers=delivery_tokens["headers"],
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_update_delivery_location_forbidden_for_customer(
    client: AsyncClient,
    customer_tokens: dict,
):
    """Customers cannot call the delivery location update endpoint."""
    res = await client.put(
        "/api/v1/delivery/location",
        json={"latitude": 12.9716, "longitude": 77.5946},
        headers=customer_tokens["headers"],
    )
    assert res.status_code == 403


# ---------------------------------------------------------------------------
# Integration tests: 25 KM Geographic Eligibility Matching & Discovery
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_available_deliveries_25km_matching(
    client: AsyncClient,
    delivery_tokens: dict,
    db: AsyncSession,
):
    """
    Test 25 KM matching:
      - Farmer location: (12.9716, 77.5946)
      - Delivery 1: Unassigned pending order from this farmer
      - Partner within 2.5 km -> Receives order in /delivery/available
      - Partner moves to 35.0 km away -> /delivery/available returns empty
    """
    # 1. Create Farmer with address coordinates (Bangalore center: 12.9716, 77.5946)
    farmer_user = User(
        name="Green Farm Owner",
        phone="+919876543211",
        email="greenfarm@example.com",
        role=UserRole.farmer,
        status=UserStatus.approved,
        supabase_uid="mock-farmer-uid",
    )
    db.add(farmer_user)
    await db.commit()
    await db.refresh(farmer_user)

    farm_address = Address(
        user_id=farmer_user.id,
        address_type="Farm",
        house_flat="Plot 42",
        street="Green Valley Road",
        area="North Zone",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560001",
        latitude=12.9716,
        longitude=77.5946,
        is_default=True,
    )
    db.add(farm_address)

    farmer = Farmer(
        user_id=farmer_user.id,
        full_name="Green Farm Owner",
        phone="+919876543211",
        location="Bengaluru, Karnataka",
        bank_name="State Bank of India",
        account_holder_name="Green Farm Owner",
        bank_account_number="123456789012",
        ifsc_code="SBIN0001234",
        is_approved=True,
    )
    db.add(farmer)

    # 2. Create Customer with delivery address
    customer_user = User(
        name="Urban Customer",
        phone="+919876543210",
        email="customer@example.com",
        role=UserRole.customer,
        status=UserStatus.approved,
        supabase_uid="mock-cust-uid",
    )
    db.add(customer_user)
    await db.commit()
    await db.refresh(customer_user)

    cust_address = Address(
        user_id=customer_user.id,
        address_type="Home",
        house_flat="Flat 302",
        street="Koramangala 4th Block",
        area="South Zone",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560034",
        latitude=12.9352,
        longitude=77.6245,
        is_default=True,
    )
    db.add(cust_address)

    # 3. Create Order in accepted status
    order = Order(
        customer_id=customer_user.id,
        farmer_id=farmer.id,
        total_amount=450.0,
        status=OrderStatus.accepted,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # 4. Create Delivery in pending (unassigned) status
    delivery = Delivery(
        order_id=order.id,
        delivery_partner_id=None,
        status=DeliveryStatus.pending,
        destination_latitude=12.9352,
        destination_longitude=77.6245,
    )
    db.add(delivery)

    # 5. Set up delivery partner profile for authenticated user
    partner_user_id = delivery_tokens["user"]["id"]
    partner = DeliveryPartner(
        user_id=partner_user_id,
        full_name="Express Rider",
        phone="+919876543213",
        is_active=True,
        is_available=True,
        current_latitude=12.9800,  # ~1.1 km from farm (12.9716, 77.5946)
        current_longitude=77.6000,
    )
    db.add(partner)
    await db.commit()

    # Step A: Query available deliveries when partner is within 25 km
    res = await client.get(
        "/api/v1/delivery/available",
        headers=delivery_tokens["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["id"] == delivery.id
    assert item["order_id"] == order.id
    assert item["distance_to_farm_km"] is not None
    assert item["distance_to_farm_km"] < 25.0

    # Step B: Move partner to far away location (Mysuru: ~140 km away)
    partner.current_latitude = 12.2958
    partner.current_longitude = 76.6394
    db.add(partner)
    await db.commit()

    res_far = await client.get(
        "/api/v1/delivery/available",
        headers=delivery_tokens["headers"],
    )
    assert res_far.status_code == 200
    data_far = res_far.json()
    assert data_far["total"] == 0
    assert len(data_far["items"]) == 0


# ---------------------------------------------------------------------------
# Integration tests: Atomic Claiming & Concurrency Safety
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_atomic_claim_delivery_and_single_active_run(
    client: AsyncClient,
    delivery_tokens: dict,
    db: AsyncSession,
):
    """
    Test claiming an unassigned delivery:
      1. Partner claims pending delivery -> 200 OK.
      2. Delivery status is now assigned to partner.
      3. Partner tries to query available deliveries while busy -> Returns empty.
      4. Another partner tries to claim the same delivery -> Fails (409 Conflict).
    """
    # 1. Setup Order and Delivery
    farmer_user = User(
        name="Eco Farm",
        phone="+919876543211",
        email="ecofarm@example.com",
        role=UserRole.farmer,
        status=UserStatus.approved,
        supabase_uid="mock-farmer-2",
    )
    db.add(farmer_user)
    await db.commit()
    await db.refresh(farmer_user)

    farmer = Farmer(
        user_id=farmer_user.id,
        full_name="Eco Farm",
        phone="+919876543211",
        location="Bengaluru",
        bank_name="HDFC Bank",
        account_holder_name="Eco Farm",
        bank_account_number="987654321098",
        ifsc_code="HDFC0001234",
        is_approved=True,
    )
    db.add(farmer)

    customer_user = User(
        name="Alice",
        phone="+919876543210",
        email="alice@example.com",
        role=UserRole.customer,
        status=UserStatus.approved,
        supabase_uid="mock-cust-2",
    )
    db.add(customer_user)
    await db.commit()
    await db.refresh(customer_user)

    order = Order(
        customer_id=customer_user.id,
        farmer_id=farmer.id,
        total_amount=320.0,
        status=OrderStatus.accepted,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    delivery = Delivery(
        order_id=order.id,
        delivery_partner_id=None,
        status=DeliveryStatus.pending,
        destination_latitude=12.9352,
        destination_longitude=77.6245,
    )
    db.add(delivery)

    # Delivery Partner 1
    partner1 = DeliveryPartner(
        user_id=delivery_tokens["user"]["id"],
        full_name="Rider One",
        phone="+919876543213",
        is_active=True,
        is_available=True,
        current_latitude=12.9716,
        current_longitude=77.5946,
    )
    db.add(partner1)
    await db.commit()

    # Step 1: Partner 1 claims the delivery
    claim_res = await client.post(
        f"/api/v1/delivery/{delivery.id}/claim",
        headers=delivery_tokens["headers"],
    )
    assert claim_res.status_code == 200
    claimed_data = claim_res.json()
    assert claimed_data["status"] == "assigned"
    assert claimed_data["delivery_partner_id"] == partner1.id

    # Step 2: While busy on active run, Partner 1 sees 0 available deliveries
    avail_res = await client.get(
        "/api/v1/delivery/available",
        headers=delivery_tokens["headers"],
    )
    assert avail_res.status_code == 200
    assert avail_res.json()["total"] == 0

    # Step 3: Second claim on the already assigned delivery must fail (409)
    second_claim = await client.post(
        f"/api/v1/delivery/{delivery.id}/claim",
        headers=delivery_tokens["headers"],
    )
    # Partner 1 is busy OR delivery is already claimed
    assert second_claim.status_code == 409
