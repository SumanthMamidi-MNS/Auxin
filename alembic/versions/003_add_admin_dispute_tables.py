"""
alembic/versions/003_add_admin_dispute_tables.py
=================================================
Migration: Add admin_actions, disputes tables and is_suspended column to users.

Depends on: 002_payment_escrow (set down_revision below to that revision ID).
Run with: alembic upgrade head
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision      = "003_admin_dispute"
down_revision = "002_payment_escrow"   # matches 002's revision field
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Add is_suspended to users table
    # ------------------------------------------------------------------
    # is_suspended was already included in migration 001's users table DDL.
    # Using ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+) makes this idempotent
    # — safe whether the column exists from 001 or was missing.
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
        "is_suspended BOOLEAN NOT NULL DEFAULT false"
    )

    # ------------------------------------------------------------------
    # 2. Enums for admin_actions
    # ------------------------------------------------------------------
    adminactiontype_enum = postgresql.ENUM(
        "approve_farmer",
        "reject_farmer",
        "suspend_user",
        "reinstate_user",
        "resolve_dispute",
        "reject_dispute",
        name="adminactiontype",
        create_type=False,
    )
    adminactiontype_enum.create(op.get_bind(), checkfirst=True)

    # ------------------------------------------------------------------
    # 3. admin_actions table
    # ------------------------------------------------------------------
    op.create_table(
        "admin_actions",
        sa.Column("id",             sa.Integer(),                   nullable=False),
        sa.Column("admin_user_id",  sa.Integer(),                   nullable=False),
        sa.Column(
            "action_type",
            # create_type=False: type already created by adminactiontype_enum.create() above
            postgresql.ENUM(
                "approve_farmer", "reject_farmer", "suspend_user",
                "reinstate_user", "resolve_dispute", "reject_dispute",
                name="adminactiontype", create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("target_user_id", sa.Integer(),                   nullable=True),
        # Named action_metadata (not metadata) to avoid shadowing SQLAlchemy's reserved
        # DeclarativeBase.metadata attribute and the PostgreSQL reserved keyword.
        sa.Column("action_metadata", postgresql.JSONB(),              nullable=False,
                  server_default=sa.text("'{}'")),
        sa.Column("created_at",     sa.DateTime(timezone=True),     nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["admin_user_id"], ["users.id"],
            name="fk_admin_actions_admin_user_id",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["target_user_id"], ["users.id"],
            name="fk_admin_actions_target_user_id",
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_admin_actions_id",             "admin_actions", ["id"],             unique=False)
    op.create_index("ix_admin_actions_admin_user_id",  "admin_actions", ["admin_user_id"],  unique=False)
    op.create_index("ix_admin_actions_action_type",    "admin_actions", ["action_type"],    unique=False)
    op.create_index("ix_admin_actions_target_user_id", "admin_actions", ["target_user_id"], unique=False)

    # ------------------------------------------------------------------
    # 4. Enum for disputes
    # ------------------------------------------------------------------
    disputestatus_enum = postgresql.ENUM(
        "open", "in_review", "resolved", "rejected",
        name="disputestatus",
        create_type=False,
    )
    disputestatus_enum.create(op.get_bind(), checkfirst=True)

    # ------------------------------------------------------------------
    # 5. disputes table
    # ------------------------------------------------------------------
    op.create_table(
        "disputes",
        sa.Column("id",              sa.Integer(),                  nullable=False),
        sa.Column("order_id",        sa.Integer(),                  nullable=False),
        sa.Column("raised_by",       sa.Integer(),                  nullable=False),
        sa.Column("reason",          sa.Text(),                     nullable=False),
        sa.Column(
            "status",
            # create_type=False: type already created by disputestatus_enum.create() above
            postgresql.ENUM("open", "in_review", "resolved", "rejected",
                            name="disputestatus", create_type=False),
            nullable=False,
            server_default="open",
        ),
        sa.Column("resolution_note", sa.Text(),                     nullable=True),
        sa.Column("created_at",      sa.DateTime(timezone=True),    nullable=False),
        sa.Column("updated_at",      sa.DateTime(timezone=True),    nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"],
            name="fk_disputes_order_id",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["raised_by"], ["users.id"],
            name="fk_disputes_raised_by",
            ondelete="RESTRICT",
        ),
    )
    op.create_index("ix_disputes_id",       "disputes", ["id"],       unique=False)
    op.create_index("ix_disputes_order_id", "disputes", ["order_id"], unique=False)
    op.create_index("ix_disputes_status",   "disputes", ["status"],   unique=False)
    op.create_index("ix_disputes_raised_by","disputes", ["raised_by"],unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_disputes_raised_by",          table_name="disputes")
    op.drop_index("ix_disputes_status",             table_name="disputes")
    op.drop_index("ix_disputes_order_id",           table_name="disputes")
    op.drop_index("ix_disputes_id",                 table_name="disputes")
    op.drop_table("disputes")
    op.execute("DROP TYPE IF EXISTS disputestatus")

    op.drop_index("ix_admin_actions_target_user_id", table_name="admin_actions")
    op.drop_index("ix_admin_actions_action_type",    table_name="admin_actions")
    op.drop_index("ix_admin_actions_admin_user_id",  table_name="admin_actions")
    op.drop_index("ix_admin_actions_id",             table_name="admin_actions")
    op.drop_table("admin_actions")
    op.execute("DROP TYPE IF EXISTS adminactiontype")

    op.drop_column("users", "is_suspended")
