"""
app/schemas/auth.py
====================
Pydantic v2 request/response schemas for the auth endpoints.

Auth is handled by Supabase on the client side.  The backend exposes:
  - POST /auth/sync-user  → create/update our User row after Supabase sign-up
  - GET  /auth/me         → return the authenticated user's profile

Validation rules:
  - Phone number: E.164 format validated via `phonenumbers` library
  - Name: 2–100 printable characters
  - Role: strict enum match
"""

import phonenumbers
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole, UserStatus


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_e164_phone(value: str) -> str:
    """
    Validate and normalise a phone number to E.164 format.

    Raises ValueError with a descriptive message if the number is invalid.
    """
    value = value.strip()
    try:
        parsed = phonenumbers.parse(value, None)
    except phonenumbers.NumberParseException as exc:
        raise ValueError(
            f"Phone number could not be parsed: {exc}"
        ) from exc

    if not phonenumbers.is_valid_number(parsed):
        raise ValueError("Phone number is not a valid international number.")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class SyncUserRequest(BaseModel):
    """
    Body for POST /auth/sync-user.

    Called by the client immediately after Supabase sign-up to create a
    mirrored user record in our database.  The Supabase JWT (Bearer header)
    identifies the caller; this body supplies the application-layer profile.

    This endpoint is idempotent: calling it again with the same data is safe.
    """

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="User's display name.",
    )
    phone: str = Field(
        ...,
        description="Phone number in E.164 format, e.g. +919876543210",
        examples=["+919876543210"],
    )
    role: UserRole = Field(
        ...,
        description="User role: customer | farmer | delivery | admin",
    )
    email: EmailStr | None = Field(
        None,
        description="Optional email address.",
    )

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().replace(" ", "").replace("-", "")
        if v.startswith("+91"):
            digits = v[3:]
        elif v.startswith("91") and len(v) == 12:
            digits = v[2:]
        else:
            digits = v
            
        if not digits.isdigit() or len(digits) != 10:
            raise ValueError("Phone number must contain exactly 10 digits.")
            
        from app.core.security import is_fake_phone_number
        if is_fake_phone_number(digits):
            raise ValueError("Invalid phone number sequence.")
            
        return f"+91{digits}"

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name must not be blank.")
        return v


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class UserOut(BaseModel):
    """
    Public representation of a user account returned by auth endpoints.
    Contains no sensitive data (no supabase_uid, no secrets).
    """

    id: int
    name: str
    phone: str
    email: str | None
    role: UserRole
    status: UserStatus
    address: str | None = None
    is_super_admin: bool = False
    is_demo: bool = False
    created_at: str  # ISO-8601 string

    model_config = {"from_attributes": True}
