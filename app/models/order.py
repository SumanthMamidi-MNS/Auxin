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
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    reserved = "reserved"
    payment_pending = "payment_pending"
    payment_confirmed = "payment_confirmed"
    accepted = "accepted"
    packing = "packing"
    ready_for_pickup = "ready_for_pickup"
    picked_up = "picked_up"
    out_for_delivery = "out_for_delivery"
    completed = "completed"
    cancelled = "cancelled"
    rejected = "rejected"
    refund_pending = "refund_pending"
    refund_completed = "refund_completed"


# ---------------------------------------------------------------------------
# Valid status transitions
# ---------------------------------------------------------------------------
# Keyed by (current_status, actor) → set of allowed next statuses.
# Actor values: "customer", "farmer", "delivery", "system", "admin"
# ---------------------------------------------------------------------------
ALLOWED_TRANSITIONS: dict[tuple[OrderStatus, str], set[OrderStatus]] = {
    # Customer / system checkout flow
    (OrderStatus.pending, "system"): {OrderStatus.reserved},
    (OrderStatus.reserved, "system"): {OrderStatus.payment_pending, OrderStatus.cancelled},
    (OrderStatus.reserved, "customer"): {OrderStatus.cancelled},
    (OrderStatus.payment_pending, "system"): {OrderStatus.accepted, OrderStatus.cancelled},
    (OrderStatus.payment_pending, "customer"): {OrderStatus.cancelled},

    # Post-payment / acceptance flow (accepted is system post-payment state)
    (OrderStatus.accepted, "farmer"): {OrderStatus.packing, OrderStatus.cancelled, OrderStatus.rejected},
    (OrderStatus.accepted, "system"): {OrderStatus.cancelled},
    (OrderStatus.packing, "farmer"): {OrderStatus.ready_for_pickup, OrderStatus.cancelled},
    (OrderStatus.packing, "system"): {OrderStatus.cancelled},
    (OrderStatus.ready_for_pickup, "farmer"): {OrderStatus.picked_up, OrderStatus.cancelled},
    (OrderStatus.ready_for_pickup, "system"): {OrderStatus.cancelled},

    # Delivery lifecycle flow
    (OrderStatus.picked_up, "delivery"): {OrderStatus.out_for_delivery, OrderStatus.cancelled},
    (OrderStatus.out_for_delivery, "delivery"): {OrderStatus.completed, OrderStatus.cancelled},
    (OrderStatus.completed, "admin"): {OrderStatus.refund_pending},
    (OrderStatus.refund_pending, "system"): {OrderStatus.refund_completed},
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
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0", nullable=False)

    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="orderstatus", create_constraint=True),
        nullable=False,
        default=OrderStatus.pending,
        index=True,
    )

    reservation_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    payment_method: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
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
    review: Mapped["Review | None"] = relationship(  # noqa: F821
        "Review",
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
    product_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_order_time: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    inventory_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("farmer_inventory.id", ondelete="RESTRICT"),
        nullable=True,
    )
    master_product_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("master_products.id", ondelete="RESTRICT"),
        nullable=True,
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items", lazy="select")
    product: Mapped["Product"] = relationship("Product", lazy="select")  # noqa: F821
    inventory: Mapped["FarmerInventory | None"] = relationship("FarmerInventory", lazy="select")  # noqa: F821
    master_product: Mapped["MasterProduct | None"] = relationship("MasterProduct", lazy="select")  # noqa: F821

    def __repr__(self) -> str:
        return (
            f"<OrderItem id={self.id} order_id={self.order_id} "
            f"product_id={self.product_id} qty={self.quantity} "
            f"inventory_id={self.inventory_id}>"
        )
