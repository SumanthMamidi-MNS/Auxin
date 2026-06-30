"""
app/services/admin_service.py
================================
Business logic for Admin Control + Farmer Approval + Platform Monitoring.

Responsibilities:
  1. list_users          – Paginated user listing with role filter (admin only)
  2. suspend_user        – Suspend a user account; logs action
  3. reinstate_user      – Reinstate a suspended user; logs action
  4. list_pending_farmers– Farmers awaiting approval (admin only)
  5. approve_farmer      – Approve farmer + log action (extends farmer_service logic
                           with audit trail; does NOT duplicate FarmerService.approve)
  6. reject_farmer       – Reject (revoke) farmer + log action
  7. list_orders         – Paginated all-orders view (admin only)
  8. list_payments       – Paginated all-payments view (admin only)

RBAC: Every public method verifies requesting_user.role == admin.
"""

import math

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    FarmerNotFoundError,
    PermissionDeniedError,
    UserAlreadySuspendedError,
    UserInactiveError,
    UserNotFoundError,
    UserNotSuspendedError,
)
from app.models.admin import AdminActionType
from app.models.user import User, UserRole, UserStatus
from app.repositories.admin_repository import AdminRepository
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin import (
    FarmerApprovalActionOut,
    OrderAdminOut,
    PaginatedOrdersAdminOut,
    PaginatedPaymentsAdminOut,
    PaginatedPendingFarmersOut,
    PaginatedUsersOut,
    PaymentAdminOut,
    PendingFarmerOut,
    SuspendUserOut,
    UserAdminOut,
)


def _user_to_out(user: User) -> UserAdminOut:
    return UserAdminOut(
        id=user.id,
        name=user.name,
        phone=user.phone,
        email=user.email,
        role=user.role,
        status=user.status,
        created_at=user.created_at.isoformat(),
    )


def _farmer_to_pending_out(farmer) -> PendingFarmerOut:
    return PendingFarmerOut(
        id=farmer.id,
        user_id=farmer.user_id,
        full_name=farmer.full_name,
        phone=farmer.phone,
        location=farmer.location,
        ifsc_code=farmer.ifsc_code,
        is_approved=farmer.is_approved,
        created_at=farmer.created_at.isoformat(),
    )


def _order_to_out(order) -> OrderAdminOut:
    return OrderAdminOut(
        id=order.id,
        customer_id=order.customer_id,
        farmer_id=order.farmer_id,
        total_amount=float(order.total_amount),
        status=order.status,
        created_at=order.created_at.isoformat(),
        updated_at=order.updated_at.isoformat(),
    )


def _payment_to_out(payment) -> PaymentAdminOut:
    return PaymentAdminOut(
        id=payment.id,
        order_id=payment.order_id,
        razorpay_order_id=payment.razorpay_order_id,
        razorpay_payment_id=payment.razorpay_payment_id,
        amount=float(payment.amount),
        currency=payment.currency,
        status=payment.status,
        created_at=payment.created_at.isoformat(),
        updated_at=payment.updated_at.isoformat(),
    )


