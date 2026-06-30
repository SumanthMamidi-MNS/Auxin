"""
app/services/dispute_service.py
=================================
Business logic for the Dispute System.

Dispute lifecycle:
    open → in_review → resolved
    open → in_review → rejected
    open → resolved  (admin can skip in_review)
    open → rejected  (admin can skip in_review)

Rules enforced here:
  • Only the customer or farmer of the linked order may raise a dispute.
  • Only one active (open / in_review) dispute per order at a time.
  • Status transitions follow DISPUTE_TRANSITIONS map.
  • Admin resolving with trigger_refund=True calls PaymentService._system_refund.
  • All admin actions are logged in admin_actions table.
"""

import math

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    DisputeAlreadyExistsError,
    DisputeForbiddenError,
    DisputeInvalidTransitionError,
    DisputeNotFoundError,
    OrderForbiddenError,
    OrderNotFoundError,
    PermissionDeniedError,
)
from app.models.admin import AdminActionType, Dispute, DisputeStatus, DISPUTE_TRANSITIONS
from app.models.order import Order
from app.models.user import User, UserRole
from app.repositories.admin_repository import AdminRepository
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.admin import (
    DisputeOut,
    DisputeResolveOut,
    PaginatedDisputesOut,
)


def _dispute_to_out(d: Dispute) -> DisputeOut:
    return DisputeOut(
        id=d.id,
        order_id=d.order_id,
        raised_by=d.raised_by,
        reason=d.reason,
        status=d.status,
        resolution_note=d.resolution_note,
        created_at=d.created_at.isoformat(),
        updated_at=d.updated_at.isoformat(),
    )


