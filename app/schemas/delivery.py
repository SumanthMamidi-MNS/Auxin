"""
app/schemas/delivery.py
========================
Pydantic v2 request/response schemas for delivery endpoints.

Validation rules:
  - Latitude:  -90.0 ≤ lat ≤ 90.0
  - Longitude: -180.0 ≤ lon ≤ 180.0
  - OTP:       exactly 6 digits
  - Phone:     E.164 format via phonenumbers lib
"""

import re

import phonenumbers
from pydantic import BaseModel, Field, field_validator

from app.models.delivery import DeliveryStatus


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CreateDeliveryPartnerProfileRequest(BaseModel):
    """Body for POST /delivery/profile"""

    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., description="Phone in E.164 format, e.g. +919876543210")

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        try:
            parsed = phonenumbers.parse(v, None)
        except phonenumbers.NumberParseException as exc:
            raise ValueError(f"Phone number could not be parsed: {exc}") from exc
        if not phonenumbers.is_valid_number(parsed):
            raise ValueError("Phone number is not a valid international number.")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


class UpdateLocationRequest(BaseModel):
    """Body for PUT /delivery/location"""

    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class UpdateDeliveryStatusRequest(BaseModel):
    """
    Body for PUT /delivery/{id}/status

    The partner sends the next status they want to transition to.
    Service layer validates the transition is legal.
    """

    status: DeliveryStatus

    # Optional delivery destination — provided when moving to out_for_delivery
    # so the geofence check has coordinates to work with.
    destination_latitude: float | None = Field(None, ge=-90.0, le=90.0)
    destination_longitude: float | None = Field(None, ge=-180.0, le=180.0)


class VerifyDeliveryOTPRequest(BaseModel):
    """Body for POST /delivery/{id}/verify-otp"""

    otp: str = Field(..., description="6-digit OTP provided by the customer.")

    # Partner's current location for geofence validation
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

    @field_validator("otp", mode="before")
    @classmethod
    def validate_otp_format(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP must be exactly 6 digits.")
        return v


class CreateDeliveryRequest(BaseModel):
    """
    Body for manually triggering delivery creation for an accepted order.
    Destination coordinates are optional — auto-assigned when known.
    """

    order_id: int = Field(..., gt=0)
    destination_latitude: float | None = Field(None, ge=-90.0, le=90.0)
    destination_longitude: float | None = Field(None, ge=-180.0, le=180.0)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class DeliveryPartnerOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: str
    is_active: bool
    is_available: bool
    current_latitude: float | None
    current_longitude: float | None
    created_at: str    # ISO-8601

    model_config = {"from_attributes": True}


class DeliveryOut(BaseModel):
    id: int
    order_id: int
    delivery_partner_id: int | None
    status: DeliveryStatus
    destination_latitude: float | None
    destination_longitude: float | None
    assigned_at: str | None
    picked_up_at: str | None
    delivered_at: str | None
    created_at: str

    model_config = {"from_attributes": True}


class DeliveryStatusOut(BaseModel):
    id: int
    status: DeliveryStatus
    message: str


class DeliveryOTPOut(BaseModel):
    """
    Returned after OTP is generated (out_for_delivery transition).
    NOTE: plain OTP is returned exactly ONCE — to the delivery partner
    to relay to the customer verbally / via SMS.  It is NOT stored in plain text.
    """

    delivery_id: int
    otp: str                  # plain text — only returned at generation time
    otp_expires_at: str       # ISO-8601


class PaginatedDeliveriesOut(BaseModel):
    items: list[DeliveryOut]
    total: int
    page: int
    page_size: int
    total_pages: int
