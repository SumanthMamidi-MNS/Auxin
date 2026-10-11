"""add_approval_fields

Revision ID: 7a954a77667f
Revises: 6a954a77667f
Create Date: 2026-07-01 16:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7a954a77667f"
down_revision: Union[str, None] = "6a954a77667f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("approved_by", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("rejection_reason", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "rejection_reason")
    op.drop_column("users", "rejected_at")
    op.drop_column("users", "approved_at")
    op.drop_column("users", "approved_by")
