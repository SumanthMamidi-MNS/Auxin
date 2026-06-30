"""
app/api/v1/endpoints/disputes.py
==================================
Dispute endpoints for customers and farmers.

Routes:
  POST /disputes      – Raise a dispute for an order
  GET  /disputes/my   – List own disputes (paginated)

Admin-side dispute routes live in app/api/v1/endpoints/admin.py.

RBAC:
  - POST /disputes     → customer or farmer
  - GET  /disputes/my  → customer, farmer, or admin
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.admin import (
    DisputeOut,
    PaginatedDisputesOut,
    RaiseDisputeRequest,
)
from app.services.dispute_service import DisputeService

router = APIRouter(prefix="/disputes", tags=["Disputes"])


# ---------------------------------------------------------------------------
# POST /disputes  — Raise a dispute
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=DisputeOut,
    status_code=status.HTTP_201_CREATED,
    summary="Raise a dispute for an order",
    description=(
        "Customer or farmer involved in the order can raise a dispute. "
        "Only one active dispute (open/in_review) is allowed per order. "
        "Provide a clear `reason` (minimum 10 characters)."
    ),
)
async def raise_dispute(
    body: RaiseDisputeRequest,
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.customer, UserRole.farmer)),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DisputeOut:
    svc = DisputeService(db)
    return await svc.raise_dispute(
        order_id=body.order_id,
        reason=body.reason,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# GET /disputes/my  — Own dispute list
# ---------------------------------------------------------------------------

@router.get(
    "/my",
    response_model=PaginatedDisputesOut,
    status_code=status.HTTP_200_OK,
    summary="List my disputes",
    description=(
        "Returns a paginated list of disputes raised by the authenticated user. "
        "Accessible by customers, farmers, and admins."
    ),
)
async def list_my_disputes(
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.customer, UserRole.farmer, UserRole.admin)),
    ],
    db:        Annotated[AsyncSession, Depends(get_db)],
    page:      int = Query(1,  ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedDisputesOut:
    svc = DisputeService(db)
    return await svc.list_my_disputes(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )
