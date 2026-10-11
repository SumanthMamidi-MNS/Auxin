"""
app/schemas/catalogue.py
=========================
Pydantic v2 schemas for the Master Product Catalogue.

Used by:
  - Admin endpoints (create/update master products & categories)
  - Public endpoints (customer product listing, search, autocomplete)
  - Farmer endpoints (product picker when adding inventory)
"""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _validate_slug(v: str) -> str:
    v = v.strip().lower()
    if not _SLUG_RE.match(v):
        raise ValueError(
            "slug must be lowercase, alphanumeric, and hyphen-separated (e.g. 'alphonso-mango')."
        )
    return v


# ---------------------------------------------------------------------------
# Category schemas
# ---------------------------------------------------------------------------

class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    parent_id: int | None
    icon_emoji: str | None
    image_url: str | None
    display_order: int
    is_active: bool
    subcategories: list["CategoryOut"] = []

    model_config = {"from_attributes": True}


class CategoryCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    parent_id: int | None = None
    icon_emoji: str | None = Field(None, max_length=10)
    image_url: str | None = Field(None, max_length=2048)
    display_order: int = 0

    @field_validator("slug", mode="before")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        return _validate_slug(v)


class CategoryUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    icon_emoji: str | None = None
    image_url: str | None = None
    display_order: int | None = None
    is_active: bool | None = None


# ---------------------------------------------------------------------------
# Master Product schemas
# ---------------------------------------------------------------------------

class MasterProductOut(BaseModel):
    """Full master product detail — used on product detail page."""
    id: int
    name: str
    slug: str
    description: str | None
    default_unit: str
    image_url: str | None
    tags: str | None            # JSON string e.g. '["organic","seasonal"]'
    storage_info: str | None
    shelf_life_days: int | None
    is_seasonal: bool
    is_active: bool
    display_order: int
    category_id: int
    category_name: str | None = None
    category_slug: str | None = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class CatalogueProductOut(BaseModel):
    """
    Aggregated product row for the customer listing / search results.

    Computed fields (from inventory aggregation):
      min_price, max_price, total_stock, farmer_count, has_organic
    """
    id: int
    name: str
    slug: str
    description: str | None
    default_unit: str
    image_url: str | None
    is_seasonal: bool
    shelf_life_days: int | None
    category_id: int
    category_name: str
    category_slug: str
    category_icon: str | None

    # Aggregated from farmer_inventory
    min_price: float
    max_price: float
    total_stock: int
    farmer_count: int
    has_organic: bool


class PaginatedCatalogueOut(BaseModel):
    items: list[CatalogueProductOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProductSuggestionOut(BaseModel):
    """Lightweight autocomplete suggestion."""
    id: int
    name: str
    slug: str
    category_name: str | None
    category_icon: str | None
    default_unit: str


class MasterProductCreateRequest(BaseModel):
    category_id: int
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=255)
    description: str | None = Field(None, max_length=5000)
    default_unit: str = Field("kg", min_length=1, max_length=20)
    image_url: str | None = Field(None, max_length=2048)
    tags: str | None = None
    storage_info: str | None = None
    shelf_life_days: int | None = Field(None, ge=1, le=3650)
    is_seasonal: bool = False
    display_order: int = 0

    @field_validator("slug", mode="before")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        return _validate_slug(v)

    @field_validator("image_url", mode="before")
    @classmethod
    def validate_image_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = str(v).strip()
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be a valid HTTP/HTTPS URL.")
        return v or None


class MasterProductUpdateRequest(BaseModel):
    category_id: int | None = None
    name: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None
    default_unit: str | None = Field(None, min_length=1, max_length=20)
    image_url: str | None = None
    tags: str | None = None
    storage_info: str | None = None
    shelf_life_days: int | None = Field(None, ge=1, le=3650)
    is_seasonal: bool | None = None
    is_active: bool | None = None
    display_order: int | None = None
