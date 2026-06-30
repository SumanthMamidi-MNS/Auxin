"""
alembic/versions/006_add_user_status.py
========================================
Phase 1 — User Status Field

Changes:
  - Add `userstatus` enum type: pending | approved | rejected | suspended
  - Add `status` column to users table
  - Backfill: is_suspended=True → suspended, else → approved
  - Drop `is_suspended` column
  - Drop `is_active` column (replaced by status=approved)

Rationale:
  Two boolean flags (is_active, is_suspended) are replaced with a single
  authoritative status enum that maps cleanly to the approval workflow:
    customers / admins  → approved on registration
    farmers / delivery  → pending until admin approves
"""

import sqlalchemy as sa
from alembic import op

revision      = "006_add_user_status"
down_revision = "005_supabase_auth"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # 1. Create enum only if it doesn't already exist
    op.execute("""
    DO $$
    BEGIN
        CREATE TYPE userstatus AS ENUM (
            'pending',
            'approved',
            'rejected',
            'suspended'
        );
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END $$;
    """)

    # 2. Add status column (nullable first, then set default and make non-null)
    op.add_column(
        "users",
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", "suspended", name="userstatus"),
            nullable=True,
        ),
    )

    # 3. Backfill:
    #    - Rows with is_suspended=TRUE  → 'suspended'
    #    - All others                   → 'approved'
    op.execute(
        """
        UPDATE users
        SET status = CASE
            WHEN is_suspended = TRUE THEN 'suspended'::userstatus
            ELSE 'approved'::userstatus
        END
        """
    )

    # 4. Make status NOT NULL with default 'approved'
    op.alter_column(
        "users",
        "status",
        nullable=False,
        server_default="approved",
    )

    # 5. Drop obsolete columns
    op.drop_column("users", "is_suspended")
    op.drop_column("users", "is_active")


def downgrade() -> None:
    # Restore is_active and is_suspended columns
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "users",
        sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default="false"),
    )

    # Backfill from status
    op.execute(
        """
        UPDATE users
        SET
            is_active    = (status = 'approved'),
            is_suspended = (status = 'suspended')
        """
    )

    # Drop status column
    op.drop_column("users", "status")

    # Drop the enum type
    op.execute("DROP TYPE userstatus")
