"""
app/models/farmer.py
=====================
ORM model for the `farmers` table.

Notes:
  - user_id is UNIQUE — one farmer profile per user account.
  - bank_account_number is stored encrypted (via app.core.encryption).
  - is_approved defaults to False; admin must explicitly approve.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # One-to-one with users
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)

    # Encrypted at-rest via app.core.encryption.encrypt_field / decrypt_field
    bank_account_number: Mapped[str] = mapped_column(String(512), nullable=False)
    ifsc_code: Mapped[str] = mapped_column(String(20), nullable=False)

    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="farmer_profile",
        lazy="select",
    )
    products: Mapped[list["Product"]] = relationship(  # noqa: F821
        "Product",
        back_populates="farmer",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Farmer id={self.id} user_id={self.user_id} approved={self.is_approved}>"
