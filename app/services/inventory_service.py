"""
app/services/inventory_service.py
===================================
Business logic for Farmer Inventory management.

Farmer operations:
  - Add inventory for a master product (one entry per product per farmer)
  - Update price, quantity, organic flag, harvest date
  - Deactivate (remove) an inventory entry
  - List own inventory

Internal operations (used by order_service):
  - Atomically decrement stock
  - Restore stock on cancellation/rejection
  - Select best supplier for a product (for cart item resolution)
"""

import math
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    FarmerNotApprovedError,
    FarmerNotFoundError,
    InsufficientStockError,
    PermissionDeniedError,
)
from app.models.user import User, UserRole
from app.repositories.catalogue_repository import CatalogueRepository
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.inventory import (
    FarmerInventoryOut,
    InventoryOut,
    PaginatedInventoryOut,
)


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class InventoryNotFoundError(Exception):
    pass


class InventoryAlreadyExistsError(Exception):
    pass


class MasterProductNotFoundError(Exception):
    pass


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _entry_to_out(entry, *, master_product=None) -> InventoryOut:
    mp_name = None
    mp_slug = None
    if master_product is not None:
        mp_name = master_product.name
        mp_slug = master_product.slug
    elif hasattr(entry, "master_product") and entry.master_product:
        mp_name = entry.master_product.name
        mp_slug = entry.master_product.slug
    return InventoryOut(
        id=entry.id,
        master_product_id=entry.master_product_id,
        master_product_name=mp_name,
        master_product_slug=mp_slug,
        farmer_id=entry.farmer_id,
        price=float(entry.price),
        quantity=entry.quantity,
        unit=entry.unit,
        is_organic=entry.is_organic,
        harvest_date=entry.harvest_date.isoformat(),
        notes=entry.notes,
        is_active=entry.is_active,
        created_at=entry.created_at.isoformat(),
        updated_at=entry.updated_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# InventoryService
# ---------------------------------------------------------------------------

class InventoryService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._inv_repo = InventoryRepository(db)
        self._cat_repo = CatalogueRepository(db)
        self._farmer_repo = FarmerRepository(db)

    # ------------------------------------------------------------------ #
    # Guard
    # ------------------------------------------------------------------ #

    async def _get_approved_farmer(self, user: User):
        if user.role != UserRole.farmer:
            raise PermissionDeniedError("Only farmers can manage inventory.")
        farmer = await self._farmer_repo.get_by_user_id(user.id)
        if farmer is None:
            raise FarmerNotFoundError("No farmer profile found.")
        if not farmer.is_approved:
            raise FarmerNotApprovedError()
        return farmer

    # ------------------------------------------------------------------ #
    # Add inventory
    # ------------------------------------------------------------------ #

    async def add_inventory(
        self,
        *,
        requesting_user: User,
        master_product_id: int,
        price: float,
        quantity: int,
        unit: str,
        is_organic: bool,
        harvest_date: date,
        notes: str | None = None,
    ) -> InventoryOut:
        farmer = await self._get_approved_farmer(requesting_user)

        # Verify master product exists
        mp = await self._cat_repo.get_product_by_id(master_product_id)
        if mp is None:
            raise MasterProductNotFoundError(
                f"Master product {master_product_id} not found in catalogue."
            )

        # Check duplicate (one entry per product per farmer)
        existing = await self._inv_repo.get_by_farmer_and_product(
            farmer_id=farmer.id, master_product_id=master_product_id
        )
        if existing:
            raise InventoryAlreadyExistsError(
                f"You already have a listing for '{mp.name}'. "
                "Use the update endpoint to change price or quantity."
            )

        entry = await self._inv_repo.create(
            master_product_id=master_product_id,
            farmer_id=farmer.id,
            price=Decimal(str(price)),
            quantity=quantity,
            unit=unit,
            is_organic=is_organic,
            harvest_date=harvest_date,
            notes=notes,
        )
        await self._db.commit()
        await self._db.refresh(entry)
        return _entry_to_out(entry, master_product=mp)

    # ------------------------------------------------------------------ #
    # Update inventory
    # ------------------------------------------------------------------ #

    async def update_inventory(
        self,
        *,
        requesting_user: User,
        inventory_id: int,
        **fields,
    ) -> InventoryOut:
        farmer = await self._get_approved_farmer(requesting_user)
        entry = await self._inv_repo.get_by_id(inventory_id)
        if entry is None:
            raise InventoryNotFoundError(f"Inventory entry {inventory_id} not found.")
        if entry.farmer_id != farmer.id:
            raise PermissionDeniedError("You can only update your own inventory.")

        # Coerce price to Decimal if provided
        if "price" in fields and fields["price"] is not None:
            fields["price"] = Decimal(str(fields["price"]))

        entry = await self._inv_repo.update(entry, **fields)
        await self._db.commit()
        await self._db.refresh(entry)
        mp = await self._cat_repo.get_product_by_id(entry.master_product_id)
        return _entry_to_out(entry, master_product=mp)

    # ------------------------------------------------------------------ #
    # Deactivate inventory
    # ------------------------------------------------------------------ #

    async def deactivate_inventory(
        self, *, requesting_user: User, inventory_id: int
    ) -> dict:
        farmer = await self._get_approved_farmer(requesting_user)
        entry = await self._inv_repo.get_by_id(inventory_id)
        if entry is None:
            raise InventoryNotFoundError(f"Inventory entry {inventory_id} not found.")
        if entry.farmer_id != farmer.id:
            raise PermissionDeniedError("You can only remove your own inventory.")
        await self._inv_repo.deactivate(entry)
        await self._db.commit()
        return {"message": "Inventory listing removed."}

    # ------------------------------------------------------------------ #
    # List farmer's own inventory
    # ------------------------------------------------------------------ #

    async def list_my_inventory(
        self,
        *,
        requesting_user: User,
        page: int = 1,
        page_size: int = 50,
        include_inactive: bool = False,
    ) -> PaginatedInventoryOut:
        farmer = await self._get_approved_farmer(requesting_user)
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        entries = await self._inv_repo.list_for_farmer(
            farmer_id=farmer.id,
            include_inactive=include_inactive,
            offset=offset,
            limit=page_size,
        )
        total = await self._inv_repo.count_for_farmer(
            farmer_id=farmer.id, include_inactive=include_inactive
        )
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        items = []
        for e in entries:
            mp = await self._cat_repo.get_product_by_id(e.master_product_id)
            items.append(_entry_to_out(e, master_product=mp))

        return PaginatedInventoryOut(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------ #
    # Product detail — available suppliers (for customer view)
    # ------------------------------------------------------------------ #

    async def list_suppliers_for_product(
        self,
        *,
        master_product_id: int,
        organic_only: bool = False,
    ) -> list[FarmerInventoryOut]:
        entries = await self._inv_repo.list_for_product(
            master_product_id=master_product_id,
            organic_only=organic_only,
        )
        result = []
        for e in entries:
            farmer = e.farmer
            result.append(FarmerInventoryOut(
                inventory_id=e.id,
                farmer_id=e.farmer_id,
                farmer_name=getattr(farmer, "full_name", None) if farmer else None,
                farmer_farm_name=getattr(farmer, "farm_name", None) if farmer else None,
                price=float(e.price),
                quantity=e.quantity,
                unit=e.unit,
                is_organic=e.is_organic,
                harvest_date=e.harvest_date.isoformat(),
                notes=e.notes,
            ))
        return result

    # ------------------------------------------------------------------ #
    # Best supplier selection (called from order flow)
    # ------------------------------------------------------------------ #

    async def pick_best_inventory(
        self,
        *,
        master_product_id: int,
        quantity_needed: int,
        organic_only: bool = False,
    ):
        """
        Select the cheapest available supplier with enough stock.
        Returns the FarmerInventory row or None.
        """
        entries = await self._inv_repo.list_for_product(
            master_product_id=master_product_id,
            organic_only=organic_only,
        )
        for e in entries:
            if e.quantity >= quantity_needed:
                return e
        return None

    # ------------------------------------------------------------------ #
    # Stock management (delegated from order_service)
    # ------------------------------------------------------------------ #

    async def decrement_stock(self, *, inventory_id: int, qty: int):
        updated = await self._inv_repo.decrement_stock(inventory_id=inventory_id, qty=qty)
        if updated is None:
            raise InsufficientStockError(
                f"Inventory {inventory_id} has insufficient stock."
            )
        return updated

    async def restore_stock(self, *, inventory_id: int, qty: int) -> None:
        await self._inv_repo.restore_stock(inventory_id=inventory_id, qty=qty)

    # ------------------------------------------------------------------ #
    # Catalogue listing (public — delegates to CatalogueService)
    # ------------------------------------------------------------------ #

    async def get_inventory_for_order_item(self, inventory_id: int):
        """Fetch inventory entry for validation at order creation time."""
        entry = await self._inv_repo.get_by_id(inventory_id)
        if entry is None:
            raise InventoryNotFoundError(f"Inventory {inventory_id} not found.")
        return entry
