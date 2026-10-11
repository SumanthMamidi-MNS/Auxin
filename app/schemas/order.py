"""
app/schemas/order.py
=====================
Pydantic v2 request/response schemas for the order endpoints.

Validation rules:
  - Each cart item must have product_id > 0 and quantity >= 1.
  - Duplicate product_ids in the same request are rejected.
  - The item list must not be empty.
"""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.order import OrderStatus
from app.models.delivery import DeliveryStatus


# ---------------------------------------------------------------------------
# Sub-schemas (used inside request / response bodies)
# ---------------------------------------------------------------------------

class CartItemRequest(BaseModel):
    """A single line item in the order creation request."""

    product_id: int | None = Field(None, gt=0, description="Legacy product ID (deprecated)")
    inventory_id: int | None = Field(None, gt=0, description="Farmer inventory ID")
    quantity: int = Field(..., ge=1, description="Must order at least 1 unit.")

    @model_validator(mode="after")
    def validate_ids(self) -> "CartItemRequest":
        if self.product_id is None and self.inventory_id is None:
            raise ValueError("Either product_id or inventory_id must be provided.")
        return self


class OrderItemOut(BaseModel):
    """Response representation of a single order line item."""

    id: int
    product_id: int | None = None
    inventory_id: int | None = None
    master_product_id: int | None = None
    product_name: str | None = None  # populated from item.product.name or master_product.name
    quantity: int
    price_at_order_time: float
    subtotal: float

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CreateOrderRequest(BaseModel):
    """Body for POST /orders"""

    items: list[CartItemRequest] = Field(
        ...,
        min_length=1,
        description="At least one item required.",
    )
    payment_method: str | None = Field("razorpay", description="Payment method: razorpay or cod")

    @field_validator("items", mode="after")
    @classmethod
    def no_duplicate_products(
        cls, items: list[CartItemRequest]
    ) -> list[CartItemRequest]:
        """Reject requests where the same item appears more than once."""
        seen_products: set[int] = set()
        seen_inventories: set[int] = set()
        for item in items:
            if item.product_id is not None:
                if item.product_id in seen_products:
                    raise ValueError(
                        f"Duplicate product_id {item.product_id} in order. "
                        "Combine quantities into a single line item."
                    )
                seen_products.add(item.product_id)
            if item.inventory_id is not None:
                if item.inventory_id in seen_inventories:
                    raise ValueError(
                        f"Duplicate inventory_id {item.inventory_id} in order. "
                        "Combine quantities into a single line item."
                    )
                seen_inventories.add(item.inventory_id)
        return items


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class OrderDeliveryPartnerOut(BaseModel):
    id: int
    full_name: str
    phone: str

    model_config = {"from_attributes": True}


class OrderDeliveryOut(BaseModel):
    id: int
    delivery_partner_id: int | None = None
    status: DeliveryStatus
    assigned_at: datetime | None = None
    picked_up_at: datetime | None = None
    delivered_at: datetime | None = None
    delivery_partner: OrderDeliveryPartnerOut | None = None
    otp: str | None = None
    formatted_eta: str | None = None
    expected_time: str | None = None
    estimated_minutes_min: int | None = None
    estimated_minutes_max: int | None = None
    distance_to_target_km: float | None = None
    current_latitude: float | None = None
    current_longitude: float | None = None

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    """Full order response including all line items."""

    id: int
    customer_id: int
    farmer_id: int
    farmer_name: str | None = None   # from farmer profile
    total_amount: float
    status: OrderStatus
    payment_method: str | None = None
    reservation_expires_at: datetime | None = None
    items: list[OrderItemOut]
    delivery: OrderDeliveryOut | None = None
    reviewed: bool = False
    created_at: str    # ISO-8601
    updated_at: str    # ISO-8601

    model_config = {"from_attributes": True}


class PaginatedOrdersOut(BaseModel):
    items: list[OrderOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class OrderStatusOut(BaseModel):
    """Lightweight response returned after a status-change action."""

    id: int
    status: OrderStatus
    message: str
