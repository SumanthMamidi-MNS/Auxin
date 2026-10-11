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
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    FarmerNotFoundError,
    PermissionDeniedError,
    UserAlreadySuspendedError,
    UserInactiveError,
    UserNotFoundError,
    UserNotSuspendedError,
    UserInvalidStatusTransitionError,
    DeliveryPartnerNotFoundError,
)
from app.models.admin import AdminActionType
from app.models.user import User, UserRole, UserStatus
from app.repositories.admin_repository import AdminRepository
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.user_repository import UserRepository
from app.repositories.delivery_partner_repository import DeliveryPartnerRepository
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
    PendingDeliveryPartnerOut,
    PaginatedPendingDeliveryPartnersOut,
    DeliveryPartnerApprovalActionOut,
    CreateAdminRequest,
    AdminUserOut,
    PaginatedAdminsOut,
    PaginatedAdminActivityLogsOut,
    AdminActivityLogOut,
)


def _delivery_partner_to_pending_out(partner) -> PendingDeliveryPartnerOut:
    user_email = partner.user.email if partner.user else None
    user_status = partner.user.status.value if (partner.user and partner.user.status) else "pending"
    
    masked_acc = None
    if partner.bank_account_number:
        try:
            from app.core.encryption import decrypt_field
            decrypted = decrypt_field(partner.bank_account_number)
            masked_acc = "******" + decrypted[-4:] if len(decrypted) > 4 else "******"
        except Exception:
            masked_acc = "******"

    return PendingDeliveryPartnerOut(
        id=partner.id,
        user_id=partner.user_id,
        full_name=partner.full_name,
        phone=partner.phone,
        is_active=partner.is_active,
        created_at=partner.created_at.isoformat() if hasattr(partner.created_at, "isoformat") else str(partner.created_at),
        email=user_email,
        vehicle_type=partner.vehicle_type,
        vehicle_number=partner.vehicle_number,
        driving_license=partner.driving_license,
        bank_name=partner.bank_name,
        account_holder_name=partner.account_holder_name,
        bank_account_number=masked_acc,
        ifsc_code=partner.ifsc_code,
        upi_id=partner.upi_id,
        status=user_status,
    )


def _user_to_out(user, rating: float | None = None) -> UserAdminOut:
    return UserAdminOut(
        id=user.id,
        name=user.name,
        phone=user.phone,
        email=user.email,
        role=user.role,
        status=user.status,
        created_at=user.created_at.isoformat(),
        rating=rating,
    )


def _farmer_to_pending_out(farmer) -> PendingFarmerOut:
    user_email = farmer.user.email if farmer.user else None
    user_status = farmer.user.status.value if (farmer.user and farmer.user.status) else "pending"
    
    masked_acc = None
    if farmer.bank_account_number:
        try:
            from app.core.encryption import decrypt_field
            decrypted = decrypt_field(farmer.bank_account_number)
            masked_acc = "******" + decrypted[-4:] if len(decrypted) > 4 else "******"
        except Exception:
            masked_acc = "******"

    return PendingFarmerOut(
        id=farmer.id,
        user_id=farmer.user_id,
        full_name=farmer.full_name,
        phone=farmer.phone,
        location=farmer.location,
        ifsc_code=farmer.ifsc_code,
        is_approved=farmer.is_approved,
        created_at=farmer.created_at.isoformat() if hasattr(farmer.created_at, "isoformat") else str(farmer.created_at),
        email=user_email,
        bank_name=farmer.bank_name,
        account_holder_name=farmer.account_holder_name,
        bank_account_number=masked_acc,
        upi_id=farmer.upi_id,
        status=user_status,
    )


