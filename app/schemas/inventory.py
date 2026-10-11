"""
app/schemas/inventory.py
=========================
Pydantic v2 schemas for Farmer Inventory operations.

Used by:
  - Farmer endpoints (add/update/remove inventory)
  - Customer product detail (list of available farmers for a product)
  - Order creation (inventory_id in CartItemRequest)
"""

from datetime import date, timedelta

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Inventory CRUD schemas (Farmer)
# ---------------------------------------------------------------------------

class InventoryCreateRequest(BaseModel):
    """Farmer adds their stock for a master product."""
    master_product_id: int
    price: float = Field(..., gt=0, description="Price per unit, must be > 0")
    quantity: int = Field(..., ge=0, description="Available quantity (0 means out of stock)")
    unit: str = Field(..., min_length=1, max_length=20, description="Unit of measure (kg, piece, litre, bunch, dozen, pack)")
    is_organic: bool = False
    harvest_date: date = Field(..., description="Date crop was harvested (YYYY-MM-DD)")
    notes: str | None = Field(None, max_length=500, description="Optional quality notes")

    @field_validator("unit", mode="before")
    @classmethod
    def clean_unit(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("harvest_date", mode="before")
    @classmethod
    def validate_harvest_date(cls, v) -> date:
        if isinstance(v, str):
            try:
                v = date.fromisoformat(v)
            except ValueError:
                raise ValueError("harvest_date must be YYYY-MM-DD format.")
        if not isinstance(v, date):
            raise ValueError("harvest_date must be a valid date.")
        today = date.today()
        if v > today:
            raise ValueError("harvest_date cannot be in the future.")
        # Stale threshold — 30 days
        cutoff = today - timedelta(days=30)
        if v < cutoff:
            raise ValueError(
                f"harvest_date is too old. Products are hidden after 30 days. "
                f"Earliest acceptable date: {cutoff.isoformat()}"
            )
        return v


class InventoryUpdateRequest(BaseModel):
    """Farmer updates their existing inventory entry."""
    price: float | None = Field(None, gt=0)
    quantity: int | None = Field(None, ge=0)
    unit: str | None = Field(None, min_length=1, max_length=20)
    is_organic: bool | None = None
    harvest_date: date | None = None
    notes: str | None = None
    is_active: bool | None = None

    @field_validator("unit", mode="before")
    @classmethod
    def clean_unit(cls, v: str | None) -> str | None:
        return v.strip().lower() if v else v

    @field_validator("harvest_date", mode="before")
    @classmethod
    def validate_harvest_date(cls, v) -> date | None:
        if v is None:
            return v
        if isinstance(v, str):
            try:
                v = date.fromisoformat(v)
            except ValueError:
                raise ValueError("harvest_date must be YYYY-MM-DD format.")
        if not isinstance(v, date):
            raise ValueError("harvest_date must be a valid date.")
        if v > date.today():
            raise ValueError("harvest_date cannot be in the future.")
        return v

    @model_validator(mode="after")
    def at_least_one_field(self) -> "InventoryUpdateRequest":
        if all(
            v is None
            for v in [
                self.price, self.quantity, self.unit,
                self.is_organic, self.harvest_date, self.notes, self.is_active,
            ]
        ):
            raise ValueError("At least one field must be provided for update.")
        return self


# ---------------------------------------------------------------------------
# Output schemas
# ---------------------------------------------------------------------------

class InventoryOut(BaseModel):
    """Full inventory entry — returned to farmer and admin."""
    id: int
    master_product_id: int
    master_product_name: str | None = None
    master_product_slug: str | None = None
    farmer_id: int
    price: float
    quantity: int
    unit: str
    is_organic: bool
    harvest_date: str        # ISO date
    notes: str | None
    is_active: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class FarmerInventoryOut(BaseModel):
    """Farmer supplier row — shown on the product detail page to customers."""
    inventory_id: int
    farmer_id: int
    farmer_name: str | None = None
    farmer_farm_name: str | None = None
    price: float
    quantity: int
    unit: str
    is_organic: bool
    harvest_date: str
    notes: str | None


class PaginatedInventoryOut(BaseModel):
    items: list[InventoryOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------------------------------------------------------------------
# Cart / Order integration
# ---------------------------------------------------------------------------

class InventoryCartItemRequest(BaseModel):
    """
    Used in POST /orders when the order is based on master catalogue.
    inventory_id identifies the specific farmer's stock to deduct from.
    """
    inventory_id: int
    quantity: int = Field(..., ge=1, description="Quantity to order (must be >= 1)")
