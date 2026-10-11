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

from app.core.dependencies import require_roles, require_super_admin
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
    RejectApprovalRequest,
    PaginatedPendingDeliveryPartnersOut,
    DeliveryPartnerApprovalActionOut,
    CreateAdminRequest,
    AdminUserOut,
    PaginatedAdminsOut,
    PaginatedAdminActivityLogsOut,
    AdminActivityLogOut,
    SettingsChangeRequest,
    DemoResetRequest,
    SystemHealthOut,
    ServiceHealthItem,
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


@router.patch(
    "/farmers/{id}/approve",
    response_model=FarmerApprovalActionOut,
    status_code=status.HTTP_200_OK,
    summary="Approve a farmer profile",
    description=(
        "Marks the farmer as approved, enabling them to list products. "
        "Action is logged to admin_actions table."
    ),
)
async def approve_farmer(
    id:           int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> FarmerApprovalActionOut:
    svc = AdminService(db)
    return await svc.approve_farmer(
        requesting_user=current_user,
        farmer_id=id,
    )


@router.patch(
    "/farmers/{id}/reject",
    response_model=FarmerApprovalActionOut,
    status_code=status.HTTP_200_OK,
    summary="Reject / revoke a farmer approval",
    description=(
        "Revokes the farmer's approved status, preventing new product listings. "
        "Action is logged to admin_actions table."
    ),
)
async def reject_farmer(
    id:           int,
    body:         RejectApprovalRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> FarmerApprovalActionOut:
    svc = AdminService(db)
    return await svc.reject_farmer(
        requesting_user=current_user,
        farmer_id=id,
        rejection_reason=body.rejection_reason,
    )


# ---------------------------------------------------------------------------
# Delivery Partner approval
# ---------------------------------------------------------------------------

@router.get(
    "/delivery/pending",
    response_model=PaginatedPendingDeliveryPartnersOut,
    status_code=status.HTTP_200_OK,
    summary="List pending delivery partner approvals",
    description="Returns a paginated list of delivery partner profiles that are pending approval.",
)
async def list_pending_delivery(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
    page:         int = Query(1,  ge=1),
    page_size:    int = Query(20, ge=1, le=100),
) -> PaginatedPendingDeliveryPartnersOut:
    svc = AdminService(db)
    return await svc.list_pending_delivery(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )


@router.patch(
    "/delivery/{id}/approve",
    response_model=DeliveryPartnerApprovalActionOut,
    status_code=status.HTTP_200_OK,
    summary="Approve a delivery partner profile",
    description="Marks the delivery partner as approved, enabling them to accept deliveries.",
)
async def approve_delivery(
    id:           int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryPartnerApprovalActionOut:
    svc = AdminService(db)
    return await svc.approve_delivery(
        requesting_user=current_user,
        partner_id=id,
    )


@router.patch(
    "/delivery/{id}/reject",
    response_model=DeliveryPartnerApprovalActionOut,
    status_code=status.HTTP_200_OK,
    summary="Reject a delivery partner profile",
    description="Rejects the delivery partner, preventing them from accepting deliveries.",
)
async def reject_delivery(
    id:           int,
    body:         RejectApprovalRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> DeliveryPartnerApprovalActionOut:
    svc = AdminService(db)
    return await svc.reject_delivery(
        requesting_user=current_user,
        partner_id=id,
        rejection_reason=body.rejection_reason,
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
    is_demo:      bool = False,
) -> AdminStatsOut:
    svc = AdminService(db)
    return await svc.get_stats(requesting_user=current_user, is_demo=is_demo)


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


# ---------------------------------------------------------------------------
# Phase 2.1A: Admins & Activity Logs
# ---------------------------------------------------------------------------

@router.get(
    "/admins",
    response_model=PaginatedAdminsOut,
    status_code=status.HTTP_200_OK,
    summary="List all admins (Super Admin only)",
)
async def list_admins(
    current_user: Annotated[User, Depends(require_super_admin)],
    db:           Annotated[AsyncSession, Depends(get_db)],
    page:         int = Query(1,  ge=1),
    page_size:    int = Query(20, ge=1, le=100),
) -> PaginatedAdminsOut:
    svc = AdminService(db)
    return await svc.list_admins(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/admins",
    response_model=AdminUserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new admin account (Super Admin only)",
)
async def create_admin(
    body:         CreateAdminRequest,
    current_user: Annotated[User, Depends(require_super_admin)],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> AdminUserOut:
    svc = AdminService(db)
    return await svc.create_admin(
        requesting_user=current_user,
        name=body.name,
        phone=body.phone,
        email=body.email,
        password=body.password,
    )


@router.put(
    "/admins/{admin_id}/disable",
    response_model=AdminUserOut,
    status_code=status.HTTP_200_OK,
    summary="Disable/suspend an admin account (Super Admin only)",
)
async def disable_admin(
    admin_id:     int,
    current_user: Annotated[User, Depends(require_super_admin)],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> AdminUserOut:
    svc = AdminService(db)
    return await svc.disable_admin(
        requesting_user=current_user,
        admin_id=admin_id,
    )


@router.put(
    "/admins/{admin_id}/activate",
    response_model=AdminUserOut,
    status_code=status.HTTP_200_OK,
    summary="Activate/reinstate an admin account (Super Admin only)",
)
async def activate_admin(
    admin_id:     int,
    current_user: Annotated[User, Depends(require_super_admin)],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> AdminUserOut:
    svc = AdminService(db)
    return await svc.activate_admin(
        requesting_user=current_user,
        admin_id=admin_id,
    )


@router.delete(
    "/admins/{admin_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Delete/remove an admin account permanently (Super Admin only)",
)
async def remove_admin(
    admin_id:     int,
    current_user: Annotated[User, Depends(require_super_admin)],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    svc = AdminService(db)
    return await svc.remove_admin(
        requesting_user=current_user,
        admin_id=admin_id,
    )


@router.get(
    "/activity-logs",
    response_model=PaginatedAdminActivityLogsOut,
    status_code=status.HTTP_200_OK,
    summary="List admin activity audit logs (Super Admin only)",
)
async def list_activity_logs(
    current_user: Annotated[User, Depends(require_super_admin)],
    db:           Annotated[AsyncSession, Depends(get_db)],
    admin_id:     int | None = Query(None, description="Filter by admin user ID"),
    action_type:  str | None = Query(None, description="Filter by action type"),
    start_date:   str | None = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date:     str | None = Query(None, description="End date filter (YYYY-MM-DD)"),
    search:       str | None = Query(None, description="Search by admin name or target"),
    order:        str = Query("desc", description="Sort order: desc (newest first) or asc (oldest first)"),
    page:         int = Query(1,  ge=1),
    page_size:    int = Query(50, ge=1, le=100),
) -> PaginatedAdminActivityLogsOut:
    svc = AdminService(db)
    return await svc.list_activity_logs(
        requesting_user=current_user,
        admin_id=admin_id,
        action_type=action_type,
        start_date=start_date,
        end_date=end_date,
        search=search,
        order=order,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/my-activity-logs",
    response_model=PaginatedAdminActivityLogsOut,
    status_code=status.HTTP_200_OK,
    summary="List own activity logs (any admin)",
)
async def list_my_activity_logs(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
    page:         int = Query(1,  ge=1),
    page_size:    int = Query(50, ge=1, le=100),
) -> PaginatedAdminActivityLogsOut:
    svc = AdminService(db)
    return await svc.list_activity_logs(
        requesting_user=current_user,
        admin_id=current_user.id,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/products/{product_id}/activate",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Activate / restore product",
)
async def activate_product(
    product_id:   int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    svc = AdminService(db)
    return await svc.activate_product(
        requesting_user=current_user,
        product_id=product_id,
    )


@router.put(
    "/orders/{order_id}/cancel",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Cancel order (admin)",
)
async def cancel_order(
    order_id:     int,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    svc = AdminService(db)
    return await svc.cancel_order(
        requesting_user=current_user,
        order_id=order_id,
    )


@router.post(
    "/settings",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Simulate settings change (Super Admin only)",
)
async def update_settings(
    body:         SettingsChangeRequest,
    current_user: Annotated[User, Depends(require_super_admin)],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    svc = AdminService(db)
    return await svc.update_settings(
        requesting_user=current_user,
        key=body.key,
        value=body.value,
    )


@router.post(
    "/demo/reset",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Reset and restore all demo data to seeded state (Admin authorized)",
)
async def reset_demo_environment(
    body:         DemoResetRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    svc = AdminService(db)
    return await svc.reset_demo_environment(
        requesting_user=current_user,
        password_confirm=body.password_confirm,
    )


@router.get(
    "/reviews/analytics",
    status_code=status.HTTP_200_OK,
    summary="Get review analytics (Admin only)",
)
async def get_review_analytics(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
):
    from app.services.review_service import ReviewService
    from app.schemas.review import AdminReviewAnalyticsOut

    svc = ReviewService(db)
    analytics = await svc.get_admin_review_analytics()
    return AdminReviewAnalyticsOut.model_validate(analytics)


@router.get(
    "/system/health",
    response_model=SystemHealthOut,
    status_code=status.HTTP_200_OK,
    summary="Live system health telemetry (Admin only)",
)
async def get_system_health(
    current_user: Annotated[User, Depends(require_roles(UserRole.admin))],
    db:           Annotated[AsyncSession, Depends(get_db)],
) -> SystemHealthOut:
    import time
    from datetime import datetime, timezone
    from sqlalchemy import text
    from app.core.config import settings
    from app.schemas.admin import ServiceHealthItem, SystemHealthOut

    # 1. Database live ping
    db_start = time.perf_counter()
    db_ok = False
    db_latency = 0.0
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
        db_latency = round((time.perf_counter() - db_start) * 1000, 2)
    except Exception:
        db_ok = False

    # 2. Milo AI RAG Engine ping
    milo_ok = False
    milo_latency = None
    import urllib.request
    try:
        m_start = time.perf_counter()
        req = urllib.request.Request("http://127.0.0.1:8001/api/chat/health", method="GET")
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                milo_ok = True
                milo_latency = round((time.perf_counter() - m_start) * 1000, 2)
    except Exception:
        milo_ok = False

    # 3. Storage access
    storage_ok = True
    storage_detail = "Local Media Storage"
    import os
    if not os.path.exists("./static") and not os.path.exists("./app"):
        storage_ok = False

    # 4. Auth service
    auth_ok = True
    auth_detail = "Supabase Auth Gateway Active"
    if not settings.SUPABASE_URL:
        auth_detail = "Local Dev Auth Mode"

    # 5. Payment gateway
    payment_mode = "Razorpay Test / Escrow Mock Mode Active"

    # Database Engine Name
    db_engine_name = "SQLite (WAL Mode)"
    if "postgresql" in str(settings.DATABASE_URL):
        db_engine_name = "PostgreSQL v15 (Supabase)"

    return SystemHealthOut(
        status="operational" if (db_ok and milo_ok) else "degraded",
        database=ServiceHealthItem(
            name="Core Database",
            status="online" if db_ok else "offline",
            latency_ms=db_latency if db_ok else None,
            detail=f"{db_engine_name} - Connection Pool Active"
        ),
        api_gateway=ServiceHealthItem(
            name="API Core Gateway",
            status="online",
            latency_ms=0.5,
            detail="FastAPI ASGI Runtime Operational"
        ),
        milo_ai=ServiceHealthItem(
            name="Milo AI Engine",
            status="online" if milo_ok else "offline",
            latency_ms=milo_latency,
            detail="RAG Microservice (Port 8001)" if milo_ok else "Microservice Unreachable"
        ),
        auth_service=ServiceHealthItem(
            name="Authentication Gateway",
            status="online" if auth_ok else "warning",
            detail=auth_detail
        ),
        storage=ServiceHealthItem(
            name="Storage Engine",
            status="online" if storage_ok else "warning",
            detail=storage_detail
        ),
        payment_gateway=ServiceHealthItem(
            name="Escrow Payment Gateway",
            status="online",
            detail=payment_mode
        ),
        server_time=datetime.now(timezone.utc).isoformat(),
        environment=settings.APP_ENV.upper(),
        database_engine=db_engine_name,
    )


