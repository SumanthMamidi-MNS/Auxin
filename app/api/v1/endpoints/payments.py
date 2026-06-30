"""
app/api/v1/endpoints/payments.py
==================================
FastAPI router for the Payment + Escrow module.

Endpoints:
  POST /payments/create       – Customer initiates a payment (creates Razorpay order)
  POST /payments/verify       – Verify Razorpay signature (callback from frontend)
  POST /payments/refund       – Admin initiates a refund
  GET  /payments/{order_id}   – Get payment status + transaction history

RBAC summary:
  - POST /payments/create  → customer only
  - POST /payments/verify  → authenticated (any role; validated in service)
  - POST /payments/refund  → admin only
  - GET  /payments/{order_id} → customer (own), farmer (read-only), admin (any)

The escrow release endpoint is internal and is triggered automatically by the
delivery service when delivery status transitions to 'delivered'.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.payment import (
    PaymentCreateOut,
    PaymentCreateRequest,
    PaymentOut,
    PaymentVerifyOut,
    PaymentVerifyRequest,
    RefundOut,
    RefundRequest,
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


# ---------------------------------------------------------------------------
# POST /payments/create
# ---------------------------------------------------------------------------

@router.post(
    "/create",
    response_model=PaymentCreateOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Razorpay order for payment",
    description=(
        "Customer initiates payment for their placed order. "
        "Returns Razorpay order details needed to open the checkout widget. "
        "Idempotent: calling again for an already-created (unpaid) order returns the existing Razorpay order."
    ),
)
async def create_payment(
    body: PaymentCreateRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.customer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PaymentCreateOut:
    service = PaymentService(db)
    return await service.create_payment(
        order_id=body.order_id,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# POST /payments/verify
# ---------------------------------------------------------------------------

@router.post(
    "/verify",
    response_model=PaymentVerifyOut,
    status_code=status.HTTP_200_OK,
    summary="Verify Razorpay payment signature",
    description=(
        "Called by the frontend after the Razorpay checkout widget succeeds. "
        "The backend re-computes the HMAC-SHA256 signature and validates the "
        "payment amount before marking the payment as 'paid' (held in escrow). "
        "Do NOT trust the frontend's payment status — this endpoint is the only "
        "source of truth."
    ),
)
async def verify_payment(
    body: PaymentVerifyRequest,
    current_user: Annotated[User, Depends(get_current_user)],  # any authenticated role
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PaymentVerifyOut:
    service = PaymentService(db)
    return await service.verify_payment(
        razorpay_order_id=body.razorpay_order_id,
        razorpay_payment_id=body.razorpay_payment_id,
        razorpay_signature=body.razorpay_signature,
    )


# ---------------------------------------------------------------------------
# POST /payments/refund
# ---------------------------------------------------------------------------

@router.post(
    "/refund",
    response_model=RefundOut,
    status_code=status.HTTP_200_OK,
    summary="Initiate a refund for a paid order (admin only)",
    description=(
        "Admin-initiated full refund via Razorpay. "
        "Payment must be in 'paid' (escrow) state. "
        "Updates payment status to 'refunded' and logs the transaction."
    ),
)
async def refund_payment(
    body: RefundRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RefundOut:
    service = PaymentService(db)
    return await service.refund_payment(
        order_id=body.order_id,
        reason=body.reason,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# GET /payments/{order_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{order_id}",
    response_model=PaymentOut,
    status_code=status.HTTP_200_OK,
    summary="Get payment status and transaction history for an order",
    description=(
        "Returns full payment details including all transaction records. "
        "Customers can only view their own orders. "
        "Farmers get read-only access to payments linked to their orders. "
        "Admins can view any payment. "
        "Delivery partners are denied access."
    ),
)
async def get_payment(
    order_id: int,
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.customer, UserRole.farmer, UserRole.admin)),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PaymentOut:
    service = PaymentService(db)
    return await service.get_payment_by_order(
        order_id=order_id,
        requesting_user=current_user,
    )
