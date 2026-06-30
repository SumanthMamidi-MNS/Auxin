"""
alembic/versions/001_initial_schema.py
=======================================
Initial schema: creates all core tables for Auxin.
Covers: users, otps, refresh_tokens, farmers, products,
        orders, order_items, delivery_partners, deliveries.

Payments (002) and admin/disputes (003) are handled in
subsequent migrations.

Run with: alembic upgrade head
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Alembic revision chain
revision      = "001_initial_schema"
down_revision = None           # ← this is the root migration
branch_labels = None
depends_on    = None


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:

    # ── Enums ────────────────────────────────────────────────────────────────

    userrole_enum = postgresql.ENUM(
        "farmer", "customer", "delivery", "admin",
        name="userrole",
        create_type=False,
    )
    userrole_enum.create(op.get_bind(), checkfirst=True)

    orderstatus_enum = postgresql.ENUM(
        "pending", "accepted", "rejected", "cancelled", "completed",
        name="orderstatus",
        create_type=False,
    )
    orderstatus_enum.create(op.get_bind(), checkfirst=True)

    deliverystatus_enum = postgresql.ENUM(
        # IMPORTANT: "pending" must be first — it is the ORM default.
        # The original migration was missing this value, causing PostgreSQL
        # enum constraint violations on every new Delivery insert.
        "pending", "assigned", "picked_up", "out_for_delivery", "delivered", "failed",
        name="deliverystatus",
        create_type=False,
    )
    deliverystatus_enum.create(op.get_bind(), checkfirst=True)

    # ── users ─────────────────────────────────────────────────────────────────

    op.create_table(
        "users",
        sa.Column("id",           sa.Integer(),                  nullable=False),
        sa.Column("name",         sa.String(255),                nullable=False),
        sa.Column("phone",        sa.String(20),                 nullable=False),
        sa.Column("email",        sa.String(255),                nullable=True),
        sa.Column(
            "role",
            # Use postgresql.ENUM(create_type=False) — the type was already created
            # above via userrole_enum.create(). sa.Enum() would try to CREATE TYPE
            # again here and raise DuplicateObjectError.
            postgresql.ENUM("farmer", "customer", "delivery", "admin",
                            name="userrole", create_type=False),
            nullable=False,
            server_default="customer",
        ),
        sa.Column("is_active",    sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_verified",  sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at",   sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id",    "users", ["id"],    unique=False)
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── otps ─────────────────────────────────────────────────────────────────

    op.create_table(
        "otps",
        sa.Column("id",          sa.Integer(),               nullable=False),
        sa.Column("phone",       sa.String(20),              nullable=False),
        sa.Column("hashed_otp",  sa.String(255),             nullable=False),
        sa.Column("created_at",  sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("expires_at",  sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_used",     sa.Boolean(),               nullable=False,
                  server_default=sa.text("false")),
        sa.Column("attempts",    sa.Integer(),               nullable=False,
                  server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_otps_id",    "otps", ["id"],    unique=False)
    op.create_index("ix_otps_phone", "otps", ["phone"], unique=False)

    # ── refresh_tokens ────────────────────────────────────────────────────────

    op.create_table(
        "refresh_tokens",
        sa.Column("id",         sa.Integer(),               nullable=False),
        sa.Column("user_id",    sa.Integer(),               nullable=False),
        sa.Column("token",      sa.String(255),             nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_revoked", sa.Boolean(),               nullable=False,
                  server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"],
            name="fk_refresh_tokens_user_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("token", name="uq_refresh_tokens_token"),
    )
    op.create_index("ix_refresh_tokens_id",      "refresh_tokens", ["id"],      unique=False)
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"], unique=False)
    op.create_index("ix_refresh_tokens_token",   "refresh_tokens", ["token"],   unique=True)

    # ── farmers ───────────────────────────────────────────────────────────────

    op.create_table(
        "farmers",
        sa.Column("id",          sa.Integer(),               nullable=False),
        sa.Column("user_id",     sa.Integer(),               nullable=False),
        sa.Column("full_name",   sa.String(255),             nullable=False),
        sa.Column("phone",       sa.String(20),              nullable=False),
        sa.Column("location",    sa.String(512),             nullable=False),
        sa.Column("ifsc_code",   sa.String(20),              nullable=False),
        # Stored encrypted via app.core.encryption. Column name matches ORM model.
        sa.Column("bank_account_number",    sa.String(512),    nullable=False),
        sa.Column("is_approved", sa.Boolean(),               nullable=False,
                  server_default=sa.text("false")),
        sa.Column("created_at",  sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"],
            name="fk_farmers_user_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("user_id", name="uq_farmers_user_id"),
    )
    op.create_index("ix_farmers_id",          "farmers", ["id"],          unique=False)
    op.create_index("ix_farmers_user_id",     "farmers", ["user_id"],     unique=True)
    op.create_index("ix_farmers_is_approved", "farmers", ["is_approved"], unique=False)

    # ── products ──────────────────────────────────────────────────────────────

    op.create_table(
        "products",
        sa.Column("id",           sa.Integer(),               nullable=False),
        sa.Column("farmer_id",    sa.Integer(),               nullable=False),
        sa.Column("name",         sa.String(255),             nullable=False),
        sa.Column("description",  sa.Text(),                  nullable=False),
        sa.Column("price",        sa.Numeric(10, 2),          nullable=False),
        sa.Column("stock",        sa.Integer(),               nullable=False),
        sa.Column("unit",         sa.String(50),              nullable=False),
        sa.Column("harvest_date", sa.Date(),                  nullable=False),
        sa.Column("image_url",    sa.Text(),                  nullable=True),
        sa.Column("is_active",    sa.Boolean(),               nullable=False,
                  server_default=sa.text("true")),
        sa.Column("created_at",   sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at",   sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["farmer_id"], ["farmers.id"],
            name="fk_products_farmer_id",
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_products_id",        "products", ["id"],        unique=False)
    op.create_index("ix_products_farmer_id", "products", ["farmer_id"], unique=False)
    op.create_index("ix_products_is_active", "products", ["is_active"], unique=False)

    # ── orders ────────────────────────────────────────────────────────────────

    op.create_table(
        "orders",
        sa.Column("id",           sa.Integer(),               nullable=False),
        sa.Column("customer_id",  sa.Integer(),               nullable=False),
        sa.Column("farmer_id",    sa.Integer(),               nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2),          nullable=False),
        sa.Column(
            "status",
            # Use postgresql.ENUM(create_type=False) — type already created above.
            postgresql.ENUM("pending", "accepted", "rejected", "cancelled", "completed",
                            name="orderstatus", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at",   sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at",   sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["users.id"],
            name="fk_orders_customer_id",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["farmer_id"], ["farmers.id"],
            name="fk_orders_farmer_id",
            ondelete="RESTRICT",
        ),
    )
    op.create_index("ix_orders_id",          "orders", ["id"],          unique=False)
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"], unique=False)
    op.create_index("ix_orders_farmer_id",   "orders", ["farmer_id"],   unique=False)
    op.create_index("ix_orders_status",      "orders", ["status"],      unique=False)
    op.create_index(
        "ix_orders_customer_id_status", "orders",
        ["customer_id", "status"], unique=False,
    )
    op.create_index(
        "ix_orders_farmer_id_status", "orders",
        ["farmer_id", "status"], unique=False,
    )

    # ── order_items ───────────────────────────────────────────────────────────

    op.create_table(
        "order_items",
        sa.Column("id",                  sa.Integer(),      nullable=False),
        sa.Column("order_id",            sa.Integer(),      nullable=False),
        sa.Column("product_id",          sa.Integer(),      nullable=False),
        sa.Column("quantity",            sa.Integer(),      nullable=False),
        sa.Column("price_at_order_time", sa.Numeric(10, 2), nullable=False),
        sa.Column("subtotal",            sa.Numeric(12, 2), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"],
            name="fk_order_items_order_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"], ["products.id"],
            name="fk_order_items_product_id",
            ondelete="RESTRICT",
        ),
    )
    op.create_index("ix_order_items_id",         "order_items", ["id"],         unique=False)
    op.create_index("ix_order_items_order_id",   "order_items", ["order_id"],   unique=False)
    op.create_index("ix_order_items_product_id", "order_items", ["product_id"], unique=False)

    # ── delivery_partners ─────────────────────────────────────────────────────

    op.create_table(
        "delivery_partners",
        sa.Column("id",            sa.Integer(),               nullable=False),
        sa.Column("user_id",       sa.Integer(),               nullable=False),
        # Added to match DeliveryPartner ORM model — were missing in original migration
        sa.Column("full_name",     sa.String(255),             nullable=False),
        sa.Column("phone",         sa.String(20),              nullable=False),
        sa.Column("is_active",     sa.Boolean(),               nullable=False,
                  server_default=sa.text("true")),
        sa.Column("is_available",  sa.Boolean(),               nullable=False,
                  server_default=sa.text("false")),
        sa.Column("current_latitude",   sa.Float(),            nullable=True),
        sa.Column("current_longitude",  sa.Float(),            nullable=True),
        sa.Column("created_at",    sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"],
            name="fk_delivery_partners_user_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("user_id", name="uq_delivery_partners_user_id"),
    )
    op.create_index("ix_delivery_partners_id",      "delivery_partners", ["id"],      unique=False)
    op.create_index("ix_delivery_partners_user_id", "delivery_partners", ["user_id"], unique=True)

    # ── deliveries ────────────────────────────────────────────────────────────

    op.create_table(
        "deliveries",
        sa.Column("id",                       sa.Integer(),               nullable=False),
        sa.Column("order_id",                 sa.Integer(),               nullable=False),
        # Renamed from partner_id → delivery_partner_id to match the ORM model
        sa.Column("delivery_partner_id",      sa.Integer(),               nullable=True),
        sa.Column(
            "status",
            # Use postgresql.ENUM(create_type=False) — type already created above.
            postgresql.ENUM(
                "pending", "assigned", "picked_up", "out_for_delivery", "delivered", "failed",
                name="deliverystatus", create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
        # OTP stored bcrypt-hashed (column name from ORM: otp_code)
        sa.Column("otp_code",                 sa.String(255),             nullable=True),
        sa.Column("otp_expires_at",           sa.DateTime(timezone=True), nullable=True),
        # Destination coordinates (ORM names: destination_latitude / destination_longitude)
        sa.Column("destination_latitude",     sa.Float(),                 nullable=True),
        sa.Column("destination_longitude",    sa.Float(),                 nullable=True),
        # Lifecycle timestamps (match ORM mapped_column names)
        sa.Column("assigned_at",              sa.DateTime(timezone=True), nullable=True),
        sa.Column("picked_up_at",             sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at",             sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",               sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"],
            name="fk_deliveries_order_id",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["delivery_partner_id"], ["delivery_partners.id"],
            name="fk_deliveries_delivery_partner_id",
            ondelete="SET NULL",
        ),
        sa.UniqueConstraint("order_id", name="uq_deliveries_order_id"),
    )
    op.create_index("ix_deliveries_id",                  "deliveries", ["id"],                  unique=False)
    op.create_index("ix_deliveries_order_id",            "deliveries", ["order_id"],            unique=True)
    op.create_index("ix_deliveries_delivery_partner_id", "deliveries", ["delivery_partner_id"], unique=False)
    op.create_index("ix_deliveries_status",              "deliveries", ["status"],              unique=False)


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:
    op.drop_table("deliveries")
    op.drop_table("delivery_partners")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("products")
    op.drop_table("farmers")
    op.drop_table("refresh_tokens")
    op.drop_table("otps")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS deliverystatus")
    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
