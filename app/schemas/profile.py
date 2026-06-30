"""
app/schemas/profile.py
======================
Pydantic v2 request/response schemas for the profile system.
"""

from pydantic import BaseModel, Field, field_validator
from app.models.user import UserRole, UserStatus


class ProfileOut(BaseModel):
    """Public representation of a user profile."""
    id: int
    name: str
    phone: str
    email: str | None
    address: str | None
    role: UserRole
    status: UserStatus

    model_config = {"from_attributes": True}


class CreateProfileRequest(BaseModel):
    """Body for POST /profile"""
    name: str = Field(..., min_length=2, max_length=100, description="Full Name")
    phone: str = Field(..., description="Exactly 10-digit mobile number")
    address: str = Field(..., min_length=5, max_length=500, description="Primary Address")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank.")
        return v

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Address cannot be blank.")
        return v

    @field_validator("phone")
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
            
        blacklist = {
            "9999999999",
            "1111111111",
            "1234567890",
            "0123456789",
            "9876543210"
        }
        if digits in blacklist:
            raise ValueError("Invalid phone number sequence.")
            
        return f"+91{digits}"


class UpdateProfileRequest(BaseModel):
    """Body for PUT /profile"""
    name: str | None = Field(None, min_length=2, max_length=100, description="Full Name")
    phone: str | None = Field(None, description="Exactly 10-digit mobile number")
    address: str | None = Field(None, min_length=5, max_length=500, description="Primary Address")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be blank.")
        return v

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Address cannot be blank.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().replace(" ", "").replace("-", "")
        if v.startswith("+91"):
            digits = v[3:]
        elif v.startswith("91") and len(v) == 12:
            digits = v[2:]
        else:
            digits = v
            
        if not digits.isdigit() or len(digits) != 10:
            raise ValueError("Phone number must contain exactly 10 digits.")
            
        blacklist = {
            "9999999999",
            "1111111111",
            "1234567890",
            "0123456789",
            "9876543210"
        }
        if digits in blacklist:
            raise ValueError("Invalid phone number sequence.")
            
        return f"+91{digits}"
