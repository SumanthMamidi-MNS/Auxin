"""
app/models/user.py
==================
ORM model for the `users` table.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Index, Integer, String, text
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

    __table_args__ = (
        Index(
            "unique_super_admin",
            "is_super_admin",
            unique=True,
            postgresql_where=text("is_super_admin = true"),
            sqlite_where=text("is_super_admin = 1"),
        ),
    )

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
    is_super_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0", nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    approved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

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
    addresses: Mapped[list["Address"]] = relationship(  # noqa: F821
        "Address",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
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


from sqlalchemy import event
from sqlalchemy.orm import attributes

@event.listens_for(User, "before_update")
def receive_before_update(mapper, connection, target):
    state = attributes.instance_state(target)
    
    is_super_admin_history = state.get_history("is_super_admin", passive=True)
    was_super_admin = False
    if is_super_admin_history.deleted and True in is_super_admin_history.deleted:
        was_super_admin = True
    elif target.is_super_admin:
        was_super_admin = True
        
    if was_super_admin:
        if target.is_super_admin is False:
            raise ValueError("The permanent Super Admin account cannot lose Super Admin privileges.")
        if target.role != UserRole.admin:
            raise ValueError("The permanent Super Admin account cannot be demoted.")
        if target.status != UserStatus.approved:
            raise ValueError("The permanent Super Admin account cannot be suspended.")

@event.listens_for(User, "before_delete")
def receive_before_delete(mapper, connection, target):
    if target.is_super_admin:
        raise ValueError("The permanent Super Admin account cannot be deleted.")
