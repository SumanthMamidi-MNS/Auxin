"""
app/schemas/product.py
=======================
Pydantic v2 request/response schemas for the product endpoints.

Validation rules:
  - price  > 0
  - quantity >= 0
  - image_url not empty, must look like a valid URL
  - harvest_date must not be a future date beyond 1 year,
    and must not be so old the product is already expired
  - unit: non-empty string, max 50 chars
"""

from datetime import date, timedelta
from decimal import Decimal

from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator

from app.core.config import settings


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CreateProductRequest(BaseModel):
    """Body for POST /products"""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=5000)
    price: Decimal = Field(..., gt=0, description="Must be greater than 0.")
    quantity: int = Field(..., ge=0, description="Must be 0 or greater.")
    unit: str = Field(..., min_length=1, max_length=50, description="kg, piece, litre, etc.")
    harvest_date: date = Field(..., description="Date the crop was harvested.")
    image_url: str = Field(
        default="",
        max_length=2048,
        description="Optional product image URL. Defaults to empty string (no image).",
    )

    @field_validator("name", "unit", mode="before")
    @classmethod
    def strip_str(cls, v: str) -> str:
        return v.strip()

    @field_validator("image_url", mode="before")
    @classmethod
    def validate_image_url(cls, v: str) -> str:
        if v is None:
            return ""
        v = str(v).strip()
        # Empty is allowed — no image provided
        if not v:
            return v
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be a valid HTTP/HTTPS URL.")
        return v

    @field_validator("harvest_date", mode="before")
    @classmethod
    def validate_harvest_date(cls, v) -> date:
        if isinstance(v, str):
            try:
                v = date.fromisoformat(v)
            except ValueError:
                raise ValueError("harvest_date must be in YYYY-MM-DD format.")
        if not isinstance(v, date):
            raise ValueError("harvest_date must be a valid date.")
        today = date.today()
        # Cannot be more than 1 year in the future
        if v > today + timedelta(days=365):
            raise ValueError("harvest_date cannot be more than 1 year in the future.")
        # Warn but still allow: the listing will just immediately be hidden if expired.
        # (Service layer will reject if expiry is already passed at time of creation.)
        return v

    @model_validator(mode="after")
    def check_not_expired_at_creation(self) -> "CreateProductRequest":
        """
        Prevent creating a product whose harvest_date is already past the
        expiry threshold — it would immediately be invisible to customers.
        """
        cutoff = date.today() - timedelta(days=settings.PRODUCT_EXPIRY_DAYS)
        if self.harvest_date < cutoff:
            raise ValueError(
                f"harvest_date is too old: products are hidden after "
                f"{settings.PRODUCT_EXPIRY_DAYS} days.  "
                f"Earliest acceptable date: {cutoff.isoformat()}"
            )
        return self


class UpdateProductRequest(BaseModel):
    """
    Body for PUT /products/{id}
    All fields are optional — send only what you want to change.
    """

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=5000)
    price: Decimal | None = Field(None, gt=0)
    quantity: int | None = Field(None, ge=0)
    unit: str | None = Field(None, min_length=1, max_length=50)
    harvest_date: date | None = None
    image_url: str | None = Field(None, min_length=1, max_length=2048)

    @field_validator("name", "unit", mode="before")
    @classmethod
    def strip_str_opt(cls, v: str | None) -> str | None:
        return v.strip() if v else v

    @field_validator("image_url", mode="before")
    @classmethod
    def validate_image_url_opt(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("image_url must not be empty.")
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be a valid HTTP/HTTPS URL.")
        return v

    @field_validator("harvest_date", mode="before")
    @classmethod
    def validate_harvest_date_opt(cls, v) -> date | None:
        if v is None:
            return v
        if isinstance(v, str):
            try:
                v = date.fromisoformat(v)
            except ValueError:
                raise ValueError("harvest_date must be in YYYY-MM-DD format.")
        if not isinstance(v, date):
            raise ValueError("harvest_date must be a valid date.")
        if v > date.today() + timedelta(days=365):
            raise ValueError("harvest_date cannot be more than 1 year in the future.")
        return v

    @model_validator(mode="after")
    def at_least_one_field(self) -> "UpdateProductRequest":
        if all(
            v is None
            for v in [
                self.name,
                self.description,
                self.price,
                self.quantity,
                self.unit,
                self.harvest_date,
                self.image_url,
            ]
        ):
            raise ValueError("At least one field must be provided for update.")
        return self


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ProductOut(BaseModel):
    id: int
    farmer_id: int
    name: str
    description: str | None
    price: float
    quantity: int
    unit: str
    harvest_date: str        # ISO-8601 date string
    image_url: str
    is_active: bool
    created_at: str          # ISO-8601 datetime
    updated_at: str          # ISO-8601 datetime

    model_config = {"from_attributes": True}


class PaginatedProductsOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
    total_pages: int
