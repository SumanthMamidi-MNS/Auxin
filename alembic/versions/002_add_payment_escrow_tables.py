"""
alembic/versions/002_add_payment_escrow_tables.py
===================================================
Migration: Add payments and transactions tables for the Payment + Escrow module.

Depends on: 001 (or the initial migration that created all prior tables).
Run with: alembic upgrade head
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision      = "002_payment_escrow"
down_revision = "001_initial_schema"   # chains from initial schema
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Enums
    # ------------------------------------------------------------------
    paymentstatus_enum = postgresql.ENUM(
        "created", "paid", "failed", "refunded",
        name="paymentstatus",
        create_type=False,
    )
    paymentstatus_enum.create(op.get_bind(), checkfirst=True)

    transactiontype_enum = postgresql.ENUM(
        "payment", "release", "refund",
        name="transactiontype",
        create_type=False,
    )
    transactiontype_enum.create(op.get_bind(), checkfirst=True)

    transactionstatus_enum = postgresql.ENUM(
        "success", "failed",
        name="transactionstatus",
        create_type=False,
    )
    transactionstatus_enum.create(op.get_bind(), checkfirst=True)

    # ------------------------------------------------------------------
    # payments table
    # ------------------------------------------------------------------
    op.create_table(
        "payments",
        sa.Column("id",                   sa.Integer(),      nullable=False),
        sa.Column("order_id",             sa.Integer(),      nullable=False),
        sa.Column("razorpay_order_id",    sa.String(255),    nullable=False),
        sa.Column("razorpay_payment_id",  sa.String(255),    nullable=True),
        sa.Column("amount",               sa.Numeric(12, 2), nullable=False),
        sa.Column("currency",             sa.String(3),      nullable=False, server_default="INR"),
        sa.Column(
            "status",
            # create_type=False: type already created by paymentstatus_enum.create() above
            postgresql.ENUM("created", "paid", "failed", "refunded",
                            name="paymentstatus", create_type=False),
            nullable=False,
            server_default="created",
        ),
        sa.Column("created_at",  sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at",  sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"],
            name="fk_payments_order_id",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint("order_id",          name="uq_payments_order_id"),
        sa.UniqueConstraint("razorpay_order_id", name="uq_payments_razorpay_order_id"),
    )
    op.create_index("ix_payments_id",             "payments", ["id"],            unique=False)
    op.create_index("ix_payments_order_id",       "payments", ["order_id"],      unique=False)
    op.create_index("ix_payments_status",         "payments", ["status"],        unique=False)
    op.create_index("ix_payments_razorpay_order_id",   "payments", ["razorpay_order_id"],   unique=False)
    op.create_index("ix_payments_razorpay_payment_id", "payments", ["razorpay_payment_id"], unique=False)

    # ------------------------------------------------------------------
    # transactions table
    # ------------------------------------------------------------------
    op.create_table(
        "transactions",
        sa.Column("id",         sa.Integer(),      nullable=False),
        sa.Column("payment_id", sa.Integer(),      nullable=False),
        sa.Column(
            "type",
            # create_type=False: type already created by transactiontype_enum.create() above
            postgresql.ENUM("payment", "release", "refund",
                            name="transactiontype", create_type=False),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "status",
            # create_type=False: type already created by transactionstatus_enum.create() above
            postgresql.ENUM("success", "failed",
                            name="transactionstatus", create_type=False),
            nullable=False,
        ),
        sa.Column("note",       sa.String(500),             nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["payment_id"], ["payments.id"],
            name="fk_transactions_payment_id",
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_transactions_id",            "transactions", ["id"],              unique=False)
    op.create_index("ix_transactions_payment_id",    "transactions", ["payment_id"],      unique=False)
    op.create_index("ix_transactions_type_status",   "transactions", ["type", "status"],  unique=False)


def downgrade() -> None:
    # Drop tables
    op.drop_index("ix_transactions_type_status",  table_name="transactions")
    op.drop_index("ix_transactions_payment_id",   table_name="transactions")
    op.drop_index("ix_transactions_id",           table_name="transactions")
    op.drop_table("transactions")

    op.drop_index("ix_payments_razorpay_payment_id", table_name="payments")
    op.drop_index("ix_payments_razorpay_order_id",   table_name="payments")
    op.drop_index("ix_payments_status",              table_name="payments")
    op.drop_index("ix_payments_order_id",            table_name="payments")
    op.drop_index("ix_payments_id",                  table_name="payments")
    op.drop_table("payments")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS transactionstatus")
    op.execute("DROP TYPE IF EXISTS transactiontype")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
