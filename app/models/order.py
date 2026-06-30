"""
app/models/order.py
====================
ORM models for the `orders` and `order_items` tables.

Order lifecycle:
    pending → accepted → completed
    pending → rejected
    pending → cancelled

Immutability rule:
    Once an order moves out of 'pending', no further status change
    is allowed except accepted → completed (farmer marks delivery done).
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
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"
    completed = "completed"


# ---------------------------------------------------------------------------
# Valid status transitions
# ---------------------------------------------------------------------------
# Keyed by (current_status, actor) → set of allowed next statuses.
# Actor values: "customer", "farmer"
# ---------------------------------------------------------------------------
ALLOWED_TRANSITIONS: dict[tuple[OrderStatus, str], set[OrderStatus]] = {
    (OrderStatus.pending, "customer"): {OrderStatus.cancelled},
    (OrderStatus.pending, "farmer"): {OrderStatus.accepted, OrderStatus.rejected},
    (OrderStatus.accepted, "farmer"): {OrderStatus.completed},
}


class Order(Base):
    __tablename__ = "orders"

    __table_args__ = (
        Index("ix_orders_customer_id_status", "customer_id", "status"),
        Index("ix_orders_farmer_id_status", "farmer_id", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    customer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    farmer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("farmers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="orderstatus", create_constraint=True),
        nullable=False,
        default=OrderStatus.pending,
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
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="select",
    )
    customer: Mapped["User"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[customer_id],
        lazy="select",
    )
    farmer: Mapped["Farmer"] = relationship(  # noqa: F821
        "Farmer",
        foreign_keys=[farmer_id],
        lazy="select",
    )
    delivery: Mapped["Delivery | None"] = relationship(  # noqa: F821
        "Delivery",
        back_populates="order",
        uselist=False,
        lazy="select",
    )
    payment: Mapped["Payment | None"] = relationship(  # noqa: F821
        "Payment",
        back_populates="order",
        uselist=False,
        lazy="select",
    )
    disputes: Mapped[list["Dispute"]] = relationship(  # noqa: F821
        "Dispute",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} status={self.status} customer_id={self.customer_id}>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_order_time: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items", lazy="select")
    product: Mapped["Product"] = relationship("Product", lazy="select")  # noqa: F821

    def __repr__(self) -> str:
        return (
            f"<OrderItem id={self.id} order_id={self.order_id} "
            f"product_id={self.product_id} qty={self.quantity}>"
        )
