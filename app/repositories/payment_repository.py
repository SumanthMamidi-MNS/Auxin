"""
app/repositories/payment_repository.py
========================================
Data-access layer for the `payments` and `transactions` tables.

All DB I/O is kept here; services hold no raw SQLAlchemy queries.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.payment import (
    Payment,
    PaymentStatus,
    Transaction,
    TransactionStatus,
    TransactionType,
)


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


class PaymentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Payment queries
    # ------------------------------------------------------------------

    async def get_by_id(self, payment_id: int) -> Payment | None:
        """Fetch a payment by PK, eagerly loading its transactions."""
        result = await self._db.execute(
            select(Payment)
            .where(Payment.id == payment_id)
            .options(selectinload(Payment.transactions))
        )
        return result.scalar_one_or_none()

    async def get_by_order_id(self, order_id: int) -> Payment | None:
        """Fetch the payment record for an order (at most one)."""
        result = await self._db.execute(
            select(Payment)
            .where(Payment.order_id == order_id)
            .options(selectinload(Payment.transactions))
        )
        return result.scalar_one_or_none()

    async def get_by_razorpay_order_id(self, razorpay_order_id: str) -> Payment | None:
        """Fetch by Razorpay order ID (used during verification)."""
        result = await self._db.execute(
            select(Payment)
            .where(Payment.razorpay_order_id == razorpay_order_id)
            .options(selectinload(Payment.transactions))
        )
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------
    # Payment mutations
    # ------------------------------------------------------------------

    async def create(
        self,
        *,
        order_id: int,
        razorpay_order_id: str,
        amount: Decimal,
        currency: str = "INR",
    ) -> Payment:
        """Persist a new payment record in 'created' status."""
        from app.models.order import Order
        res = await self._db.execute(select(Order.is_demo).where(Order.id == order_id))
        is_demo_val = res.scalar() or False

        payment = Payment(
            order_id=order_id,
            razorpay_order_id=razorpay_order_id,
            amount=amount,
            currency=currency,
            status=PaymentStatus.created,
            is_demo=is_demo_val,
            created_at=_utc_now(),
            updated_at=_utc_now(),
        )
        self._db.add(payment)
        await self._db.flush()  # Get ID without committing
        return payment

    async def mark_paid(
        self,
        payment: Payment,
        *,
        razorpay_payment_id: str,
    ) -> Payment:
        """Set status → paid, store the Razorpay payment ID."""
        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = PaymentStatus.paid
        payment.updated_at = _utc_now()
        self._db.add(payment)
        await self._db.flush()
        return payment

    async def mark_failed(self, payment: Payment) -> Payment:
        """Set status → failed."""
        payment.status = PaymentStatus.failed
        payment.updated_at = _utc_now()
        self._db.add(payment)
        await self._db.flush()
        return payment

    async def mark_refunded(self, payment: Payment) -> Payment:
        """Set status → refunded."""
        payment.status = PaymentStatus.refunded
        payment.updated_at = _utc_now()
        self._db.add(payment)
        await self._db.flush()
        return payment

    # ------------------------------------------------------------------
    # Transaction log
    # ------------------------------------------------------------------

    async def add_transaction(
        self,
        *,
        payment_id: int,
        type: TransactionType,
        amount: Decimal,
        status: TransactionStatus,
        note: str | None = None,
    ) -> Transaction:
        """Append an immutable transaction record."""
        res = await self._db.execute(select(Payment.is_demo).where(Payment.id == payment_id))
        is_demo_val = res.scalar() or False

        txn = Transaction(
            payment_id=payment_id,
            type=type,
            amount=amount,
            status=status,
            note=note,
            is_demo=is_demo_val,
            created_at=_utc_now(),
        )
        self._db.add(txn)
        await self._db.flush()
        return txn

    async def reload_with_transactions(self, payment: Payment) -> Payment:
        """Re-fetch a payment with its transactions freshly loaded."""
        await self._db.refresh(payment)
        result = await self._db.execute(
            select(Payment)
            .where(Payment.id == payment.id)
            .options(selectinload(Payment.transactions))
        )
        return result.scalar_one()
