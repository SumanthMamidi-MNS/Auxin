"""
app/models/user.py
==================
ORM model for the `users` table.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    farmer   = "farmer"
    customer = "customer"
    delivery = "delivery"
    admin    = "admin"


class UserStatus(str, enum.Enum):
    """
    Lifecycle status for every user account.

    pending   – registered, awaiting admin approval (farmers and delivery only)
    approved  – active and permitted to use the platform
    rejected  – approval denied by admin; login is blocked
    suspended – admin-suspended; login is blocked
    """
    pending   = "pending"
    approved  = "approved"
    rejected  = "rejected"
    suspended = "suspended"


# Roles that require admin approval before accessing the platform
APPROVAL_REQUIRED_ROLES: frozenset[UserRole] = frozenset({
    UserRole.farmer,
    UserRole.delivery,
})


def default_status_for_role(role: UserRole) -> UserStatus:
    """
    Returns the initial status assigned to a new user based on their role.
    Customers and admins get immediate access (approved).
    Farmers and delivery partners start as pending until approved.
    """
    if role in APPROVAL_REQUIRED_ROLES:
        return UserStatus.pending
    return UserStatus.approved


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="userrole", create_constraint=True),
        nullable=False,
        default=UserRole.customer,
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="userstatus", create_constraint=True),
        nullable=False,
        default=UserStatus.approved,
    )

    # Supabase Auth user UUID — populated after the user calls /auth/sync-user.
    # Nullable for backward compatibility; existing rows get NULL and are
    # populated when the user first authenticates via Supabase.
    supabase_uid: Mapped[str | None] = mapped_column(
        String(36), unique=True, nullable=True, index=True
    )

    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    farmer_profile: Mapped["Farmer | None"] = relationship(  # noqa: F821
        "Farmer",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,      # one-to-one
        lazy="select",
    )
    delivery_profile: Mapped["DeliveryPartner | None"] = relationship(  # noqa: F821
        "DeliveryPartner",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,      # one-to-one
        lazy="select",
    )

    @property
    def is_active(self) -> bool:
        """Backward-compatibility shim: active if approved."""
        return self.status == UserStatus.approved

    @property
    def is_suspended(self) -> bool:
        """Backward-compatibility shim: True if status is suspended."""
        return self.status == UserStatus.suspended

    def __repr__(self) -> str:
        return f"<User id={self.id} phone={self.phone} role={self.role} status={self.status}>"
