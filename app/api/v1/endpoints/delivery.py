"""
app/api/v1/endpoints/delivery.py
==================================
Delivery endpoints — thin HTTP layer, all logic in services.

Routes (Delivery Partner profile management):
  POST /delivery/profile          → Create delivery partner profile (delivery role)
  GET  /delivery/profile/me       → Get own profile (delivery role)
  PUT  /delivery/availability     → Toggle online/offline (delivery role)
  PUT  /delivery/location         → Update GPS location (delivery role)

Routes (Delivery lifecycle):
  POST /delivery                  → Create delivery for an order (admin / internal)
  POST /delivery/assign/{id}      → Manually assign partner (admin)
  GET  /delivery/assigned         → List my deliveries (delivery role)
  GET  /delivery/{id}             → Get delivery detail (authenticated)
  GET  /delivery/by-order/{order_id} → Get delivery by order ID (authenticated)
  PUT  /delivery/{id}/status      → Advance status (delivery role)
  POST /delivery/{id}/verify-otp  → Complete delivery via OTP (delivery role)
"""

from typing import Annotated, Union

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.delivery import (
    CreateDeliveryPartnerProfileRequest,
    CreateDeliveryRequest,
    DeliveryOut,
    DeliveryOTPOut,
    DeliveryPartnerOut,
    DeliveryStatusOut,
    PaginatedDeliveriesOut,
    UpdateDeliveryStatusRequest,
    UpdateLocationRequest,
    VerifyDeliveryOTPRequest,
)
from app.services.delivery_partner_service import DeliveryPartnerService
from app.services.delivery_service import DeliveryService

router = APIRouter(prefix="/delivery", tags=["Delivery"])


# ===========================================================================
# Delivery Partner profile management
# ===========================================================================

@router.post(
    "/profile",
    response_model=DeliveryPartnerOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create delivery partner profile",
    description=(
        "Creates a delivery partner profile for the authenticated user. "
        "User must have role='delivery'. One profile per account."
    ),
)
async def create_delivery_profile(
    body: CreateDeliveryPartnerProfileRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.delivery))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryPartnerOut:
    service = DeliveryPartnerService(db)
    return await service.create_profile(
        requesting_user=current_user,
        full_name=body.full_name,
        phone=body.phone,
    )


