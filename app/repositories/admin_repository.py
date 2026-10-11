"""
app/repositories/admin_repository.py
======================================
Data-access layer for admin_actions and disputes tables.
All raw SQLAlchemy queries live here; services hold no raw SQL.
"""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.admin import (
    AdminAction,
    AdminActionType,
    Dispute,
    DisputeStatus,
)
from app.models.farmer import Farmer
from app.models.delivery import DeliveryPartner
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User, UserRole, UserStatus


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


class AdminRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Admin actions (audit log)
    # ------------------------------------------------------------------

    async def log_action(
        self,
        *,
        admin_user_id:  int,
        action_type:    AdminActionType,
        target_user_id: int | None = None,
        metadata:       dict,
    ) -> AdminAction:
        """Append an immutable admin audit entry."""
        record = AdminAction(
            admin_user_id=admin_user_id,
            action_type=action_type,
            target_user_id=target_user_id,
            action_metadata=metadata,   # field renamed from metadata → action_metadata
            created_at=_utc_now(),
        )
        self._db.add(record)
        await self._db.flush()
        return record

    # ------------------------------------------------------------------
    # User queries (admin monitoring)
    # ------------------------------------------------------------------

    async def list_users(
        self,
        *,
        role:   UserRole | None = None,
        offset: int = 0,
        limit:  int = 20,
    ) -> list[User]:
        stmt = select(User).order_by(User.id.desc()).offset(offset).limit(limit)
        if role is not None:
            stmt = stmt.where(User.role == role)
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_users(self, *, role: UserRole | None = None) -> int:
        stmt = select(func.count()).select_from(User)
        if role is not None:
            stmt = stmt.where(User.role == role)
        result = await self._db.execute(stmt)
        return result.scalar_one()

    async def get_user_by_id(self, user_id: int) -> User | None:
        result = await self._db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def suspend_user(self, user: User) -> User:
        """Set the user's status to suspended, blocking login."""
        user.status = UserStatus.suspended
        self._db.add(user)
        await self._db.flush()
        return user

    async def reinstate_user(self, user: User) -> User:
        """Restore the user's status to approved."""
        user.status = UserStatus.approved
        self._db.add(user)
        await self._db.flush()
        return user

    async def approve_user_status(self, user: User, approved_by: str, approved_at: datetime) -> User:
        """Set status to approved — used when approving farmer/delivery accounts."""
        user.status = UserStatus.approved
        user.approved_by = approved_by
        user.approved_at = approved_at
        user.rejected_at = None
        user.rejection_reason = None
        self._db.add(user)
        await self._db.flush()
        return user

    async def reject_user_status(self, user: User, rejected_at: datetime, rejection_reason: str) -> User:
        """Set status to rejected — used when rejecting farmer/delivery accounts."""
        user.status = UserStatus.rejected
        user.rejected_at = rejected_at
        user.rejection_reason = rejection_reason
        user.approved_by = None
        user.approved_at = None
        self._db.add(user)
        await self._db.flush()
        return user

    # ------------------------------------------------------------------
    # Farmer queries (pending-approval queue)
    # ------------------------------------------------------------------

    async def list_pending_farmers(
        self, *, offset: int = 0, limit: int = 20
    ) -> list[Farmer]:
        result = await self._db.execute(
            select(Farmer)
            .options(joinedload(Farmer.user))
            .where(Farmer.is_approved == False)  # noqa: E712
            .order_by(Farmer.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_pending_farmers(self) -> int:
        result = await self._db.execute(
            select(func.count())
            .select_from(Farmer)
            .where(Farmer.is_approved == False)  # noqa: E712
        )
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Delivery Partner queries (pending-approval queue)
    # ------------------------------------------------------------------

    async def list_pending_delivery(
        self, *, offset: int = 0, limit: int = 20
    ) -> list[DeliveryPartner]:
        result = await self._db.execute(
            select(DeliveryPartner)
            .options(joinedload(DeliveryPartner.user))
            .join(User, DeliveryPartner.user_id == User.id)
            .where(User.status == UserStatus.pending)
            .order_by(DeliveryPartner.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_pending_delivery(self) -> int:
        result = await self._db.execute(
            select(func.count())
            .select_from(DeliveryPartner)
            .join(User, DeliveryPartner.user_id == User.id)
            .where(User.status == UserStatus.pending)
        )
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Order queries (admin monitoring)
    # ------------------------------------------------------------------

    async def list_orders(
        self,
        *,
        status_filter: str | None = None,
        offset: int = 0,
        limit:  int = 20,
    ) -> list[Order]:
        from app.models.order import OrderStatus, OrderItem
        from app.models.farmer import Farmer
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.farmer).selectinload(Farmer.user),
            )
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if status_filter is not None:
            try:
                s = OrderStatus(status_filter)
                stmt = stmt.where(Order.status == s)
            except ValueError:
                pass  # invalid filter ignored
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_orders(self, *, status_filter: str | None = None) -> int:
        from app.models.order import OrderStatus
        stmt = select(func.count()).select_from(Order)
        if status_filter is not None:
            try:
                s = OrderStatus(status_filter)
                stmt = stmt.where(Order.status == s)
            except ValueError:
                pass
        result = await self._db.execute(stmt)
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Payment queries (admin monitoring)
    # ------------------------------------------------------------------

    async def list_payments(
        self,
        *,
        status_filter: str | None = None,
        offset: int = 0,
        limit:  int = 20,
    ) -> list[Payment]:
        from app.models.payment import PaymentStatus
        stmt = (
            select(Payment)
            .order_by(Payment.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if status_filter is not None:
            try:
                s = PaymentStatus(status_filter)
                stmt = stmt.where(Payment.status == s)
            except ValueError:
                pass
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_payments(self, *, status_filter: str | None = None) -> int:
        from app.models.payment import PaymentStatus
        stmt = select(func.count()).select_from(Payment)
        if status_filter is not None:
            try:
                s = PaymentStatus(status_filter)
                stmt = stmt.where(Payment.status == s)
            except ValueError:
                pass
        result = await self._db.execute(stmt)
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Dispute queries
    # ------------------------------------------------------------------

    async def create_dispute(
        self,
        *,
        order_id:  int,
        raised_by: int,
        reason:    str,
    ) -> Dispute:
        dispute = Dispute(
            order_id=order_id,
            raised_by=raised_by,
            reason=reason,
            status=DisputeStatus.open,
            created_at=_utc_now(),
            updated_at=_utc_now(),
        )
        self._db.add(dispute)
        await self._db.flush()
        return dispute

    async def get_dispute_by_id(self, dispute_id: int) -> Dispute | None:
        result = await self._db.execute(
            select(Dispute).where(Dispute.id == dispute_id)
        )
        return result.scalar_one_or_none()

    async def get_active_dispute_for_order(self, order_id: int) -> Dispute | None:
        """
        Return an 'open' or 'in_review' dispute for an order, if any.
        Used to prevent duplicate active disputes.
        """
        result = await self._db.execute(
            select(Dispute)
            .where(Dispute.order_id == order_id)
            .where(
                Dispute.status.in_([DisputeStatus.open, DisputeStatus.in_review])
            )
        )
        return result.scalar_one_or_none()

    async def list_disputes_for_user(
        self,
        user_id: int,
        *,
        offset: int = 0,
        limit:  int = 20,
    ) -> list[Dispute]:
        result = await self._db.execute(
            select(Dispute)
            .where(Dispute.raised_by == user_id)
            .order_by(Dispute.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_disputes_for_user(self, user_id: int) -> int:
        result = await self._db.execute(
            select(func.count())
            .select_from(Dispute)
            .where(Dispute.raised_by == user_id)
        )
        return result.scalar_one()

    async def list_all_disputes(
        self,
        *,
        status_filter: str | None = None,
        offset: int = 0,
        limit:  int = 20,
    ) -> list[Dispute]:
        stmt = (
            select(Dispute)
            .order_by(Dispute.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if status_filter is not None:
            try:
                s = DisputeStatus(status_filter)
                stmt = stmt.where(Dispute.status == s)
            except ValueError:
                pass
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_all_disputes(self, *, status_filter: str | None = None) -> int:
        stmt = select(func.count()).select_from(Dispute)
        if status_filter is not None:
            try:
                s = DisputeStatus(status_filter)
                stmt = stmt.where(Dispute.status == s)
            except ValueError:
                pass
        result = await self._db.execute(stmt)
        return result.scalar_one()

    async def update_dispute(
        self,
        dispute: Dispute,
        *,
        status:          DisputeStatus,
        resolution_note: str,
    ) -> Dispute:
        dispute.status          = status
        dispute.resolution_note = resolution_note
        dispute.updated_at      = _utc_now()
        self._db.add(dispute)
        await self._db.flush()
        return dispute

    # ------------------------------------------------------------------
    # Product queries (admin monitoring)
    # ------------------------------------------------------------------

    async def list_products(
        self,
        *,
        offset: int = 0,
        limit:  int = 30,
    ) -> list:
        from app.models.product import Product
        result = await self._db.execute(
            select(Product)
            .order_by(Product.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_products(self) -> int:
        from app.models.product import Product
        result = await self._db.execute(
            select(func.count()).select_from(Product)
        )
        return result.scalar_one()

    async def deactivate_product(self, product_id: int) -> bool:
        """Soft-deactivate a product by ID. Returns True if the product was found."""
        from app.models.product import Product
        result = await self._db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if product is None:
            return False
        product.is_active = False
        self._db.add(product)
        await self._db.flush()
        return True

    async def activate_product(self, product_id: int) -> bool:
        """Activate a product by ID. Returns True if the product was found."""
        from app.models.product import Product
        result = await self._db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if product is None:
            return False
        product.is_active = True
        self._db.add(product)
        await self._db.flush()
        return True

    # ------------------------------------------------------------------
    # Platform stats (admin dashboard)
    # ------------------------------------------------------------------

    async def get_platform_stats(self, is_demo: bool = False) -> dict:
        """Return aggregate counts for the admin dashboard."""
        from app.models.farmer import Farmer
        from app.models.order import Order
        from app.models.payment import Payment, PaymentStatus
        from app.models.product import Product

        # We construct filters based on is_demo value (True or False)
        demo_val = True if is_demo else False

        total_users    = (await self._db.execute(select(func.count()).select_from(User).where(User.is_demo == demo_val))).scalar_one()
        
        # Joined counts for Farmer/Dispute to filter by User.is_demo or Order.is_demo
        total_farmers  = (await self._db.execute(
            select(func.count()).select_from(Farmer).join(User, Farmer.user_id == User.id).where(User.is_demo == demo_val)
        )).scalar_one()
        
        total_products = (await self._db.execute(select(func.count()).select_from(Product).where(Product.is_demo == demo_val))).scalar_one()
        total_orders   = (await self._db.execute(select(func.count()).select_from(Order).where(Order.is_demo == demo_val))).scalar_one()
        total_payments = (await self._db.execute(select(func.count()).select_from(Payment).where(Payment.is_demo == demo_val))).scalar_one()
        
        total_disputes = (await self._db.execute(
            select(func.count()).select_from(Dispute).join(Order, Dispute.order_id == Order.id).where(Order.is_demo == demo_val)
        )).scalar_one()
        
        pending_farmers = (await self._db.execute(
            select(func.count()).select_from(Farmer)
            .join(User, Farmer.user_id == User.id)
            .where((Farmer.is_approved == False) & (User.is_demo == demo_val))  # noqa: E712
        )).scalar_one()
        
        open_disputes = (await self._db.execute(
            select(func.count()).select_from(Dispute)
            .join(Order, Dispute.order_id == Order.id)
            .where(
                (Dispute.status.in_([DisputeStatus.open, DisputeStatus.in_review]))
                & (Order.is_demo == demo_val)
            )
        )).scalar_one()
        
        total_revenue = (await self._db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0))
            .where((Payment.status == PaymentStatus.paid) & (Payment.is_demo == demo_val))
        )).scalar_one()

        return {
            "total_users":    total_users,
            "total_farmers":  total_farmers,
            "total_products": total_products,
            "total_orders":   total_orders,
            "total_payments": total_payments,
            "total_disputes": total_disputes,
            "pending_farmers": pending_farmers,
            "open_disputes":   open_disputes,
            "total_revenue":   float(total_revenue),
        }

    async def list_deliveries(self, *, offset: int = 0, limit: int = 20) -> list:
        from app.models.delivery import Delivery
        stmt = select(Delivery).order_by(Delivery.id.desc()).offset(offset).limit(limit)
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_deliveries(self) -> int:
        from app.models.delivery import Delivery
        stmt = select(func.count()).select_from(Delivery)
        result = await self._db.execute(stmt)
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Phase 2.1A: Admins and Activity Logs
    # ------------------------------------------------------------------

    async def list_admins(self, *, offset: int = 0, limit: int = 20) -> list[User]:
        stmt = select(User).where(User.role == UserRole.admin).order_by(User.id.desc()).offset(offset).limit(limit)
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_admins(self) -> int:
        stmt = select(func.count()).select_from(User).where(User.role == UserRole.admin)
        result = await self._db.execute(stmt)
        return result.scalar_one()

    def _build_activity_logs_query(
        self,
        *,
        admin_user_id: int | None = None,
        action_type:   str | None = None,
        start_date:    datetime | None = None,
        end_date:      datetime | None = None,
        search:        str | None = None,
    ):
        from sqlalchemy import or_, cast, String
        from sqlalchemy.orm import aliased
        
        stmt = select(AdminAction)
        
        if admin_user_id is not None:
            stmt = stmt.where(AdminAction.admin_user_id == admin_user_id)
        if action_type is not None:
            stmt = stmt.where(AdminAction.action_type == action_type)
        if start_date is not None:
            stmt = stmt.where(AdminAction.created_at >= start_date)
        if end_date is not None:
            stmt = stmt.where(AdminAction.created_at <= end_date)
        if search:
            admin_alias = aliased(User)
            target_alias = aliased(User)
            stmt = stmt.outerjoin(admin_alias, AdminAction.admin_user)
            stmt = stmt.outerjoin(target_alias, AdminAction.target_user)
            stmt = stmt.where(
                or_(
                    admin_alias.name.ilike(f"%{search}%"),
                    admin_alias.email.ilike(f"%{search}%"),
                    target_alias.name.ilike(f"%{search}%"),
                    target_alias.email.ilike(f"%{search}%"),
                    cast(AdminAction.action_metadata, String).ilike(f"%{search}%")
                )
            )
        return stmt

    async def list_activity_logs(
        self,
        *,
        offset:        int = 0,
        limit:         int = 50,
        admin_user_id: int | None = None,
        action_type:   str | None = None,
        start_date:    datetime | None = None,
        end_date:      datetime | None = None,
        search:        str | None = None,
        order:         str = "desc",
    ) -> list[AdminAction]:
        stmt = self._build_activity_logs_query(
            admin_user_id=admin_user_id,
            action_type=action_type,
            start_date=start_date,
            end_date=end_date,
            search=search,
        )
        
        stmt = stmt.options(
            selectinload(AdminAction.admin_user),
            selectinload(AdminAction.target_user)
        )
        
        if order.lower() == "asc":
            stmt = stmt.order_by(AdminAction.id.asc())
        else:
            stmt = stmt.order_by(AdminAction.id.desc())
            
        stmt = stmt.offset(offset).limit(limit)
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_activity_logs(
        self,
        *,
        admin_user_id: int | None = None,
        action_type:   str | None = None,
        start_date:    datetime | None = None,
        end_date:      datetime | None = None,
        search:        str | None = None,
    ) -> int:
        stmt = self._build_activity_logs_query(
            admin_user_id=admin_user_id,
            action_type=action_type,
            start_date=start_date,
            end_date=end_date,
            search=search,
        )
        # Modify to do a count select
        stmt = stmt.with_only_columns(func.count(AdminAction.id)).order_by(None)
        result = await self._db.execute(stmt)
        return result.scalar_one()


