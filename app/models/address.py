"""
app/models/address.py
=====================
ORM model for the `addresses` table.
"""

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    house_flat: Mapped[str] = mapped_column(String(255), nullable=False)
    building: Mapped[str | None] = mapped_column(String(255), nullable=True)
    street: Mapped[str] = mapped_column(String(255), nullable=False)
    area: Mapped[str] = mapped_column(String(255), nullable=False)
    landmark: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pin_code: Mapped[str] = mapped_column(String(6), nullable=False)
    address_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Home")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0", nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

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
    user: Mapped["User"] = relationship("User", back_populates="addresses")  # noqa: F821

    def to_formatted_string(self) -> str:
        parts = [self.house_flat]
        if self.building:
            parts.append(self.building)
        parts.append(self.street)
        parts.append(self.area)
        if self.landmark:
            parts.append(f"Near {self.landmark}")
        parts.append(self.city)
        parts.append(self.state)
        parts.append(self.pin_code)
        return ", ".join(parts)

    def __repr__(self) -> str:
        return f"<Address id={self.id} user_id={self.user_id} type={self.address_type} default={self.is_default}>"
