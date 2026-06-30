"""
alembic/versions/004_rename_products_stock_to_quantity.py
===========================================================
Schema correction: rename products.stock → products.quantity

Root cause
----------
The initial migration (001) created the column as "stock" while the
SQLAlchemy ORM model (app/models/product.py) maps it as "quantity".
This mismatch caused:

    asyncpg.exceptions.UndefinedColumnError: column products.quantity does not exist

Every call to GET /products and GET /products/{id} returned HTTP 500.

Fix
---
Rename the column in-place.  No data is touched, no constraints change.
The renamed column immediately satisfies the ORM mapping.
"""

from alembic import op

revision      = "004_fix_products_quantity"
down_revision = "003_admin_dispute"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # Rename stock → quantity to match ORM model (app/models/product.py line 53)
    op.alter_column("products", "stock", new_column_name="quantity")


def downgrade() -> None:
    op.alter_column("products", "quantity", new_column_name="stock")
