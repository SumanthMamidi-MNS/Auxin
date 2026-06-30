"""
app/schemas/admin.py
=====================
Pydantic v2 request/response schemas for the Admin + Dispute module.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.models.admin import AdminActionType, DisputeStatus
from app.models.order import OrderStatus
from app.models.payment import PaymentStatus
from app.models.user import UserRole, UserStatus


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _iso(v: datetime | str) -> str:
    if isinstance(v, datetime):
        return v.isoformat()
    return v


# ---------------------------------------------------------------------------
# Admin Action schemas
# ---------------------------------------------------------------------------

class AdminActionOut(BaseModel):
    id:             int
    admin_user_id:  int
    action_type:    AdminActionType
    target_user_id: int | None
    metadata:       dict[str, Any]
    created_at:     str

    model_config = {"from_attributes": True}

    @field_validator("created_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)


# ---------------------------------------------------------------------------
# User monitoring schemas
# ---------------------------------------------------------------------------

class UserAdminOut(BaseModel):
    """Admin-visible user record (all fields, no sensitive secrets)."""

    id:         int
    name:       str
    phone:      str
    email:      str | None
    role:       UserRole
    status:     UserStatus
    created_at: str

    model_config = {"from_attributes": True}

    @field_validator("created_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)


class PaginatedUsersOut(BaseModel):
    items:       list[UserAdminOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


class SuspendUserRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)


class SuspendUserOut(BaseModel):
    user_id: int
    status:  UserStatus
    message: str


# ---------------------------------------------------------------------------
# Farmer approval schemas (extended for admin panel)
# ---------------------------------------------------------------------------

class PendingFarmerOut(BaseModel):
    """Farmer record for the pending-approval queue."""

    id:         int
    user_id:    int
    full_name:  str
    phone:      str
    location:   str
    ifsc_code:  str
    is_approved: bool
    created_at: str

    model_config = {"from_attributes": True}

    @field_validator("created_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)


class PaginatedPendingFarmersOut(BaseModel):
    items:       list[PendingFarmerOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


class FarmerApprovalActionOut(BaseModel):
    farmer_id:   int
    user_id:     int
    full_name:   str
    is_approved: bool
    action:      str   # "approved" | "rejected"
    message:     str


# ---------------------------------------------------------------------------
# Order monitoring schemas (admin view)
# ---------------------------------------------------------------------------

class OrderAdminOut(BaseModel):
    id:           int
    customer_id:  int
    farmer_id:    int
    total_amount: float
    status:       OrderStatus
    created_at:   str
    updated_at:   str

    model_config = {"from_attributes": True}

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)


class PaginatedOrdersAdminOut(BaseModel):
    items:       list[OrderAdminOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


# ---------------------------------------------------------------------------
# Payment monitoring schemas (admin view)
# ---------------------------------------------------------------------------

class PaymentAdminOut(BaseModel):
    id:                  int
    order_id:            int
    razorpay_order_id:   str
    razorpay_payment_id: str | None
    amount:              float
    currency:            str
    status:              PaymentStatus
    created_at:          str
    updated_at:          str

    model_config = {"from_attributes": True}

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)


class PaginatedPaymentsAdminOut(BaseModel):
    items:       list[PaymentAdminOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


# ---------------------------------------------------------------------------
# Dispute schemas
# ---------------------------------------------------------------------------

class RaiseDisputeRequest(BaseModel):
    order_id: int  = Field(..., gt=0)
    reason:   str  = Field(..., min_length=10, max_length=2000)


class ResolveDisputeRequest(BaseModel):
    """
    Used by admin to resolve or reject a dispute.
    `new_status` must be 'resolved' or 'rejected'.
    `resolution_note` is required.
    `trigger_refund` is only honoured when new_status == 'resolved'.
    """

    new_status:      DisputeStatus = Field(
        ...,
        description="Must be 'resolved' or 'rejected'.",
    )
    resolution_note: str = Field(..., min_length=5, max_length=2000)
    trigger_refund:  bool = Field(
        default=False,
        description="If True and status=resolved, issue a refund via payment module.",
    )

    @field_validator("new_status")
    @classmethod
    def _only_terminal(cls, v: DisputeStatus) -> DisputeStatus:
        if v not in (DisputeStatus.resolved, DisputeStatus.rejected):
            raise ValueError("new_status must be 'resolved' or 'rejected'.")
        return v


class DisputeOut(BaseModel):
    id:              int
    order_id:        int
    raised_by:       int
    reason:          str
    status:          DisputeStatus
    resolution_note: str | None
    created_at:      str
    updated_at:      str

    model_config = {"from_attributes": True}

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)


class PaginatedDisputesOut(BaseModel):
    items:       list[DisputeOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


class DisputeResolveOut(BaseModel):
    dispute_id:      int
    status:          DisputeStatus
    resolution_note: str
    refund_triggered: bool
    message:         str


# ---------------------------------------------------------------------------
# Product monitoring schemas (admin view)
# ---------------------------------------------------------------------------

class ProductAdminOut(BaseModel):
    """Admin-visible product record."""

    id:          int
    farmer_id:   int
    name:        str
    description: str | None
    price:       float
    quantity:    int
    unit:        str
    harvest_date: str
    image_url:   str
    is_active:   bool
    created_at:  str
    updated_at:  str

    model_config = {"from_attributes": True}

    @field_validator("harvest_date", mode="before")
    @classmethod
    def _date(cls, v) -> str:
        if hasattr(v, "isoformat"):
            return v.isoformat()
        return str(v)

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)


class PaginatedProductsAdminOut(BaseModel):
    items:       list[ProductAdminOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


# ---------------------------------------------------------------------------
# Admin stats schema
# ---------------------------------------------------------------------------

class AdminStatsOut(BaseModel):
    """Aggregate platform statistics for the admin dashboard."""

    total_users:    int
    total_farmers:  int
    total_products: int
    total_orders:   int
    total_payments: int
    total_disputes: int
    pending_farmers: int
    open_disputes:   int
    total_revenue:   float = 0.0


# ---------------------------------------------------------------------------
# Admin deliveries schemas
# ---------------------------------------------------------------------------

class DeliveryAdminOut(BaseModel):
    id:                 int
    order_id:           int
    partner_id:         int | None
    status:             str
    estimated_delivery: str | None
    actual_delivery:    str | None
    created_at:         str

    model_config = {"from_attributes": True}


class PaginatedDeliveriesAdminOut(BaseModel):
    items:       list[DeliveryAdminOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