class AdminService:
    def __init__(self, db: AsyncSession) -> None:
        self._db           = db
        self._admin_repo   = AdminRepository(db)
        self._farmer_repo  = FarmerRepository(db)
        self._user_repo    = UserRepository(db)

    def _require_admin(self, user: User) -> None:
        if user.role != UserRole.admin:
            raise PermissionDeniedError("Only admins can perform this action.")

    # ------------------------------------------------------------------
    # 1. List users
    # ------------------------------------------------------------------

    async def list_users(
        self,
        *,
        requesting_user: User,
        role_filter: str | None = None,
        page:        int = 1,
        page_size:   int = 20,
    ) -> PaginatedUsersOut:
        self._require_admin(requesting_user)

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        role = None
        if role_filter is not None:
            try:
                role = UserRole(role_filter)
            except ValueError:
                pass  # unknown role filter → ignored, return all

        users = await self._admin_repo.list_users(
            role=role, offset=offset, limit=page_size
        )
        total       = await self._admin_repo.count_users(role=role)
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedUsersOut(
            items=[_user_to_out(u) for u in users],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 2. Suspend user
    # ------------------------------------------------------------------

    async def suspend_user(
        self,
        *,
        requesting_user: User,
        target_user_id:  int,
        reason:          str,
    ) -> SuspendUserOut:
        self._require_admin(requesting_user)

        user = await self._admin_repo.get_user_by_id(target_user_id)
        if user is None:
            raise UserNotFoundError()
        if user.role == UserRole.admin:
            raise PermissionDeniedError("Admins cannot suspend other admin accounts.")
        if user.status == UserStatus.suspended:
            raise UserAlreadySuspendedError()

        await self._admin_repo.suspend_user(user)
        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.suspend_user,
            target_user_id=target_user_id,
            metadata={"reason": reason},
        )

        return SuspendUserOut(
            user_id=user.id,
            status=UserStatus.suspended,
            message=f"User #{target_user_id} has been suspended.",
        )

    # ------------------------------------------------------------------
    # 3. Reinstate user
    # ------------------------------------------------------------------

    async def reinstate_user(
        self,
        *,
        requesting_user: User,
        target_user_id:  int,
    ) -> SuspendUserOut:
        self._require_admin(requesting_user)

        user = await self._admin_repo.get_user_by_id(target_user_id)
        if user is None:
            raise UserNotFoundError()
        if user.status != UserStatus.suspended:
            raise UserNotSuspendedError()

        await self._admin_repo.reinstate_user(user)
        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.reinstate_user,
            target_user_id=target_user_id,
            metadata={"note": "Account reinstated by admin."},
        )

        return SuspendUserOut(
            user_id=user.id,
            status=UserStatus.approved,
            message=f"User #{target_user_id} has been reinstated.",
        )

    # ------------------------------------------------------------------
    # 4. List pending farmers
    # ------------------------------------------------------------------

    async def list_pending_farmers(
        self,
        *,
        requesting_user: User,
        page:            int = 1,
        page_size:       int = 20,
    ) -> PaginatedPendingFarmersOut:
        self._require_admin(requesting_user)

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        farmers = await self._admin_repo.list_pending_farmers(
            offset=offset, limit=page_size
        )
        total       = await self._admin_repo.count_pending_farmers()
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedPendingFarmersOut(
            items=[_farmer_to_pending_out(f) for f in farmers],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 5. Approve farmer
    # ------------------------------------------------------------------

    async def approve_farmer(
        self,
        *,
        requesting_user: User,
        farmer_id:       int,
    ) -> FarmerApprovalActionOut:
        self._require_admin(requesting_user)

        farmer = await self._farmer_repo.get_by_id(farmer_id)
        if farmer is None:
            raise FarmerNotFoundError()

        farmer = await self._farmer_repo.approve(farmer)

        # Also approve the farmer's User account so they can access the platform
        farmer_user = await self._user_repo.get_by_id(farmer.user_id)
        if farmer_user is not None:
            await self._admin_repo.approve_user_status(farmer_user)

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.approve_farmer,
            target_user_id=farmer.user_id,
            metadata={"farmer_id": farmer_id},
        )

        return FarmerApprovalActionOut(
            farmer_id=farmer.id,
            user_id=farmer.user_id,
            full_name=farmer.full_name,
            is_approved=farmer.is_approved,
            action="approved",
            message=f"Farmer #{farmer_id} ({farmer.full_name}) has been approved.",
        )

    # ------------------------------------------------------------------
    # 6. Reject / revoke farmer
    # ------------------------------------------------------------------

    async def reject_farmer(
        self,
        *,
        requesting_user: User,
        farmer_id:       int,
    ) -> FarmerApprovalActionOut:
        self._require_admin(requesting_user)

        farmer = await self._farmer_repo.get_by_id(farmer_id)
        if farmer is None:
            raise FarmerNotFoundError()

        farmer = await self._farmer_repo.revoke_approval(farmer)

        # Also reject the farmer's User account to block login
        farmer_user = await self._user_repo.get_by_id(farmer.user_id)
        if farmer_user is not None:
            await self._admin_repo.reject_user_status(farmer_user)

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.reject_farmer,
            target_user_id=farmer.user_id,
            metadata={"farmer_id": farmer_id},
        )

        return FarmerApprovalActionOut(
            farmer_id=farmer.id,
            user_id=farmer.user_id,
            full_name=farmer.full_name,
            is_approved=farmer.is_approved,
            action="rejected",
            message=f"Farmer #{farmer_id} ({farmer.full_name}) approval has been rejected.",
        )

    # ------------------------------------------------------------------
    # 7. List all orders (admin monitoring)
    # ------------------------------------------------------------------

    async def list_orders(
        self,
        *,
        requesting_user: User,
        status_filter:   str | None = None,
        page:            int = 1,
        page_size:       int = 20,
    ) -> PaginatedOrdersAdminOut:
        self._require_admin(requesting_user)

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        orders = await self._admin_repo.list_orders(
            status_filter=status_filter, offset=offset, limit=page_size
        )
        total       = await self._admin_repo.count_orders(status_filter=status_filter)
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedOrdersAdminOut(
            items=[_order_to_out(o) for o in orders],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 8. List all payments (admin monitoring)
    # ------------------------------------------------------------------

    async def list_payments(
        self,
        *,
        requesting_user: User,
        status_filter:   str | None = None,
        page:            int = 1,
        page_size:       int = 20,
    ) -> PaginatedPaymentsAdminOut:
        self._require_admin(requesting_user)

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        payments = await self._admin_repo.list_payments(
            status_filter=status_filter, offset=offset, limit=page_size
        )
        total       = await self._admin_repo.count_payments(status_filter=status_filter)
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedPaymentsAdminOut(
            items=[_payment_to_out(p) for p in payments],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 9. List all products (admin monitoring)
    # ------------------------------------------------------------------

    async def list_products(
        self,
        *,
        requesting_user: User,
        page:            int = 1,
        page_size:       int = 30,
    ):
        from app.schemas.admin import PaginatedProductsAdminOut, ProductAdminOut
        import math as _math
        self._require_admin(requesting_user)

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        products    = await self._admin_repo.list_products(offset=offset, limit=page_size)
        total       = await self._admin_repo.count_products()
        total_pages = _math.ceil(total / page_size) if total else 0

        return PaginatedProductsAdminOut(
            items=[
                ProductAdminOut(
                    id=p.id,
                    farmer_id=p.farmer_id,
                    name=p.name,
                    description=p.description,
                    price=float(p.price),
                    quantity=p.quantity,
                    unit=p.unit,
                    harvest_date=p.harvest_date.isoformat() if hasattr(p.harvest_date, "isoformat") else str(p.harvest_date),
                    image_url=p.image_url or "",
                    is_active=p.is_active,
                    created_at=p.created_at.isoformat(),
                    updated_at=p.updated_at.isoformat(),
                )
                for p in products
            ],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 10. Deactivate a product (admin action)
    # ------------------------------------------------------------------

    async def deactivate_product(
        self,
        *,
        requesting_user: User,
        product_id:      int,
    ) -> dict:
        from app.core.exceptions import ProductNotFoundError
        self._require_admin(requesting_user)
        found = await self._admin_repo.deactivate_product(product_id)
        if not found:
            raise ProductNotFoundError(f"Product #{product_id} not found.")
        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type="deactivate_product",  # type: ignore[arg-type]
            metadata={"product_id": product_id},
        )
        return {"success": True, "message": f"Product #{product_id} has been deactivated."}

    # ------------------------------------------------------------------
    # 11. Platform stats
    # ------------------------------------------------------------------

    async def get_stats(self, *, requesting_user: User):
        from app.schemas.admin import AdminStatsOut
        self._require_admin(requesting_user)
        data = await self._admin_repo.get_platform_stats()
        return AdminStatsOut(**data)

    # ------------------------------------------------------------------
    # 12. List all deliveries (admin monitoring)
    # ------------------------------------------------------------------

    async def list_deliveries(
        self,
        *,
        requesting_user: User,
        page:            int = 1,
        page_size:       int = 20,
    ):
        from app.schemas.admin import PaginatedDeliveriesAdminOut, DeliveryAdminOut
        import math as _math
        self._require_admin(requesting_user)

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        deliveries = await self._admin_repo.list_deliveries(offset=offset, limit=page_size)
        total       = await self._admin_repo.count_deliveries()
        total_pages = _math.ceil(total / page_size) if total else 0

        items = []
        for d in deliveries:
            items.append(
                DeliveryAdminOut(
                    id=d.id,
                    order_id=d.order_id,
                    partner_id=d.delivery_partner_id,
                    status=d.status,
                    estimated_delivery=d.assigned_at.isoformat() if d.assigned_at else None,
                    actual_delivery=d.delivered_at.isoformat() if d.delivered_at else None,
                    created_at=d.created_at.isoformat(),
                )
            )

        return PaginatedDeliveriesAdminOut(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


