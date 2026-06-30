"""
app/models/payment.py
======================
ORM models for the `payments` and `transactions` tables.

Payment lifecycle:
    created → paid          (after successful Razorpay verification)
    created → failed        (Razorpay payment failed or verification mismatch)
    paid    → refunded      (order cancelled before/after delivery, or delivery failed)

Escrow logic:
    - Money is HELD in escrow state (payment.status == 'paid') immediately after
      successful payment.
    - A separate `transactions` row of type 'release' is written only after
      delivery.status transitions to 'delivered'.
    - The `transactions` table is the audit trail; payment.status holds the
      canonical state.

Invariants:
    - One payment per order (UNIQUE on order_id).
    - razorpay_order_id is unique (prevents duplicate Razorpay orders).
    - razorpay_payment_id is populated only after successful verification.
"""

import enum
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class PaymentStatus(str, enum.Enum):
    created  = "created"   # Razorpay order created; awaiting customer payment
    paid     = "paid"      # Verified success — funds in escrow
    failed   = "failed"    # Verification failed / Razorpay payment rejected
    refunded = "refunded"  # Full refund issued via Razorpay


class TransactionType(str, enum.Enum):
    payment = "payment"  # Initial payment capture
    release = "release"  # Escrow release to farmer post-delivery
    refund  = "refund"   # Refund to customer


class TransactionStatus(str, enum.Enum):
    success = "success"
    failed  = "failed"


# ---------------------------------------------------------------------------
# Payment
# ---------------------------------------------------------------------------

class Payment(Base):
    __tablename__ = "payments"

    __table_args__ = (
        UniqueConstraint("order_id", name="uq_payments_order_id"),
        UniqueConstraint("razorpay_order_id", name="uq_payments_razorpay_order_id"),
        Index("ix_payments_order_id", "order_id"),
        Index("ix_payments_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Razorpay-generated order identifier (e.g. "order_Xxxxx")
    razorpay_order_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    # Populated only after successful verification (e.g. "pay_Xxxxxx")
    razorpay_payment_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    # Stored in smallest currency unit (paisa for INR) for exact arithmetic;
    # displayed as decimal (rupees) in API responses.
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="INR",
    )

    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="paymentstatus", create_constraint=True),
        nullable=False,
        default=PaymentStatus.created,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
        onupdate=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    order: Mapped["Order"] = relationship(  # noqa: F821
        "Order",
        back_populates="payment",
        lazy="select",
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="payment",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="Transaction.created_at",
    )

    def __repr__(self) -> str:
        return (
            f"<Payment id={self.id} order_id={self.order_id} "
            f"status={self.status} amount={self.amount}>"
        )


# ---------------------------------------------------------------------------
# Transaction (audit log)
# ---------------------------------------------------------------------------

class Transaction(Base):
    __tablename__ = "transactions"

    __table_args__ = (
        Index("ix_transactions_payment_id", "payment_id"),
        Index("ix_transactions_type_status", "type", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    payment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transactiontype", create_constraint=True),
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus, name="transactionstatus", create_constraint=True),
        nullable=False,
    )

    # Human-readable note for debugging / auditing
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    payment: Mapped["Payment"] = relationship(
        "Payment",
        back_populates="transactions",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction id={self.id} payment_id={self.payment_id} "
            f"type={self.type} status={self.status} amount={self.amount}>"
        )
