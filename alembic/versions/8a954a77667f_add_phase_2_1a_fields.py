"""add_phase_2_1a_fields

Revision ID: 8a954a77667f
Revises: 7a954a77667f
Create Date: 2026-07-03 07:10:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "8a954a77667f"
down_revision: Union[str, None] = "7a954a77667f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.add_column("users", sa.Column("is_super_admin", sa.Boolean(), nullable=False, server_default="false"))

    # 2. farmers table
    op.add_column("farmers", sa.Column("bank_name", sa.String(length=100), nullable=True))
    op.add_column("farmers", sa.Column("account_holder_name", sa.String(length=255), nullable=True))
    op.add_column("farmers", sa.Column("upi_id", sa.String(length=100), nullable=True))

    # 3. delivery_partners table
    op.add_column("delivery_partners", sa.Column("bank_name", sa.String(length=100), nullable=True))
    op.add_column("delivery_partners", sa.Column("account_holder_name", sa.String(length=255), nullable=True))
    op.add_column("delivery_partners", sa.Column("bank_account_number", sa.String(length=512), nullable=True))
    op.add_column("delivery_partners", sa.Column("ifsc_code", sa.String(length=20), nullable=True))
    op.add_column("delivery_partners", sa.Column("upi_id", sa.String(length=100), nullable=True))
    op.add_column("delivery_partners", sa.Column("vehicle_type", sa.String(length=50), nullable=True))
    op.add_column("delivery_partners", sa.Column("vehicle_number", sa.String(length=50), nullable=True))
    op.add_column("delivery_partners", sa.Column("driving_license", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("delivery_partners", "driving_license")
    op.drop_column("delivery_partners", "vehicle_number")
    op.drop_column("delivery_partners", "vehicle_type")
    op.drop_column("delivery_partners", "upi_id")
    op.drop_column("delivery_partners", "ifsc_code")
    op.drop_column("delivery_partners", "bank_account_number")
    op.drop_column("delivery_partners", "account_holder_name")
    op.drop_column("delivery_partners", "bank_name")

    op.drop_column("farmers", "upi_id")
    op.drop_column("farmers", "account_holder_name")
    op.drop_column("farmers", "bank_name")

    op.drop_column("users", "is_super_admin")
