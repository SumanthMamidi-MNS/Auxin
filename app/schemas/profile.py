"""
app/schemas/profile.py
======================
Pydantic v2 request/response schemas for the profile system.
"""

from pydantic import BaseModel, Field, field_validator
from app.models.user import UserRole, UserStatus


class AddressOut(BaseModel):
    """Public representation of an address."""
    id: int
    user_id: int
    house_flat: str
    building: str | None = None
    street: str
    area: str
    landmark: str | None = None
    city: str
    state: str
    pin_code: str
    address_type: str
    is_default: bool
    latitude: float | None = None
    longitude: float | None = None

    model_config = {"from_attributes": True}


class AddressCreate(BaseModel):
    """Body for POST /profile/addresses"""
    house_flat: str = Field(..., min_length=1, max_length=255)
    building: str | None = Field(None, max_length=255)
    street: str = Field(..., min_length=1, max_length=255)
    area: str = Field(..., min_length=1, max_length=255)
    landmark: str | None = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    pin_code: str = Field(..., min_length=6, max_length=6)
    address_type: str = Field(..., description="Home, Work, or Other")
    is_default: bool = False
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("pin_code")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("PIN Code must be exactly 6 digits.")
        return v


class AddressUpdate(BaseModel):
    """Body for PUT /profile/addresses/{address_id}"""
    house_flat: str | None = Field(None, min_length=1, max_length=255)
    building: str | None = Field(None, max_length=255)
    street: str | None = Field(None, min_length=1, max_length=255)
    area: str | None = Field(None, min_length=1, max_length=255)
    landmark: str | None = Field(None, max_length=255)
    city: str | None = Field(None, min_length=1, max_length=100)
    state: str | None = Field(None, min_length=1, max_length=100)
    pin_code: str | None = Field(None, min_length=6, max_length=6)
    address_type: str | None = Field(None)
    is_default: bool | None = None
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("pin_code")
    @classmethod
    def validate_pin(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v.isdigit() or len(v) != 6:
                raise ValueError("PIN Code must be exactly 6 digits.")
        return v


class ProfileOut(BaseModel):
    """Public representation of a user profile."""
    id: int
    name: str
    phone: str
    email: str | None
    address: str | None
    role: UserRole
    status: UserStatus
    addresses: list[AddressOut] = []

    model_config = {"from_attributes": True}


class CreateProfileRequest(BaseModel):
    """Body for POST /profile"""
    name: str = Field(..., min_length=2, max_length=100, description="Full Name")
    phone: str = Field(..., description="Exactly 10-digit mobile number")
    house_flat: str = Field(..., min_length=1, max_length=255)
    building: str | None = Field(None, max_length=255)
    street: str = Field(..., min_length=1, max_length=255)
    area: str = Field(..., min_length=1, max_length=255)
    landmark: str | None = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    pin_code: str = Field(..., min_length=6, max_length=6)
    address_type: str = Field("Home", description="Home, Work, or Other")
    latitude: float | None = None
    longitude: float | None = None
    farm_name: str | None = None
    farm_category: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank.")
        return v

    @field_validator("pin_code")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("PIN Code must be exactly 6 digits.")
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
            
        from app.core.security import is_fake_phone_number
        if is_fake_phone_number(digits):
            raise ValueError("Invalid phone number sequence.")
            
        return f"+91{digits}"


class UpdateProfileRequest(BaseModel):
    """Body for PUT /profile"""
    name: str | None = Field(None, min_length=2, max_length=100, description="Full Name")
    phone: str | None = Field(None, description="Exactly 10-digit mobile number")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be blank.")
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
