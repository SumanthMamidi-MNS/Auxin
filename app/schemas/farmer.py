"""
app/schemas/farmer.py
======================
Pydantic v2 request/response schemas for the farmer endpoints.

Validation rules:
  - IFSC code: 11-character Indian standard (XXXX0NNNNNN)
  - Bank account: 9–18 digits
  - Phone: E.164 (re-uses the validator from auth schemas)
  - Location: non-empty string
"""

import re

import phonenumbers
from pydantic import BaseModel, Field, field_validator

_IFSC_PATTERN = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
_BANK_ACC_PATTERN = re.compile(r"^\d{9,18}$")


def _validate_e164_phone(value: str) -> str:
    value = value.strip()
    try:
        parsed = phonenumbers.parse(value, None)
    except phonenumbers.NumberParseException as exc:
        raise ValueError(f"Phone number could not be parsed: {exc}") from exc
    if not phonenumbers.is_valid_number(parsed):
        raise ValueError("Phone number is not a valid international number.")
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CreateFarmerProfileRequest(BaseModel):
    """Body for POST /farmers/profile"""

    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., description="Phone in E.164 format, e.g. +919876543210")
    location: str = Field(..., min_length=2, max_length=1000)
    bank_account_number: str = Field(
        ...,
        description="9–18 digit bank account number.",
    )
    ifsc_code: str = Field(
        ...,
        description="11-character IFSC code, e.g. HDFC0001234",
    )

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_e164_phone(v)

    @field_validator("bank_account_number", mode="before")
    @classmethod
    def validate_bank_account(cls, v: str) -> str:
        v = v.strip()
        if not _BANK_ACC_PATTERN.match(v):
            raise ValueError("Bank account number must be 9–18 digits.")
        return v

    @field_validator("ifsc_code", mode="before")
    @classmethod
    def validate_ifsc(cls, v: str) -> str:
        v = v.strip().upper()
        if not _IFSC_PATTERN.match(v):
            raise ValueError(
                "IFSC code must be 11 characters: 4 letters, '0', then 6 alphanumeric "
                "(e.g. HDFC0001234)."
            )
        return v

    @field_validator("full_name", "location", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class FarmerProfileOut(BaseModel):
    """Safe public representation — bank account is NEVER returned."""

    id: int
    user_id: int
    full_name: str
    phone: str
    location: str
    ifsc_code: str
    is_approved: bool
    created_at: str   # ISO-8601

    model_config = {"from_attributes": True}


class FarmerApprovalOut(BaseModel):
    """Response for admin approval / revocation."""

    id: int
    user_id: int
    full_name: str
    is_approved: bool
    message: str
