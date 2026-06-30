"""
app/models/delivery.py
=======================
ORM models for the `delivery_partners` and `deliveries` tables.

Delivery lifecycle:
    pending → assigned → picked_up → out_for_delivery → delivered
    (any state except delivered) → failed

Rules:
  - One delivery record per order (enforced by UNIQUE on order_id).
  - OTP is bcrypt-hashed; never stored in plain text.
  - Geolocation fields on delivery_partners updated by the partner in real time.
  - Delivery destination lat/lon are stored on the delivery record, copied from
    the order's customer address (populated when delivery is created).
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class DeliveryStatus(str, enum.Enum):
    pending = "pending"           # delivery record created, no partner yet
    assigned = "assigned"         # partner assigned
    picked_up = "picked_up"       # partner picked up goods from farmer
    out_for_delivery = "out_for_delivery"   # en-route to customer
    delivered = "delivered"       # OTP verified, complete
    failed = "failed"             # could not complete


# Strict linear transition map.
# Key: current status → set of legal next statuses.
DELIVERY_TRANSITIONS: dict[DeliveryStatus, set[DeliveryStatus]] = {
    DeliveryStatus.pending: {DeliveryStatus.assigned, DeliveryStatus.failed},
    DeliveryStatus.assigned: {DeliveryStatus.picked_up, DeliveryStatus.failed},
    DeliveryStatus.picked_up: {DeliveryStatus.out_for_delivery, DeliveryStatus.failed},
    DeliveryStatus.out_for_delivery: {DeliveryStatus.delivered, DeliveryStatus.failed},
    # Terminal states — no further transitions
    DeliveryStatus.delivered: set(),
    DeliveryStatus.failed: set(),
}


# ---------------------------------------------------------------------------
# DeliveryPartner
# ---------------------------------------------------------------------------

class DeliveryPartner(Base):
    __tablename__ = "delivery_partners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # One-to-one with users (role = delivery)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # Admin can deactivate a partner (different from is_available which is self-toggled)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Partner toggles this to go online/offline for new assignments
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Real-time GPS position – nullable until first location update
    current_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="delivery_profile",
        lazy="select",
    )
    deliveries: Mapped[list["Delivery"]] = relationship(
        "Delivery",
        back_populates="delivery_partner",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<DeliveryPartner id={self.id} user_id={self.user_id} "
            f"available={self.is_available}>"
        )


# ---------------------------------------------------------------------------
# Delivery
# ---------------------------------------------------------------------------

class Delivery(Base):
    __tablename__ = "deliveries"

    __table_args__ = (
        UniqueConstraint("order_id", name="uq_deliveries_order_id"),
        Index("ix_deliveries_status", "status"),
        # Column name "delivery_partner_id" matches the migration (001) column name.
        Index("ix_deliveries_partner_id_status", "delivery_partner_id", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    delivery_partner_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("delivery_partners.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    status: Mapped[DeliveryStatus] = mapped_column(
        Enum(DeliveryStatus, name="deliverystatus", create_constraint=True),
        nullable=False,
        default=DeliveryStatus.pending,
        index=True,
    )

    # OTP for final delivery confirmation (bcrypt-hashed)
    otp_code: Mapped[str | None] = mapped_column(String(255), nullable=True)
    otp_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Delivery destination coordinates (copied from customer profile / order)
    # Nullable – populated when available; geofence check only runs when set.
    destination_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    destination_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Lifecycle timestamps
    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    picked_up_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    order: Mapped["Order"] = relationship(  # noqa: F821
        "Order",
        back_populates="delivery",
        lazy="select",
    )
    delivery_partner: Mapped["DeliveryPartner | None"] = relationship(
        "DeliveryPartner",
        back_populates="deliveries",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Delivery id={self.id} order_id={self.order_id} "
            f"status={self.status} partner_id={self.delivery_partner_id}>"
        )
