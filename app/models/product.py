"""
app/models/product.py
======================
ORM model for the `products` table.

Product expiry:
  Products whose harvest_date is older than PRODUCT_EXPIRY_DAYS are considered
  stale.  The filtering is applied at the query level (not via a scheduled job)
  so no background worker is needed in Phase 1.  A nightly cleanup job can
  additionally set is_active=False for housekeeping.
"""

from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    # Composite index on farmer_id + is_active for fast farmer-scoped listing
    __table_args__ = (
        Index("ix_products_farmer_id_is_active", "farmer_id", "is_active"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    farmer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("farmers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Decimal(10, 2) → supports up to 99,999,999.99
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    unit: Mapped[str] = mapped_column(String(50), nullable=False)  # kg, piece, litre…
    harvest_date: Mapped[date] = mapped_column(Date, nullable=False)
    image_url: Mapped[str] = mapped_column(String(2048), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

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
    farmer: Mapped["Farmer"] = relationship(  # noqa: F821
        "Farmer",
        back_populates="products",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name!r} farmer_id={self.farmer_id}>"
