"""
app/schemas/admin.py
=====================
Pydantic v2 request/response schemas for the Admin + Dispute module.
"""

from datetime import datetime
from typing import Any, Optional

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
    rating:     float | None = None

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
    email:               str | None = None
    bank_name:           str | None = None
    account_holder_name: str | None = None
    bank_account_number: str | None = None
    upi_id:              str | None = None
    status:              str = "pending"

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

from app.schemas.order import OrderItemOut

class OrderAdminOut(BaseModel):
    id:           int
    customer_id:  int
    farmer_id:    int
    farmer_name:  str | None = None
    total_amount: float
    status:       OrderStatus
    items:        list[OrderItemOut] = []
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


# ---------------------------------------------------------------------------
# Rejection Request & Delivery Partner approval schemas
# ---------------------------------------------------------------------------

class RejectApprovalRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=3, max_length=500)


class PendingDeliveryPartnerOut(BaseModel):
    """Delivery partner record for the pending-approval queue."""

    id:         int
    user_id:    int
    full_name:  str
    phone:      str
    is_active:  bool
    created_at: str
    email:               str | None = None
    vehicle_type:        str | None = None
    vehicle_number:      str | None = None
    driving_license:     str | None = None
    bank_name:           str | None = None
    account_holder_name: str | None = None
    bank_account_number: str | None = None
    ifsc_code:           str | None = None
    upi_id:              str | None = None
    status:              str = "pending"

    model_config = {"from_attributes": True}

    @field_validator("created_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)


class PaginatedPendingDeliveryPartnersOut(BaseModel):
    items:       list[PendingDeliveryPartnerOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


class DeliveryPartnerApprovalActionOut(BaseModel):
    partner_id:  int
    user_id:     int
    full_name:   str
    is_active:   bool
    action:      str   # "approved" | "rejected"
    message:     str


# ---------------------------------------------------------------------------
# Phase 2.1A Additions: Activity Logs & Admin Management
# ---------------------------------------------------------------------------

class AdminActivityLogOut(BaseModel):
    id:             int
    timestamp:      str
    admin_name:     str
    admin_email:    str
    action:         str
    action_type:    str
    target:         str
    target_type:    str
    target_name:    str
    target_id:      int | None
    status:         str
    remarks:        str | None
    metadata:       dict[str, Any]

class PaginatedAdminActivityLogsOut(BaseModel):
    items:       list[AdminActivityLogOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int

class CreateAdminRequest(BaseModel):
    name:     str = Field(..., min_length=2, max_length=255)
    phone:    str = Field(..., min_length=10, max_length=15)
    email:    str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)

class AdminUserOut(BaseModel):
    id:             int
    name:           str
    phone:          str
    email:          str | None
    status:         UserStatus
    is_super_admin: bool
    supabase_uid:   str
    created_at:     str

    model_config = {"from_attributes": True}

    @field_validator("created_at", mode="before")
    @classmethod
    def _dt(cls, v: datetime | str) -> str:
        return _iso(v)

class PaginatedAdminsOut(BaseModel):
    items:       list[AdminUserOut]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


class SettingsChangeRequest(BaseModel):
    key:   str
    value: str


class DemoResetRequest(BaseModel):
    password_confirm: Optional[str] = None


class ServiceHealthItem(BaseModel):
    name: str
    status: str  # "online" | "warning" | "offline"
    latency_ms: Optional[float] = None
    detail: Optional[str] = None


class SystemHealthOut(BaseModel):
    status: str
    database: ServiceHealthItem
    api_gateway: ServiceHealthItem
    milo_ai: ServiceHealthItem
    auth_service: ServiceHealthItem
    storage: ServiceHealthItem
    payment_gateway: ServiceHealthItem
    server_time: str
    environment: str
    database_engine: str





