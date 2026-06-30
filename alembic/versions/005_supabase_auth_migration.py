"""
alembic/versions/005_supabase_auth_migration.py
=================================================
Phase 1: Supabase Auth Migration

Changes:
  - users table: add supabase_uid (UUID, unique, nullable), drop is_verified
  - Drop otps table (auth OTP flow replaced by Supabase Auth)
  - Drop refresh_tokens table (session management delegated to Supabase)

The supabase_uid column is nullable to support existing rows that predate
the migration. Rows are linked to Supabase on first sign-in via sync-user.
"""

import sqlalchemy as sa
from alembic import op

revision      = "005_supabase_auth"
down_revision = "004_fix_products_quantity"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # 1. Add supabase_uid to users
    op.add_column(
        "users",
        sa.Column("supabase_uid", sa.String(36), nullable=True),
    )
    op.create_index(
        "ix_users_supabase_uid",
        "users",
        ["supabase_uid"],
        unique=True,
    )

    # 2. Remove is_verified from users (Supabase owns verification state)
    op.drop_column("users", "is_verified")

    # 3. Drop refresh_tokens (session management delegated to Supabase)
    #    Must drop FK-referencing table before referenced table.
    op.drop_table("refresh_tokens")

    # 4. Drop otps (auth OTP flow replaced by Supabase Auth)
    op.drop_table("otps")


def downgrade() -> None:
    # Recreate otps table
    op.create_table(
        "otps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("otp_code", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_otps_id",    "otps", ["id"],    unique=False)
    op.create_index("ix_otps_phone", "otps", ["phone"], unique=False)

    # Recreate refresh_tokens table
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_tokens_id",      "refresh_tokens", ["id"],      unique=False)
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"], unique=False)
    op.create_index("ix_refresh_tokens_token",   "refresh_tokens", ["token"],   unique=True)

    # Restore is_verified on users
    op.add_column(
        "users",
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
    )

    # Drop supabase_uid
    op.drop_index("ix_users_supabase_uid", table_name="users")
    op.drop_column("users", "supabase_uid")