@router.get(
    "/profile/me",
    response_model=DeliveryPartnerOut,
    status_code=status.HTTP_200_OK,
    summary="Get own delivery partner profile",
)
async def get_my_delivery_profile(
    current_user: Annotated[User, Depends(require_roles(UserRole.delivery))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryPartnerOut:
    service = DeliveryPartnerService(db)
    return await service.get_my_profile(requesting_user=current_user)


@router.put(
    "/availability",
    response_model=DeliveryPartnerOut,
    status_code=status.HTTP_200_OK,
    summary="Toggle availability (go online/offline)",
    description=(
        "Sets is_available on the delivery partner profile. "
        "Send `is_available=true` to go online, `false` to go offline."
    ),
)
async def toggle_availability(
    current_user: Annotated[User, Depends(require_roles(UserRole.delivery))],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_available: bool = Query(..., description="true = online, false = offline"),
) -> DeliveryPartnerOut:
    service = DeliveryPartnerService(db)
    return await service.toggle_availability(
        requesting_user=current_user,
        is_available=is_available,
    )


@router.put(
    "/location",
    response_model=DeliveryPartnerOut,
    status_code=status.HTTP_200_OK,
    summary="Update current GPS location",
    description="Updates the delivery partner's real-time GPS coordinates.",
)
async def update_location(
    body: UpdateLocationRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.delivery))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryPartnerOut:
    service = DeliveryPartnerService(db)
    return await service.update_location(
        requesting_user=current_user,
        latitude=body.latitude,
        longitude=body.longitude,
    )


# ===========================================================================
# Delivery lifecycle
# ===========================================================================

@router.post(
    "",
    response_model=DeliveryOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create delivery record for an accepted order",
    description=(
        "Creates a delivery record and attempts auto-assignment of the nearest "
        "available delivery partner. Admin-only endpoint. "
        "Destination coordinates are optional."
    ),
)
async def create_delivery(
    body: CreateDeliveryRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryOut:
    service = DeliveryService(db)
    return await service.create_delivery(
        order_id=body.order_id,
        destination_latitude=body.destination_latitude,
        destination_longitude=body.destination_longitude,
    )


@router.post(
    "/assign/{delivery_id}",
    response_model=DeliveryOut,
    status_code=status.HTTP_200_OK,
    summary="Manually assign a delivery partner",
    description=(
        "Admin can trigger partner assignment (or re-assignment after SLA timeout) "
        "for a delivery that remains in 'pending' state."
    ),
)
async def assign_partner(
    delivery_id: int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryOut:
    service = DeliveryService(db)
    return await service.assign_partner(
        delivery_id=delivery_id,
        requesting_user=current_user,
    )


@router.get(
    "/assigned",
    response_model=PaginatedDeliveriesOut,
    status_code=status.HTTP_200_OK,
    summary="List my assigned deliveries",
    description="Returns a paginated list of deliveries assigned to the authenticated delivery partner.",
)
async def list_my_deliveries(
    current_user: Annotated[User, Depends(require_roles(UserRole.delivery))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedDeliveriesOut:
    service = DeliveryService(db)
    return await service.list_my_deliveries(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/by-order/{order_id}",
    response_model=DeliveryOut,
    status_code=status.HTTP_200_OK,
    summary="Get delivery by order ID",
    description="Allows customers and farmers to track the delivery status for their order.",
)
async def get_delivery_by_order(
    order_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryOut:
    service = DeliveryService(db)
    return await service.get_delivery_by_order(
        order_id=order_id,
        requesting_user=current_user,
    )


@router.get(
    "/{delivery_id}",
    response_model=DeliveryOut,
    status_code=status.HTTP_200_OK,
    summary="Get delivery detail by ID",
    description="Returns full delivery details. Accessible by any authenticated user.",
)
async def get_delivery(
    delivery_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryOut:
    service = DeliveryService(db)
    return await service.get_delivery(
        delivery_id=delivery_id,
        requesting_user=current_user,
    )


@router.put(
    "/{delivery_id}/status",
    response_model=Union[DeliveryStatusOut, DeliveryOTPOut],
    status_code=status.HTTP_200_OK,
    summary="Update delivery status",
    description=(
        "The assigned delivery partner advances the delivery lifecycle. "
        "Valid transitions: assigned → picked_up → out_for_delivery → failed. "
        "Moving to **out_for_delivery** generates an OTP returned in the response — "
        "this is the only time it is shown in plain text."
    ),
)
async def update_delivery_status(
    delivery_id: int,
    body: UpdateDeliveryStatusRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.delivery))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Union[DeliveryStatusOut, DeliveryOTPOut]:
    service = DeliveryService(db)
    return await service.update_status(
        delivery_id=delivery_id,
        requesting_user=current_user,
        new_status=body.status,
        destination_latitude=body.destination_latitude,
        destination_longitude=body.destination_longitude,
    )


@router.post(
    "/{delivery_id}/verify-otp",
    response_model=DeliveryStatusOut,
    status_code=status.HTTP_200_OK,
    summary="Complete delivery via OTP verification",
    description=(
        "The delivery partner submits the 6-digit OTP given by the customer "
        "along with their current GPS location. "
        "On success the delivery is marked **delivered** and the OTP is cleared from the database. "
        "Fails if OTP is wrong, expired, or the partner is outside the geofence."
    ),
)
async def verify_delivery_otp(
    delivery_id: int,
    body: VerifyDeliveryOTPRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.delivery))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryStatusOut:
    service = DeliveryService(db)
    return await service.verify_otp(
        delivery_id=delivery_id,
        requesting_user=current_user,
        otp=body.otp,
        partner_latitude=body.latitude,
        partner_longitude=body.longitude,
    )
