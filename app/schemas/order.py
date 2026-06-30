"""
app/schemas/order.py
=====================
Pydantic v2 request/response schemas for the order endpoints.

Validation rules:
  - Each cart item must have product_id > 0 and quantity >= 1.
  - Duplicate product_ids in the same request are rejected.
  - The item list must not be empty.
"""

from pydantic import BaseModel, Field, field_validator

from app.models.order import OrderStatus


# ---------------------------------------------------------------------------
# Sub-schemas (used inside request / response bodies)
# ---------------------------------------------------------------------------

class CartItemRequest(BaseModel):
    """A single line item in the order creation request."""

    product_id: int = Field(..., gt=0, description="Must be a positive integer.")
    quantity: int = Field(..., ge=1, description="Must order at least 1 unit.")


class OrderItemOut(BaseModel):
    """Response representation of a single order line item."""

    id: int
    product_id: int
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

    @field_validator("items", mode="after")
    @classmethod
    def no_duplicate_products(
        cls, items: list[CartItemRequest]
    ) -> list[CartItemRequest]:
        """Reject requests where the same product_id appears more than once."""
        seen: set[int] = set()
        for item in items:
            if item.product_id in seen:
                raise ValueError(
                    f"Duplicate product_id {item.product_id} in order. "
                    "Combine quantities into a single line item."
                )
            seen.add(item.product_id)
        return items


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class OrderOut(BaseModel):
    """Full order response including all line items."""

    id: int
    customer_id: int
    farmer_id: int
    total_amount: float
    status: OrderStatus
    items: list[OrderItemOut]
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
