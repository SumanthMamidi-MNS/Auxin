"""
app/models/catalogue.py
========================
ORM models for the V3.0 Master Product Catalogue.

Tables:
  - master_categories   (2-level hierarchy: root → subcategory)
  - master_products     (admin-curated canonical product list)
  - farmer_inventory    (per-farmer stock contributions per master product)

Ownership:
  - master_categories and master_products are owned by Super Admin.
  - farmer_inventory is owned by Farmer (one row per master_product per farmer).
"""

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ---------------------------------------------------------------------------
# MasterCategory
# ---------------------------------------------------------------------------

class MasterCategory(Base):
    __tablename__ = "master_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Self-referential parent → allows 2-level hierarchy
    parent_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("master_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    icon_emoji: Mapped[str | None] = mapped_column(String(10), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=timezone.utc),
    )

    # Relationships
    parent: Mapped["MasterCategory | None"] = relationship(
        "MasterCategory",
        remote_side="MasterCategory.id",
        back_populates="children",
        lazy="select",
    )
    children: Mapped[list["MasterCategory"]] = relationship(
        "MasterCategory",
        back_populates="parent",
        lazy="select",
    )
    products: Mapped[list["MasterProduct"]] = relationship(
        "MasterProduct",
        back_populates="category",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<MasterCategory id={self.id} slug={self.slug!r}>"


# ---------------------------------------------------------------------------
# MasterProduct
# ---------------------------------------------------------------------------

class MasterProduct(Base):
    __tablename__ = "master_products"

    __table_args__ = (
        Index("ix_master_products_category", "category_id", "is_active"),
        Index("ix_master_products_display_order", "display_order", "is_active"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("master_categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Canonical unit for this product (e.g., "kg", "piece", "litre", "bunch")
    default_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")

    # Admin-supplied canonical image
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    # JSON-encoded list of tags e.g. '["organic", "seasonal", "local"]'
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)

    storage_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    shelf_life_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_seasonal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_by: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
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
    category: Mapped["MasterCategory"] = relationship(
        "MasterCategory",
        back_populates="products",
        lazy="select",
    )
    inventory_entries: Mapped[list["FarmerInventory"]] = relationship(
        "FarmerInventory",
        back_populates="master_product",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<MasterProduct id={self.id} slug={self.slug!r}>"


# ---------------------------------------------------------------------------
# FarmerInventory
# ---------------------------------------------------------------------------

class FarmerInventory(Base):
    __tablename__ = "farmer_inventory"

    __table_args__ = (
        UniqueConstraint(
            "master_product_id", "farmer_id", name="uq_inventory_product_farmer"
        ),
        CheckConstraint("price > 0", name="ck_inventory_price_positive"),
        CheckConstraint("quantity >= 0", name="ck_inventory_quantity_nonneg"),
        Index("ix_inventory_master_product", "master_product_id", "is_active"),
        Index("ix_inventory_farmer", "farmer_id", "is_active"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    master_product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("master_products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farmer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("farmers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")

    is_organic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    harvest_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Optional free-text notes from the farmer ("Grade A, hand-picked")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_demo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="FALSE"
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
    master_product: Mapped["MasterProduct"] = relationship(
        "MasterProduct",
        back_populates="inventory_entries",
        lazy="select",
    )
    farmer: Mapped["Farmer"] = relationship(  # noqa: F821
        "Farmer",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<FarmerInventory id={self.id} "
            f"product_id={self.master_product_id} farmer_id={self.farmer_id} "
            f"qty={self.quantity} price={self.price}>"
        )