class DisputeService:
    def __init__(self, db: AsyncSession) -> None:
        self._db           = db
        self._admin_repo   = AdminRepository(db)
        self._order_repo   = OrderRepository(db)
        self._farmer_repo  = FarmerRepository(db)

    # ------------------------------------------------------------------
    # 1. Raise a dispute (customer or farmer)
    # ------------------------------------------------------------------

    async def raise_dispute(
        self,
        *,
        order_id:        int,
        reason:          str,
        requesting_user: User,
    ) -> DisputeOut:
        """
        Any involved party (customer or farmer of the order) may raise a
        dispute.  At most one active dispute is allowed per order.

        Raises:
            PermissionDeniedError     – caller is neither customer nor farmer
            OrderNotFoundError        – order does not exist
            OrderForbiddenError       – caller is not involved in the order
            DisputeAlreadyExistsError – open/in_review dispute already exists
        """
        if requesting_user.role not in (UserRole.customer, UserRole.farmer):
            raise PermissionDeniedError(
                "Only customers or farmers can raise a dispute."
            )

        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()

        # Validate the caller is involved in the order
        await self._assert_involved(order, requesting_user)

        # Prevent duplicate active dispute
        existing = await self._admin_repo.get_active_dispute_for_order(order_id)
        if existing is not None:
            raise DisputeAlreadyExistsError(
                f"An active dispute (ID={existing.id}) already exists for order #{order_id}."
            )

        dispute = await self._admin_repo.create_dispute(
            order_id=order_id,
            raised_by=requesting_user.id,
            reason=reason,
        )
        return _dispute_to_out(dispute)

    # ------------------------------------------------------------------
    # 2. List my disputes (customer or farmer view)
    # ------------------------------------------------------------------

    async def list_my_disputes(
        self,
        *,
        requesting_user: User,
        page:            int = 1,
        page_size:       int = 20,
    ) -> PaginatedDisputesOut:
        if requesting_user.role not in (
            UserRole.customer, UserRole.farmer, UserRole.admin
        ):
            raise PermissionDeniedError("You do not have access to disputes.")

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        disputes    = await self._admin_repo.list_disputes_for_user(
            requesting_user.id, offset=offset, limit=page_size
        )
        total       = await self._admin_repo.count_disputes_for_user(requesting_user.id)
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedDisputesOut(
            items=[_dispute_to_out(d) for d in disputes],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 3. Admin: list all disputes
    # ------------------------------------------------------------------

    async def list_all_disputes(
        self,
        *,
        requesting_user: User,
        status_filter:   str | None = None,
        page:            int = 1,
        page_size:       int = 20,
    ) -> PaginatedDisputesOut:
        if requesting_user.role != UserRole.admin:
            raise PermissionDeniedError("Only admins can view all disputes.")

        page      = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset    = (page - 1) * page_size

        disputes    = await self._admin_repo.list_all_disputes(
            status_filter=status_filter, offset=offset, limit=page_size
        )
        total       = await self._admin_repo.count_all_disputes(status_filter=status_filter)
        total_pages = math.ceil(total / page_size) if total else 0

        return PaginatedDisputesOut(
            items=[_dispute_to_out(d) for d in disputes],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # 4. Admin: resolve or reject a dispute
    # ------------------------------------------------------------------

    async def resolve_dispute(
        self,
        *,
        dispute_id:      int,
        new_status:      DisputeStatus,
        resolution_note: str,
        trigger_refund:  bool,
        requesting_user: User,
    ) -> DisputeResolveOut:
        """
        Admin resolves or rejects an open/in-review dispute.

        If trigger_refund=True and new_status='resolved', the payment module's
        _system_refund is invoked.  A refund failure raises PaymentGatewayError
        but does NOT roll back the dispute resolution (admin should re-try refund
        separately if needed).

        Raises:
            PermissionDeniedError          – caller is not admin
            DisputeNotFoundError           – dispute not found
            DisputeInvalidTransitionError  – illegal status transition
        """
        if requesting_user.role != UserRole.admin:
            raise PermissionDeniedError("Only admins can resolve or reject disputes.")

        dispute = await self._admin_repo.get_dispute_by_id(dispute_id)
        if dispute is None:
            raise DisputeNotFoundError()

        # Validate transition
        allowed = DISPUTE_TRANSITIONS.get(dispute.status, set())
        if new_status not in allowed:
            raise DisputeInvalidTransitionError(
                f"Cannot transition dispute from '{dispute.status.value}' "
                f"to '{new_status.value}'."
            )

        # Update dispute record
        dispute = await self._admin_repo.update_dispute(
            dispute,
            status=new_status,
            resolution_note=resolution_note,
        )

        # Log the admin action
        action_type = (
            AdminActionType.resolve_dispute
            if new_status == DisputeStatus.resolved
            else AdminActionType.reject_dispute
        )
        await self._admin_repo.log_action(
            admin_user_id=requesting_user.id,
            action_type=action_type,
            target_user_id=dispute.raised_by,
            metadata={
                "dispute_id":      dispute_id,
                "order_id":        dispute.order_id,
                "new_status":      new_status.value,
                "resolution_note": resolution_note,
                "trigger_refund":  trigger_refund,
            },
        )

        # Trigger refund if requested and dispute resolved
        refund_triggered = False
        if trigger_refund and new_status == DisputeStatus.resolved:
            from app.services.payment_service import PaymentService
            payment_svc = PaymentService(self._db)
            await payment_svc._system_refund(
                order_id=dispute.order_id,
                reason=f"Dispute #{dispute_id} resolved with refund. Note: {resolution_note}",
            )
            refund_triggered = True

        return DisputeResolveOut(
            dispute_id=dispute.id,
            status=dispute.status,
            resolution_note=resolution_note,
            refund_triggered=refund_triggered,
            message=(
                f"Dispute #{dispute_id} has been {new_status.value}."
                + (" Refund initiated." if refund_triggered else "")
            ),
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _assert_involved(self, order: Order, user: User) -> None:
        """
        Raise OrderForbiddenError if the user is not the customer or farmer
        of the given order.
        """
        if user.role == UserRole.customer:
            if order.customer_id != user.id:
                raise OrderForbiddenError()
            return

        if user.role == UserRole.farmer:
            # Farmer's orders are linked via farmer.id, not user.id
            farmer = await self._farmer_repo.get_by_user_id(user.id)
            if farmer is None or order.farmer_id != farmer.id:
                raise OrderForbiddenError()
            return

        raise PermissionDeniedError(
            "Only customers or farmers involved in the order can raise disputes."
        )
