"""
app/models/review.py
====================
ORM model for the `reviews` table.
"""

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    customer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    farmer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("farmers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    delivery_partner_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("delivery_partners.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    farmer_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    farmer_review: Mapped[str | None] = mapped_column(Text, nullable=True)

    delivery_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    delivery_review: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="review", lazy="select")  # noqa: F821
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id], lazy="select")  # noqa: F821
    farmer: Mapped["Farmer"] = relationship("Farmer", foreign_keys=[farmer_id], lazy="select")  # noqa: F821
    delivery_partner: Mapped["DeliveryPartner | None"] = relationship(  # noqa: F821
        "DeliveryPartner",
        foreign_keys=[delivery_partner_id],
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Review id={self.id} order_id={self.order_id} farmer_rating={self.farmer_rating}>"
