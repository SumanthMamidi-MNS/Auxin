"""
app/api/v1/endpoints/admin.py
================================
Admin-only endpoints for platform governance.

Routes:
  GET  /admin/users                      – List all users (with role filter + pagination)
  PUT  /admin/users/{user_id}/suspend    – Suspend a user account
  PUT  /admin/users/{user_id}/reinstate  – Reinstate a suspended user

  GET  /admin/farmers/pending            – List farmers awaiting approval
  PUT  /admin/farmers/{farmer_id}/approve – Approve a farmer
  PUT  /admin/farmers/{farmer_id}/reject  – Reject / revoke a farmer

  GET  /admin/orders                     – List all orders (with status filter + pagination)
  GET  /admin/payments                   – List all payments (with status filter + pagination)

  GET  /admin/disputes                   – List all disputes (with status filter + pagination)
  PUT  /admin/disputes/{dispute_id}      – Resolve or reject a dispute

All endpoints require role=admin enforced by require_roles(UserRole.admin).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminStatsOut,
    DisputeOut,
    DisputeResolveOut,
    FarmerApprovalActionOut,
    PaginatedDeliveriesAdminOut,
    PaginatedDisputesOut,
    PaginatedOrdersAdminOut,
    PaginatedPaymentsAdminOut,
    PaginatedPendingFarmersOut,
    PaginatedProductsAdminOut,
    PaginatedUsersOut,
    ResolveDisputeRequest,
    SuspendUserOut,
    SuspendUserRequest,
)
from app.services.admin_service import AdminService
from app.services.dispute_service import DisputeService

router = APIRouter(prefix="/admin", tags=["Admin"])



# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    response_model=PaginatedUsersOut,
    status_code=status.HTTP_200_OK,
    summary="List all users (admin)",
    description=(
        "Returns a paginated list of all platform users. "
        "Optional `role` query param to filter by role. "
        "Admin only."
    ),
)
async def list_users(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
    role:         str | None = Query(None, description="Filter by role: farmer|customer|delivery|admin"),
    page:         int        = Query(1,    ge=1),
    page_size:    int        = Query(20,   ge=1, le=100),
) -> PaginatedUsersOut:
    svc = AdminService(db)
    return await svc.list_users(
        requesting_user=current_user,
        role_filter=role,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/users/{user_id}/suspend",
    response_model=SuspendUserOut,
    status_code=status.HTTP_200_OK,
    summary="Suspend a user account",
    description=(
        "Suspends the specified user, disabling login and all actions. "
        "Admins cannot suspend other admins. Logged to admin_actions."
    ),
)
async def suspend_user(
    user_id:      int,
    body:         SuspendUserRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> SuspendUserOut:
    svc = AdminService(db)
    return await svc.suspend_user(
        requesting_user=current_user,
        target_user_id=user_id,
        reason=body.reason,
    )


@router.put(
    "/users/{user_id}/reinstate",
    response_model=SuspendUserOut,
    status_code=status.HTTP_200_OK,
    summary="Reinstate a suspended user",
    description="Re-activates a previously suspended user account. Logged to admin_actions.",
)
async def reinstate_user(
    user_id:      int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> SuspendUserOut:
    svc = AdminService(db)
    return await svc.reinstate_user(
        requesting_user=current_user,
        target_user_id=user_id,
    )


# ---------------------------------------------------------------------------
# Farmer approval
# ---------------------------------------------------------------------------

@router.get(
    "/farmers/pending",
    response_model=PaginatedPendingFarmersOut,
    status_code=status.HTTP_200_OK,
    summary="List pending farmer approvals",
    description=(
        "Returns a paginated list of farmer profiles that have not yet been approved. "
        "Ordered by registration date (oldest first)."
    ),
)
async def list_pending_farmers(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
    page:         int = Query(1,  ge=1),
    page_size:    int = Query(20, ge=1, le=100),
) -> PaginatedPendingFarmersOut:
    svc = AdminService(db)
    return await svc.list_pending_farmers(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/farmers/{farmer_id}/approve",
    response_model=FarmerApprovalActionOut,
    status_code=status.HTTP_200_OK,
    summary="Approve a farmer profile",
    description=(
        "Marks the farmer as approved, enabling them to list products. "
        "Action is logged to admin_actions table."
    ),
)
async def approve_farmer(
    farmer_id:    int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> FarmerApprovalActionOut:
    svc = AdminService(db)
    return await svc.approve_farmer(
        requesting_user=current_user,
        farmer_id=farmer_id,
    )


@router.put(
    "/farmers/{farmer_id}/reject",
    response_model=FarmerApprovalActionOut,
    status_code=status.HTTP_200_OK,
    summary="Reject / revoke a farmer approval",
    description=(
        "Revokes the farmer's approved status, preventing new product listings. "
        "Action is logged to admin_actions table."
    ),
)
async def reject_farmer(
    farmer_id:    int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> FarmerApprovalActionOut:
    svc = AdminService(db)
    return await svc.reject_farmer(
        requesting_user=current_user,
        farmer_id=farmer_id,
    )


# ---------------------------------------------------------------------------
# Platform monitoring — orders
# ---------------------------------------------------------------------------

@router.get(
    "/orders",
    response_model=PaginatedOrdersAdminOut,
    status_code=status.HTTP_200_OK,
    summary="List all orders (admin)",
    description=(
        "Paginated view of all orders on the platform. "
        "Filter by `status`: pending|accepted|rejected|cancelled|completed."
    ),
)
async def list_orders(
    current_user:  Annotated[User, Depends(require_roles(UserRole.admin))],
    db:            Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status"),
    page:          int        = Query(1,    ge=1),
    page_size:     int        = Query(20,   ge=1, le=100),
) -> PaginatedOrdersAdminOut:
    svc = AdminService(db)
    return await svc.list_orders(
        requesting_user=current_user,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
    )


# ---------------------------------------------------------------------------
# Platform monitoring — payments
# ---------------------------------------------------------------------------

@router.get(
    "/payments",
    response_model=PaginatedPaymentsAdminOut,
    status_code=status.HTTP_200_OK,
    summary="List all payments (admin)",
    description=(
        "Paginated view of all payment records on the platform. "
        "Filter by `status`: created|paid|failed|refunded."
    ),
)
async def list_payments(
    current_user:  Annotated[User, Depends(require_roles(UserRole.admin))],
    db:            Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status"),
    page:          int        = Query(1,    ge=1),
    page_size:     int        = Query(20,   ge=1, le=100),
) -> PaginatedPaymentsAdminOut:
    svc = AdminService(db)
    return await svc.list_payments(
        requesting_user=current_user,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
    )


# ---------------------------------------------------------------------------
# Disputes (admin view + resolution)
# ---------------------------------------------------------------------------

@router.get(
    "/disputes",
    response_model=PaginatedDisputesOut,
    status_code=status.HTTP_200_OK,
    summary="List all disputes (admin)",
    description=(
        "Paginated view of all disputes. "
        "Filter by `status`: open|in_review|resolved|rejected."
    ),
)
async def list_all_disputes(
    current_user:  Annotated[User, Depends(require_roles(UserRole.admin))],
    db:            Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status"),
    page:          int        = Query(1,    ge=1),
    page_size:     int        = Query(20,   ge=1, le=100),
) -> PaginatedDisputesOut:
    svc = DisputeService(db)
    return await svc.list_all_disputes(
        requesting_user=current_user,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/disputes/{dispute_id}",
    response_model=DisputeResolveOut,
    status_code=status.HTTP_200_OK,
    summary="Resolve or reject a dispute",
    description=(
        "Admin sets the dispute to 'resolved' or 'rejected' with a mandatory resolution note. "
        "If `trigger_refund=true` and status='resolved', a full refund is issued via Razorpay. "
        "Action is logged to admin_actions table."
    ),
)
async def resolve_dispute(
    dispute_id:   int,
    body:         ResolveDisputeRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> DisputeResolveOut:
    svc = DisputeService(db)
    return await svc.resolve_dispute(
        dispute_id=dispute_id,
        new_status=body.new_status,
        resolution_note=body.resolution_note,
        trigger_refund=body.trigger_refund,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# Platform stats (admin dashboard)
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=AdminStatsOut,
    status_code=status.HTTP_200_OK,
    summary="Get platform statistics",
    description=(
        "Returns aggregate counts for users, farmers, products, orders, payments, "
        "disputes, pending farmer approvals, and open disputes. Admin only."
    ),
)
async def get_stats(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> AdminStatsOut:
    svc = AdminService(db)
    return await svc.get_stats(requesting_user=current_user)


# ---------------------------------------------------------------------------
# Products (admin monitoring + moderation)
# ---------------------------------------------------------------------------

@router.get(
    "/products",
    response_model=PaginatedProductsAdminOut,
    status_code=status.HTTP_200_OK,
    summary="List all products (admin)",
    description=(
        "Paginated view of all products on the platform (active and inactive). "
        "Admin only."
    ),
)
async def list_products(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
    page:         int = Query(1,  ge=1),
    page_size:    int = Query(30, ge=1, le=100),
) -> PaginatedProductsAdminOut:
    svc = AdminService(db)
    return await svc.list_products(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/products/{product_id}/deactivate",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Deactivate a product (admin)",
    description=(
        "Admin soft-deactivates a product (sets is_active=False). "
        "The product remains in the database but is hidden from listings. "
        "Action is logged to admin_actions."
    ),
)
async def deactivate_product(
    product_id:   int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    svc = AdminService(db)
    return await svc.deactivate_product(
        requesting_user=current_user,
        product_id=product_id,
    )


@router.get(
    "/deliveries",
    response_model=PaginatedDeliveriesAdminOut,
    status_code=status.HTTP_200_OK,
    summary="List all deliveries (admin)",
    description="Paginated view of all delivery records on the platform. Admin only.",
)
async def list_deliveries(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
    page:         int = Query(1,  ge=1),
    page_size:    int = Query(20, ge=1, le=100),
) -> PaginatedDeliveriesAdminOut:
    svc = AdminService(db)
    return await svc.list_deliveries(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )

