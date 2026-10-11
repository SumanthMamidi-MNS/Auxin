"""
app/models/admin.py
====================
ORM models for the Admin + Dispute + Governance module.

admin_actions table:
    Immutable audit log of every admin action. Written once, never updated.

disputes table:
    Lifecycle: open → in_review → resolved
                            └──→ rejected
    One active dispute per order — enforced at service layer.
    Only involved parties (customer / farmer of the order) may raise one.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Use PostgreSQL JSONB in production/dev, but fallback to SQLite compatible JSON for tests
JSON_TYPE = JSONB().with_variant(JSON, "sqlite")

from app.db.base import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class AdminActionType(str, enum.Enum):
    approve_farmer  = "approve_farmer"
    reject_farmer   = "reject_farmer"
    suspend_user    = "suspend_user"
    reinstate_user  = "reinstate_user"
    resolve_dispute = "resolve_dispute"
    reject_dispute  = "reject_dispute"
    approve_delivery = "approve_delivery"
    reject_delivery = "reject_delivery"
    deactivate_product = "deactivate_product"
    update_product = "update_product"
    create_admin = "create_admin"
    disable_admin = "disable_admin"
    activate_admin = "activate_admin"
    remove_admin = "remove_admin"
    order_status_updated = "order_status_updated"
    order_cancelled = "order_cancelled"
    remove_product = "remove_product"
    reset_demo_data = "reset_demo_data"
    reset_demo_environment = "reset_demo_environment"


class DisputeStatus(str, enum.Enum):
    open      = "open"
    in_review = "in_review"
    resolved  = "resolved"
    rejected  = "rejected"


# Valid status transitions for disputes (admin-driven)
DISPUTE_TRANSITIONS: dict[DisputeStatus, set[DisputeStatus]] = {
    DisputeStatus.open:      {DisputeStatus.in_review, DisputeStatus.resolved, DisputeStatus.rejected},
    DisputeStatus.in_review: {DisputeStatus.resolved, DisputeStatus.rejected},
    # Terminal states
    DisputeStatus.resolved: set(),
    DisputeStatus.rejected: set(),
}


# ---------------------------------------------------------------------------
# AdminAction
# ---------------------------------------------------------------------------

class AdminAction(Base):
    """
    Immutable audit record of every administrative action.
    Never updated after insert.
    """
    __tablename__ = "admin_actions"

    __table_args__ = (
        Index("ix_admin_actions_admin_user_id", "admin_user_id"),
        Index("ix_admin_actions_action_type",   "action_type"),
        Index("ix_admin_actions_target_user_id","target_user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    admin_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    action_type: Mapped[AdminActionType] = mapped_column(
        Enum(AdminActionType, name="adminactiontype", create_constraint=True),
        nullable=False,
    )

    # The user who was acted upon (nullable for non-user actions)
    target_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Free-form JSON metadata (e.g. farmer_id, dispute_id, reason, notes)
    # Named action_metadata to avoid shadowing SQLAlchemy's reserved
    # DeclarativeBase.metadata attribute (which causes Alembic introspection bugs)
    action_metadata: Mapped[dict] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=dict,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    admin_user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[admin_user_id],
        lazy="select",
    )
    target_user: Mapped["User | None"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[target_user_id],
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<AdminAction id={self.id} type={self.action_type} "
            f"admin={self.admin_user_id} target={self.target_user_id}>"
        )


# ---------------------------------------------------------------------------
# Dispute
# ---------------------------------------------------------------------------

class Dispute(Base):
    __tablename__ = "disputes"

    __table_args__ = (
        Index("ix_disputes_order_id",  "order_id"),
        Index("ix_disputes_status",    "status"),
        Index("ix_disputes_raised_by", "raised_by"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
    )

    raised_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    reason: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[DisputeStatus] = mapped_column(
        Enum(DisputeStatus, name="disputestatus", create_constraint=True),
        nullable=False,
        default=DisputeStatus.open,
    )

    # Populated by admin when resolving or rejecting
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)

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
        back_populates="disputes",
        lazy="select",
    )
    raiser: Mapped["User"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[raised_by],
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Dispute id={self.id} order_id={self.order_id} "
            f"status={self.status} raised_by={self.raised_by}>"
        )