def _order_to_out(order) -> OrderAdminOut:
    from app.schemas.order import OrderItemOut
    items_out = []
    for item in (order.items or []):
        p_name = item.product.name if (item.product and hasattr(item.product, "name")) else f"Product #{item.product_id}"
        items_out.append(OrderItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=p_name,
            quantity=item.quantity,
            price_at_order_time=float(item.price_at_order_time),
            subtotal=float(item.subtotal),
        ))
    
    farmer_name = order.farmer.user.name if (order.farmer and order.farmer.user) else f"Farmer #{order.farmer_id}"

    return OrderAdminOut(
        id=order.id,
        customer_id=order.customer_id,
        farmer_id=order.farmer_id,
        farmer_name=farmer_name,
        total_amount=float(order.total_amount),
        status=order.status,
        items=items_out,
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
        self._delivery_partner_repo = DeliveryPartnerRepository(db)

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

        items = []
        from sqlalchemy import func
        from app.models.review import Review
        from app.models.farmer import Farmer
        from app.models.delivery import DeliveryPartner

        for u in users:
            rating = None
            if u.role.value == "farmer":
                res_f = await self._db.execute(select(Farmer).where(Farmer.user_id == u.id))
                farmer_profile = res_f.scalar_one_or_none()
                if farmer_profile:
                    res_r = await self._db.execute(
                        select(func.avg(Review.farmer_rating)).where(Review.farmer_id == farmer_profile.id)
                    )
                    avg_val = res_r.scalar()
                    if avg_val is not None:
                        rating = float(avg_val)
            elif u.role.value == "delivery":
                res_dp = await self._db.execute(select(DeliveryPartner).where(DeliveryPartner.user_id == u.id))
                dp_profile = res_dp.scalar_one_or_none()
                if dp_profile:
                    res_r = await self._db.execute(
                        select(func.avg(Review.delivery_rating))
                        .where(Review.delivery_partner_id == dp_profile.id)
                        .where(Review.delivery_rating.isnot(None))
                    )
                    avg_val = res_r.scalar()
                    if avg_val is not None:
                        rating = float(avg_val)
            items.append(_user_to_out(u, rating=rating))

        return PaginatedUsersOut(
            items=items,
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
        if user.is_super_admin:
            raise PermissionDeniedError("The permanent Super Admin account cannot be suspended.")
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
        if user.role == UserRole.admin:
            raise PermissionDeniedError("Admins cannot reinstate other admin accounts.")
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

        farmer_user = await self._user_repo.get_by_id(farmer.user_id)
        if farmer_user is None:
            raise UserNotFoundError()

        if farmer_user.status not in (UserStatus.pending, UserStatus.approved):
            raise UserInvalidStatusTransitionError()

        farmer = await self._farmer_repo.approve(farmer)

        # Also approve the farmer's User account so they can access the platform
        now = datetime.now(timezone.utc)
        await self._admin_repo.approve_user_status(
            farmer_user,
            approved_by=requesting_user.name or requesting_user.phone,
            approved_at=now
        )

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
        rejection_reason: str,
    ) -> FarmerApprovalActionOut:
        self._require_admin(requesting_user)

        farmer = await self._farmer_repo.get_by_id(farmer_id)
        if farmer is None:
            raise FarmerNotFoundError()

        farmer_user = await self._user_repo.get_by_id(farmer.user_id)
        if farmer_user is None:
            raise UserNotFoundError()

        if farmer_user.status not in (UserStatus.pending, UserStatus.approved):
            raise UserInvalidStatusTransitionError()

        farmer = await self._farmer_repo.revoke_approval(farmer)

        # Also reject the farmer's User account to block login
        now = datetime.now(timezone.utc)
        await self._admin_repo.reject_user_status(
            farmer_user,
            rejected_at=now,
            rejection_reason=rejection_reason
        )

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.reject_farmer,
            target_user_id=farmer.user_id,
            metadata={"farmer_id": farmer_id, "rejection_reason": rejection_reason},
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
    # 6A. Delivery partner approval services
    # ------------------------------------------------------------------

    async def list_pending_delivery(
        self,
        *,
        requesting_user: User,
        page:            int = 1,
        page_size:       int = 20,
    ) -> PaginatedPendingDeliveryPartnersOut:
        self._require_admin(requesting_user)

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        partners = await self._admin_repo.list_pending_delivery(
            offset=offset, limit=page_size
        )
        total       = await self._admin_repo.count_pending_delivery()
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedPendingDeliveryPartnersOut(
            items=[_delivery_partner_to_pending_out(p) for p in partners],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def approve_delivery(
        self,
        *,
        requesting_user: User,
        partner_id:       int,
    ) -> DeliveryPartnerApprovalActionOut:
        self._require_admin(requesting_user)

        partner = await self._delivery_partner_repo.get_by_id(partner_id)
        if partner is None:
            raise DeliveryPartnerNotFoundError()

        partner_user = await self._user_repo.get_by_id(partner.user_id)
        if partner_user is None:
            raise UserNotFoundError()

        if partner_user.status not in (UserStatus.pending, UserStatus.approved):
            raise UserInvalidStatusTransitionError()

        now = datetime.now(timezone.utc)
        await self._admin_repo.approve_user_status(
            partner_user,
            approved_by=requesting_user.name or requesting_user.phone,
            approved_at=now
        )

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.approve_delivery,
            target_user_id=partner.user_id,
            metadata={"partner_id": partner_id},
        )

        return DeliveryPartnerApprovalActionOut(
            partner_id=partner.id,
            user_id=partner.user_id,
            full_name=partner.full_name,
            is_active=partner.is_active,
            action="approved",
            message=f"Delivery Partner #{partner_id} ({partner.full_name}) has been approved.",
        )

    async def reject_delivery(
        self,
        *,
        requesting_user: User,
        partner_id:       int,
        rejection_reason: str,
    ) -> DeliveryPartnerApprovalActionOut:
        self._require_admin(requesting_user)

        partner = await self._delivery_partner_repo.get_by_id(partner_id)
        if partner is None:
            raise DeliveryPartnerNotFoundError()

        partner_user = await self._user_repo.get_by_id(partner.user_id)
        if partner_user is None:
            raise UserNotFoundError()

        if partner_user.status not in (UserStatus.pending, UserStatus.approved):
            raise UserInvalidStatusTransitionError()

        now = datetime.now(timezone.utc)
        await self._admin_repo.reject_user_status(
            partner_user,
            rejected_at=now,
            rejection_reason=rejection_reason
        )

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.reject_delivery,
            target_user_id=partner.user_id,
            metadata={"partner_id": partner_id, "rejection_reason": rejection_reason},
        )

        return DeliveryPartnerApprovalActionOut(
            partner_id=partner.id,
            user_id=partner.user_id,
            full_name=partner.full_name,
            is_active=partner.is_active,
            action="rejected",
            message=f"Delivery Partner #{partner_id} ({partner.full_name}) has been rejected.",
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

    async def get_stats(self, *, requesting_user: User, is_demo: bool = False):
        from app.schemas.admin import AdminStatsOut
        self._require_admin(requesting_user)
        data = await self._admin_repo.get_platform_stats(is_demo=is_demo)
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

    # ------------------------------------------------------------------
    # Phase 2.1A: Super Admin, Admin Management, and Activity Logs
    # ------------------------------------------------------------------

    def _require_super_admin(self, user: User) -> None:
        if user.role != UserRole.admin or not user.is_super_admin:
            raise PermissionDeniedError("Only Super Admins can perform this action.")

    async def list_admins(
        self,
        *,
        requesting_user: User,
        page:            int = 1,
        page_size:       int = 20,
    ) -> PaginatedAdminsOut:
        from app.schemas.admin import PaginatedAdminsOut, AdminUserOut
        self._require_super_admin(requesting_user)

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        admins      = await self._admin_repo.list_admins(offset=offset, limit=page_size)
        total       = await self._admin_repo.count_admins()
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedAdminsOut(
            items=[AdminUserOut.model_validate(a) for a in admins],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def create_admin(
        self,
        *,
        requesting_user: User,
        name:            str,
        phone:           str,
        email:           str,
        password:        str,
    ) -> AdminUserOut:
        from app.schemas.admin import AdminUserOut
        from app.core.config import settings
        import uuid
        import urllib.request
        import json
        self._require_super_admin(requesting_user)

        # Normalise phone
        phone_cleaned = "+" + phone.lstrip("+")
        
        # Check database uniqueness first
        existing_phone = await self._user_repo.get_by_phone(phone_cleaned)
        if existing_phone:
            raise PermissionDeniedError("Phone number is already registered.")
        existing_email = await self._user_repo.get_by_email(email)
        if existing_email:
            raise PermissionDeniedError("Email address is already registered.")

        # Sync/create in Supabase
        supabase_uid = str(uuid.uuid4())
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                req_url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                }
                body = {
                    "email": email,
                    "password": password,
                    "phone": phone_cleaned,
                    "email_confirm": True,
                    "phone_confirm": True,
                    "user_metadata": {
                        "name": name,
                        "role": "admin"
                    }
                }
                req = urllib.request.Request(
                    req_url,
                    headers=headers,
                    data=json.dumps(body).encode("utf-8"),
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    if "id" in resp_data:
                        supabase_uid = resp_data["id"]
            except Exception as e:
                # Log or print warning
                pass

        # Save to database
        user = User(
            name=name,
            phone=phone_cleaned,
            email=email,
            role=UserRole.admin,
            status=UserStatus.approved,
            supabase_uid=supabase_uid,
            is_super_admin=False,
        )
        self._db.add(user)
        await self._db.flush()

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.create_admin,
            target_user_id=user.id,
            metadata={"email": email, "name": name},
        )

        return AdminUserOut.model_validate(user)

    async def disable_admin(
        self,
        *,
        requesting_user: User,
        admin_id:        int,
    ) -> AdminUserOut:
        from app.schemas.admin import AdminUserOut
        from app.core.config import settings
        import urllib.request
        import json
        self._require_super_admin(requesting_user)

        admin = await self._admin_repo.get_user_by_id(admin_id)
        if admin is None or admin.role != UserRole.admin:
            raise UserNotFoundError("Admin not found.")
        if admin.is_super_admin:
            raise PermissionDeniedError("The permanent Super Admin account cannot be disabled.")
        if admin.id == requesting_user.id:
            raise PermissionDeniedError("You cannot disable your own account.")

        admin.status = UserStatus.suspended
        await self._db.flush()

        # Try to ban/suspend in Supabase
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and admin.supabase_uid:
            try:
                req_url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{admin.supabase_uid}"
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                }
                # Ban for 100 years
                body = {"ban_duration": "876000h"}
                req = urllib.request.Request(
                    req_url,
                    headers=headers,
                    data=json.dumps(body).encode("utf-8"),
                    method="PUT"
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    pass
            except Exception:
                pass

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.disable_admin,
            target_user_id=admin.id,
            metadata={"email": admin.email},
        )

        return AdminUserOut.model_validate(admin)

    async def activate_admin(
        self,
        *,
        requesting_user: User,
        admin_id:        int,
    ) -> AdminUserOut:
        from app.schemas.admin import AdminUserOut
        from app.core.config import settings
        import urllib.request
        import json
        self._require_super_admin(requesting_user)

        admin = await self._admin_repo.get_user_by_id(admin_id)
        if admin is None or admin.role != UserRole.admin:
            raise UserNotFoundError("Admin not found.")

        admin.status = UserStatus.approved
        await self._db.flush()

        # Remove ban in Supabase
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and admin.supabase_uid:
            try:
                req_url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{admin.supabase_uid}"
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                }
                # Ban duration 0 removes the ban
                body = {"ban_duration": "none"}
                req = urllib.request.Request(
                    req_url,
                    headers=headers,
                    data=json.dumps(body).encode("utf-8"),
                    method="PUT"
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    pass
            except Exception:
                pass

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.activate_admin,
            target_user_id=admin.id,
            metadata={"email": admin.email},
        )

        return AdminUserOut.model_validate(admin)

    async def remove_admin(
        self,
        *,
        requesting_user: User,
        admin_id:        int,
    ) -> dict:
        from app.core.config import settings
        import urllib.request
        self._require_super_admin(requesting_user)

        admin = await self._admin_repo.get_user_by_id(admin_id)
        if admin is None or admin.role != UserRole.admin:
            raise UserNotFoundError("Admin not found.")
        if admin.id == requesting_user.id:
            raise PermissionDeniedError("You cannot remove your own account.")
        if admin.is_super_admin:
            raise PermissionDeniedError("The permanent Super Admin account cannot be deleted.")

        email = admin.email
        supabase_uid = admin.supabase_uid

        # Delete from DB
        await self._db.delete(admin)
        await self._db.flush()

        # Try to delete from Supabase Auth
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and supabase_uid:
            try:
                req_url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{supabase_uid}"
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                }
                req = urllib.request.Request(
                    req_url,
                    headers=headers,
                    method="DELETE"
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    pass
            except Exception:
                pass

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.remove_admin,
            metadata={"email": email},
        )

        return {"success": True, "message": "Admin user deleted successfully."}

    async def list_activity_logs(
        self,
        *,
        requesting_user: User,
        admin_id:        int | None = None,
        action_type:     str | None = None,
        start_date:      str | None = None,
        end_date:        str | None = None,
        search:          str | None = None,
        order:           str = "desc",
        page:            int = 1,
        page_size:       int = 50,
    ) -> PaginatedAdminActivityLogsOut:
        from app.schemas.admin import PaginatedAdminActivityLogsOut, AdminActivityLogOut
        from datetime import datetime, timezone
        
        # Enforce security constraints
        if not requesting_user.is_super_admin:
            if admin_id is not None and admin_id != requesting_user.id:
                raise PermissionDeniedError("Only Super Admins can view other admins' activity.")
            admin_id = requesting_user.id

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        # Parse date filters
        start_dt = None
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                pass
                
        end_dt = None
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc)
            except ValueError:
                pass

        logs = await self._admin_repo.list_activity_logs(
            offset=offset,
            limit=page_size,
            admin_user_id=admin_id,
            action_type=action_type,
            start_date=start_dt,
            end_date=end_dt,
            search=search,
            order=order,
        )
        total = await self._admin_repo.count_activity_logs(
            admin_user_id=admin_id,
            action_type=action_type,
            start_date=start_dt,
            end_date=end_dt,
            search=search,
        )
        total_pages = math.ceil(total / page_size) if total else 0

        items = []
        for l in logs:
            admin_name = l.admin_user.name if l.admin_user else f"User #{l.admin_user_id}"
            admin_email = l.admin_user.email if l.admin_user else ""
            
            action_type_val = l.action_type.value
            if l.action_metadata and l.action_metadata.get("action") == "settings_change":
                action_type_val = "settings_changed"

            target_type = "Platform"
            if "settings" in action_type_val:
                target_type = "Platform"
            elif "farmer" in action_type_val:
                target_type = "Farmer"
            elif "delivery" in action_type_val:
                target_type = "Delivery Partner"
            elif "product" in action_type_val:
                target_type = "Product"
            elif "dispute" in action_type_val:
                target_type = "Dispute"
            elif "admin" in action_type_val:
                target_type = "Admin"
            elif "user" in action_type_val:
                target_type = "User"
            elif "order" in action_type_val:
                target_type = "Order"

            target_name = l.target_user.name if l.target_user else ""
            if not target_name and l.target_user_id:
                target_name = f"User #{l.target_user_id}"
            elif not target_name:
                target_name = (
                    l.action_metadata.get("name")
                    or l.action_metadata.get("email")
                    or l.action_metadata.get("phone")
                    or (f"Product #{l.action_metadata.get('product_id')}" if l.action_metadata.get("product_id") else "")
                    or (f"Order #{l.action_metadata.get('order_id')}" if l.action_metadata.get("order_id") else "")
                    or (f"Dispute #{l.action_metadata.get('dispute_id')}" if l.action_metadata.get("dispute_id") else "")
                    or "Platform"
                )

            remarks = (
                l.action_metadata.get("reason")
                or l.action_metadata.get("notes")
                or l.action_metadata.get("resolution_note")
                or l.action_metadata.get("rejection_reason")
                or l.action_metadata.get("note")
            )

            items.append(
                AdminActivityLogOut(
                    id=l.id,
                    timestamp=l.created_at.isoformat(),
                    admin_name=admin_name,
                    admin_email=admin_email,
                    action=action_type_val,
                    action_type=action_type_val,
                    target=target_name,
                    target_type=target_type,
                    target_name=target_name,
                    target_id=l.target_user_id,
                    status=l.action_metadata.get("status", "success") or "success",
                    remarks=remarks,
                    metadata=l.action_metadata,
                )
            )

        return PaginatedAdminActivityLogsOut(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def activate_product(
        self,
        *,
        requesting_user: User,
        product_id:      int,
    ) -> dict:
        self._require_admin(requesting_user)

        from app.core.exceptions import ProductNotFoundError
        found = await self._admin_repo.activate_product(product_id)
        if not found:
            raise ProductNotFoundError(f"Product #{product_id} not found.")

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.update_product,
            target_user_id=None,
            metadata={"product_id": product_id, "action": "activate_product"},
        )
        return {"success": True, "message": f"Product #{product_id} has been activated."}

    async def cancel_order(
        self,
        *,
        requesting_user: User,
        order_id:        int,
    ) -> dict:
        self._require_admin(requesting_user)
        from app.core.exceptions import OrderNotFoundError
        from app.models.order import Order, OrderStatus
        
        result = await self._db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if order is None:
            raise OrderNotFoundError()
            
        order.status = OrderStatus.cancelled
        self._db.add(order)
        await self._db.flush()

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.order_cancelled,
            target_user_id=order.customer_id,
            metadata={"order_id": order_id, "action": "admin_cancel_order"},
        )
        return {"success": True, "message": f"Order #{order_id} has been cancelled."}

    async def update_settings(
        self,
        *,
        requesting_user: User,
        key:             str,
        value:           str,
    ) -> dict:
        self._require_admin(requesting_user)
        if not requesting_user.is_super_admin:
            raise PermissionDeniedError("Only Super Admins can update system settings.")

        # Simulate settings change in DB audit logs using order_status_updated + metadata action
        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.order_status_updated,
            target_user_id=None,
            metadata={"action": "settings_change", "key": key, "value": value},
        )
        return {"success": True, "message": f"Setting {key} updated successfully."}

    async def reset_demo_environment(
        self,
        *,
        requesting_user: User,
        password_confirm: str | None = None,
    ) -> dict:
        self._require_admin(requesting_user)

        from app.core.config import settings
        import hmac
        import urllib.request
        import json
        from sqlalchemy import text, select
        from datetime import date
        from decimal import Decimal
        from app.models.farmer import Farmer
        from app.models.delivery import DeliveryPartner
        from app.models.product import Product
        from app.models.address import Address
        from app.core.encryption import encrypt_field

        # Safety gates: the reset deletes data, so it is refused against a real
        # production database and always requires password confirmation.
        if settings.APP_ENV.lower() == "production" and not settings.DEMO_MODE:
            raise PermissionDeniedError(
                "Demo reset is disabled on a production database. Enable DEMO_MODE with a sandbox database."
            )
        if not password_confirm:
            raise PermissionDeniedError("Password confirmation is required to reset demo data.")

        # Verify password via Supabase
        password_ok = False
        if password_confirm:
            if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Content-Type": "application/json"
                }
                body = {
                    "email": requesting_user.email,
                    "password": password_confirm
                }
                try:
                    url = f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password"
                    req = urllib.request.Request(url, headers=headers, data=json.dumps(body).encode("utf-8"), method="POST")
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                        if "access_token" in data:
                            password_ok = True
                except Exception:
                    pass

            # Fallback if offline or not configured (only when a bootstrap
            # password is actually set; compare in constant time).
            if (
                not password_ok
                and settings.SUPER_ADMIN_PASSWORD
                and hmac.compare_digest(password_confirm, settings.SUPER_ADMIN_PASSWORD)
            ):
                password_ok = True

            if not password_ok:
                raise PermissionDeniedError("Incorrect password confirmation.")

        # Clean/Get demo accounts
        from app.repositories.user_repository import UserRepository
        from app.models.user import UserStatus
        from app.models.farmer import Farmer
        from app.models.delivery import DeliveryPartner, Delivery, DeliveryStatus
        from app.models.product import Product
        from app.models.address import Address
        from app.models.order import Order, OrderItem, OrderStatus
        from app.models.payment import Payment, Transaction, PaymentStatus, TransactionType, TransactionStatus
        from app.models.review import Review
        from app.core.encryption import encrypt_field
        
        repo = UserRepository(self._db)
        customer = await repo.get_by_email("demo.customer@auxin.app")
        farmer_user = await repo.get_by_email("demo.farmer@auxin.app")
        delivery_user = await repo.get_by_email("demo.delivery@auxin.app")

        # Selective wiping of transactional data where is_demo = True
        disp_del = await self._db.execute(text("DELETE FROM disputes WHERE order_id IN (SELECT id FROM orders WHERE is_demo = :val);"), {"val": True})
        disp_rowcount = disp_del.rowcount or 0

        r_del = await self._db.execute(text("DELETE FROM reviews WHERE is_demo = :val;"), {"val": True})
        r_rowcount = r_del.rowcount or 0

        d_del = await self._db.execute(text("DELETE FROM deliveries WHERE is_demo = :val;"), {"val": True})
        d_rowcount = d_del.rowcount or 0

        t_del = await self._db.execute(text("DELETE FROM transactions WHERE is_demo = :val;"), {"val": True})
        t_rowcount = t_del.rowcount or 0

        p_del = await self._db.execute(text("DELETE FROM payments WHERE is_demo = :val;"), {"val": True})
        p_rowcount = p_del.rowcount or 0

        oi_del = await self._db.execute(text("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE is_demo = :val);"), {"val": True})
        oi_rowcount = oi_del.rowcount or 0

        o_del = await self._db.execute(text("DELETE FROM orders WHERE is_demo = :val;"), {"val": True})
        o_rowcount = o_del.rowcount or 0

        pr_del = await self._db.execute(text("DELETE FROM products WHERE is_demo = :val;"), {"val": True})
        pr_rowcount = pr_del.rowcount or 0

        fi_del = await self._db.execute(text("DELETE FROM farmer_inventory WHERE is_demo = :val;"), {"val": True})
        fi_rowcount = fi_del.rowcount or 0

        addr_del = await self._db.execute(text("DELETE FROM addresses WHERE is_demo = :val;"), {"val": True})
        addr_rowcount = addr_del.rowcount or 0

        # WIPE profiles to ensure clean seed
        if farmer_user:
            await self._db.execute(text("DELETE FROM farmers WHERE user_id = :uid;"), {"uid": farmer_user.id})
        if delivery_user:
            await self._db.execute(text("DELETE FROM delivery_partners WHERE user_id = :uid;"), {"uid": delivery_user.id})

        users_deleted_count = 0

        # ── SEEDING REALISTIC DEMO DATASET ──

        # 1. Reset & Seed Customer Address
        if customer:
            await self._db.execute(text("DELETE FROM addresses WHERE user_id = :uid;"), {"uid": customer.id})
            customer.name = "Demo Customer"
            customer.phone = "+919999999991"
            customer.address = "Flat 304, Green Meadows Apartment, Lotus Road, Koramangala, Bengaluru, Karnataka - 560034"
            customer.status = UserStatus.approved
            self._db.add(customer)
            
            cust_addr = Address(
                user_id=customer.id,
                house_flat="Flat 304",
                building="Green Meadows Apartment",
                street="Lotus Road",
                area="Koramangala",
                city="Bengaluru",
                state="Karnataka",
                pin_code="560034",
                latitude=12.9352,
                longitude=77.6244,
                address_type="Home",
                is_default=True,
                is_demo=True
            )
            self._db.add(cust_addr)

        # 2. Reset & Seed Farmer Profile & Farm Address
        if farmer_user:
            await self._db.execute(text("DELETE FROM addresses WHERE user_id = :uid;"), {"uid": farmer_user.id})
            farmer_user.name = "Demo Farmer"
            farmer_user.phone = "+919999999992"
            farmer_user.address = "Farm No. 42, Auxin Green Farm, Siddhagatta Road, Chikballapur, Bengaluru Rural, Karnataka - 562101"
            farmer_user.status = UserStatus.approved  # Approved directly for demo convenience
            farmer_user.approved_by = requesting_user.id
            farmer_user.approved_at = datetime.now(tz=timezone.utc)
            farmer_user.rejected_at = None
            farmer_user.rejection_reason = None
            self._db.add(farmer_user)
            
            farmer_profile = Farmer(
                user_id=farmer_user.id,
                full_name="Demo Farmer",
                phone="+919999999992",
                location="Bengaluru Rural, Karnataka",
                bank_account_number=encrypt_field("123456789012"),
                ifsc_code="SBIN0001234",
                is_approved=True,
                bank_name="State Bank of India",
                account_holder_name="Demo Farmer",
                upi_id="demofarmer@okaxis"
            )
            self._db.add(farmer_profile)
            await self._db.flush()

            farm_addr = Address(
                user_id=farmer_user.id,
                house_flat="Farm No. 42",
                building="Auxin Green Farm",
                street="Siddhagatta Road",
                area="Chikballapur",
                city="Bengaluru Rural",
                state="Karnataka",
                pin_code="562101",
                latitude=12.9816,
                longitude=77.5846,
                address_type="Farm",
                is_default=True,
                is_demo=True
            )
            self._db.add(farm_addr)

        # 3. Reset & Seed Delivery Partner Profile & Address
        if delivery_user:
            await self._db.execute(text("DELETE FROM addresses WHERE user_id = :uid;"), {"uid": delivery_user.id})
            delivery_user.name = "Demo Delivery Partner"
            delivery_user.phone = "+919999999993"
            delivery_user.address = "Plot 88, Delivery Logistics Hub, Indiranagar, Bengaluru, Karnataka - 560038"
            delivery_user.status = UserStatus.approved  # Approved directly for demo convenience
            delivery_user.approved_by = requesting_user.id
            delivery_user.approved_at = datetime.now(tz=timezone.utc)
            delivery_user.rejected_at = None
            delivery_user.rejection_reason = None
            self._db.add(delivery_user)

            dp_profile = DeliveryPartner(
                user_id=delivery_user.id,
                full_name="Demo Delivery Partner",
                phone="+919999999993",
                is_active=True,
                is_available=True,
                current_latitude=12.9716,
                current_longitude=77.5946,
                bank_name="HDFC Bank",
                account_holder_name="Demo Delivery Partner",
                bank_account_number=encrypt_field("987654321098"),
                ifsc_code="HDFC0000001",
                upi_id="demodelivery@okhdfc",
                vehicle_type="Motorcycle",
                vehicle_number="KA-03-HA-9876",
                driving_license="DL-123456789"
            )
            self._db.add(dp_profile)
            await self._db.flush()

            dp_addr = Address(
                user_id=delivery_user.id,
                house_flat="Room 12",
                building="Courier Transit Hub",
                street="MG Road",
                area="Central Bengaluru",
                city="Bengaluru",
                state="Karnataka",
                pin_code="560001",
                latitude=12.9716,
                longitude=77.5946,
                address_type="Home",
                is_default=True,
                is_demo=True
            )
            self._db.add(dp_addr)

        # 4. Seed Farmer Inventory Listings (is_demo = True)
        # Category IDs: Leafy Greens (10), Root Vegetables (11)
        # Master Product IDs: Spinach (1), Tomato (7), Onion (8), Potato (9), Carrot (10), Mint (4)
        from app.models.catalogue import FarmerInventory
        from datetime import date, timedelta
        
        inventories_to_seed = [
            {"master_product_id": 7, "price": Decimal("40.00"), "quantity": 25, "unit": "kg", "organic": True, "notes": "Organic farm tomatoes"},
            {"master_product_id": 9, "price": Decimal("30.00"), "quantity": 50, "unit": "kg", "organic": False, "notes": "Freshly harvested potatoes"},
            {"master_product_id": 8, "price": Decimal("35.00"), "quantity": 40, "unit": "kg", "organic": False, "notes": "Red onions from Nashik"},
            {"master_product_id": 10, "price": Decimal("60.00"), "quantity": 15, "unit": "kg", "organic": True, "notes": "Sweet baby carrots"},
            {"master_product_id": 1, "price": Decimal("20.00"), "quantity": 30, "unit": "bunch", "organic": True, "notes": "Crispy fresh spinach"},
            {"master_product_id": 4, "price": Decimal("15.00"), "quantity": 20, "unit": "bunch", "organic": True, "notes": "Aromatic fresh mint"},
        ]
        
        seeded_inventories = []
        if farmer_profile:
            for inv_data in inventories_to_seed:
                inv = FarmerInventory(
                    master_product_id=inv_data["master_product_id"],
                    farmer_id=farmer_profile.id,
                    price=inv_data["price"],
                    quantity=inv_data["quantity"],
                    unit=inv_data["unit"],
                    is_organic=inv_data["organic"],
                    notes=inv_data["notes"],
                    harvest_date=date.today(),
                    is_active=True,
                    is_demo=True
                )
                self._db.add(inv)
                seeded_inventories.append(inv)
            await self._db.flush()

        # Seed some legacy direct product listings
        legacy_products = [
            {"name": "Direct Farm Cabbage", "description": "Fresh organic cabbage", "price": 25.0, "quantity": 30, "unit": "piece", "image_url": "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=200"},
            {"name": "Direct Farm Coriander", "description": "Fresh coriander leaves", "price": 12.0, "quantity": 40, "unit": "bunch", "image_url": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=200"},
        ]
        if farmer_profile:
            for lp in legacy_products:
                p = Product(
                    farmer_id=farmer_profile.id,
                    name=lp["name"],
                    description=lp["description"],
                    price=lp["price"],
                    quantity=lp["quantity"],
                    unit=lp["unit"],
                    harvest_date=date.today(),
                    image_url=lp["image_url"],
                    is_active=True,
                    is_demo=True
                )
                self._db.add(p)
            await self._db.flush()

        # 5. Clean Baseline Finalized (Zero orders, zero payments, zero transactions, zero deliveries)
        # Baseline farmer inventory is ready with fresh produce for demonstration checkouts.

        # Log audit details to admin_actions
        total_records_reset = (
            disp_rowcount + r_rowcount + p_rowcount + t_rowcount + d_rowcount +
            oi_rowcount + o_rowcount + pr_rowcount + fi_rowcount + addr_rowcount + users_deleted_count
        )

        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=AdminActionType.reset_demo_environment,
            target_user_id=requesting_user.id,
            metadata={"records_reset": total_records_reset, "success": True},
        )

        await self._db.commit()

        return {
            "success": True,
            "records_reset": total_records_reset,
            "message": "Demo environment has been reset successfully."
        }


