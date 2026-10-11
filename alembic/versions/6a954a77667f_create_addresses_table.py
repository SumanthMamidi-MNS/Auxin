"""create_addresses_table

Revision ID: 6a954a77667f
Revises: 5a954a77667e
Create Date: 2026-06-30 18:21:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "6a954a77667f"
down_revision: Union[str, None] = "5a954a77667e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "addresses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("house_flat", sa.String(length=255), nullable=False),
        sa.Column("building", sa.String(length=255), nullable=True),
        sa.Column("street", sa.String(length=255), nullable=False),
        sa.Column("area", sa.String(length=255), nullable=False),
        sa.Column("landmark", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("pin_code", sa.String(length=6), nullable=False),
        sa.Column("address_type", sa.String(length=50), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_addresses_id"), "addresses", ["id"], unique=False)
    op.create_index(op.f("ix_addresses_user_id"), "addresses", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_addresses_user_id"), table_name="addresses")
    op.drop_index(op.f("ix_addresses_id"), table_name="addresses")
    op.drop_table("addresses")
