"""enable Row Level Security on every application table

Revision ID: 011_enable_rls
Revises: 010_sync_order_status
Create Date: 2026-10-11

Why
---
Supabase exposes every table in the ``public`` schema through PostgREST to the
``anon`` / ``authenticated`` roles.  The anon key is public by design (it ships
in the browser bundle), so any table without RLS is readable and writable by
anyone on the internet — including users, orders, payments, farmer bank fields
and ``deliveries.plain_otp``.

Auxin's data model is backend-only:
  * the FastAPI service connects as ``postgres`` (BYPASSRLS), and
  * the frontends use Supabase **Auth** only — they never query tables.

So enabling RLS with *no* policies is the correct least-privilege setting: the
backend keeps full access and the PostgREST roles get nothing.

Milo's ``documents`` / ``document_chunks`` carried a policy of ``USING (true)``
for role ``public`` — effectively no protection.  They are dropped here; the
Milo service reads them with the service-role key, which bypasses RLS.

Safe to re-run.  Postgres-only; a no-op on SQLite.
Review before applying: this changes access on a live database.
"""

from alembic import op

revision = "011_enable_rls"
down_revision = "010_sync_order_status"
branch_labels = None
depends_on = None


_APP_TABLES = (
    "alembic_version",
    "users",
    "farmers",
    "products",
    "orders",
    "order_items",
    "delivery_partners",
    "deliveries",
    "payments",
    "transactions",
    "admin_actions",
    "disputes",
    "addresses",
    "reviews",
    # created by migration 009
    "master_categories",
    "master_products",
    "farmer_inventory",
    # Milo RAG store (managed outside Alembic)
    "documents",
    "document_chunks",
)

_PERMISSIVE_POLICIES = (
    ("documents", "Allow full access to documents"),
    ("document_chunks", "Allow full access to document_chunks"),
)


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    for table in _APP_TABLES:
        op.execute(
            f"""
            DO $$
            BEGIN
              IF to_regclass('public.{table}') IS NOT NULL THEN
                ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
              END IF;
            END $$;
            """
        )

    for table, policy in _PERMISSIVE_POLICIES:
        op.execute(
            f"""
            DO $$
            BEGIN
              IF to_regclass('public.{table}') IS NOT NULL THEN
                DROP POLICY IF EXISTS "{policy}" ON public.{table};
              END IF;
            END $$;
            """
        )


def downgrade() -> None:
    # Intentionally conservative: re-opening tables to the public anon key is
    # never the right rollback.  Disable RLS manually if you really need to.
    pass
