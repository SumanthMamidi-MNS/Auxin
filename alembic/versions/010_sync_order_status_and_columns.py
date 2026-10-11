"""sync live Postgres schema with the models: orderstatus values + 4 columns

Revision ID: 010_sync_order_status
Revises: 009_master_catalogue
Create Date: 2026-10-11

Why this exists
---------------
The Supabase database was built from migrations 001-006 and is missing things
the application code writes:

  * orderstatus enum only had pending/accepted/rejected/cancelled/completed.
    The order lifecycle also uses reserved, payment_pending, payment_confirmed,
    packing, ready_for_pickup, picked_up, out_for_delivery, refund_pending,
    refund_completed.  Without them POST /orders fails on Postgres.
  * orders.reservation_expires_at, orders.payment_method
  * delivery_partners.location_updated_at, delivery_partners.location_accuracy

Everything is IF NOT EXISTS, so it is safe to re-run and safe on databases that
were already patched by hand.  ALTER TYPE ... ADD VALUE is allowed inside a
transaction on PostgreSQL 12+ as long as the new value is not used in the same
transaction (it is not).

SQLite (tests/local dev) builds its schema from the models via create_all, so
this migration is a no-op there.
"""

from alembic import op

revision = "010_sync_order_status"
down_revision = "009_master_catalogue"
branch_labels = None
depends_on = None


_NEW_ORDER_STATUSES = (
    "reserved",
    "payment_pending",
    "payment_confirmed",
    "packing",
    "ready_for_pickup",
    "picked_up",
    "out_for_delivery",
    "refund_pending",
    "refund_completed",
)


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    for value in _NEW_ORDER_STATUSES:
        op.execute(f"ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS '{value}'")

    op.execute(
        "ALTER TABLE orders "
        "ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE orders "
        "ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)"
    )
    op.execute(
        "ALTER TABLE delivery_partners "
        "ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE delivery_partners "
        "ADD COLUMN IF NOT EXISTS location_accuracy DOUBLE PRECISION"
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    # Enum values cannot be removed from a PostgreSQL enum; they are left in place.
    op.execute("ALTER TABLE delivery_partners DROP COLUMN IF EXISTS location_accuracy")
    op.execute("ALTER TABLE delivery_partners DROP COLUMN IF EXISTS location_updated_at")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS payment_method")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS reservation_expires_at")
