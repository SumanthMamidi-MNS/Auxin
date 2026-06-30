"""
app/schemas/payment.py
=======================
Pydantic v2 request / response schemas for the Payment + Escrow module.

Design decisions:
  - Amounts are exposed as float (rupees) in API responses; stored as Decimal
    (Numeric 12,2) in the DB.  Razorpay always uses paisa (integer) on the wire;
    the service layer converts.
  - razorpay_payment_id / razorpay_order_id are always returned as-is; the
    frontend uses razorpay_order_id to initialise the Razorpay checkout widget.
  - Signature verification is ONLY done server-side (POST /payments/verify).
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.payment import PaymentStatus, TransactionStatus, TransactionType


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class PaymentCreateRequest(BaseModel):
    """
    Customer initiates payment for a specific order.
    Idempotent: if a payment already exists in 'created' state for the order,
    the existing Razorpay order is returned.
    """

    order_id: int = Field(..., gt=0, description="The order to pay for.")


class PaymentVerifyRequest(BaseModel):
    """
    Posted by the client after the Razorpay checkout widget succeeds.

    The backend re-derives the expected HMAC-SHA256 signature and rejects
    the request if it does not match — the frontend cannot forge this.
    """

    razorpay_order_id:   str = Field(..., min_length=1)
    razorpay_payment_id: str = Field(..., min_length=1)
    razorpay_signature:  str = Field(..., min_length=1)


class RefundRequest(BaseModel):
    """
    Trigger a refund for a paid order.  Caller must be admin.
    The `reason` field is stored as the transaction note and forwarded to
    Razorpay as a note.
    """

    order_id: int  = Field(..., gt=0)
    reason:   str  = Field(
        default="Customer requested refund.",
        max_length=500,
    )


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class TransactionOut(BaseModel):
    id:         int
    payment_id: int
    type:       TransactionType
    amount:     float
    status:     TransactionStatus
    note:       str | None
    created_at: str  # ISO-8601

    model_config = {"from_attributes": True}

    @field_validator("created_at", mode="before")
    @classmethod
    def _serialize_dt(cls, v: datetime | str) -> str:
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class PaymentOut(BaseModel):
    id:                   int
    order_id:             int
    razorpay_order_id:    str
    razorpay_payment_id:  str | None
    amount:               float            # rupees
    currency:             str
    status:               PaymentStatus
    transactions:         list[TransactionOut]
    created_at:           str
    updated_at:           str

    model_config = {"from_attributes": True}

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def _serialize_dt(cls, v: datetime | str) -> str:
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class PaymentCreateOut(BaseModel):
    """
    Returned after POST /payments/create.
    The frontend uses `razorpay_order_id` + `razorpay_key_id` to open the
    Razorpay checkout widget.
    """

    payment_id:        int
    order_id:          int
    razorpay_order_id: str
    amount:            float   # rupees
    currency:          str
    status:            PaymentStatus
    razorpay_key_id:   str     # safe to expose — it's the public key


class PaymentVerifyOut(BaseModel):
    """Returned after successful signature verification."""

    payment_id:          int
    order_id:            int
    # str | None: can be None when payment was already verified (idempotent path).
    # The DB column is nullable; Pydantic v2 raises ValidationError if typed str.
    razorpay_payment_id: str | None
    status:              PaymentStatus
    message:             str


class RefundOut(BaseModel):
    """Returned after a successful refund initiation."""

    payment_id:            int
    order_id:              int
    refund_id:             str    # Razorpay refund ID
    amount_refunded:       float  # rupees
    status:                PaymentStatus
    message:               str


class EscrowReleaseOut(BaseModel):
    """Returned after internal escrow release (delivery confirmed)."""

    payment_id:  int
    order_id:    int
    amount:      float
    message:     str
