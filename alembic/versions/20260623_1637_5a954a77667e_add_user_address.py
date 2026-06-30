"""add_user_address

Revision ID: 5a954a77667e
Revises: 006_add_user_status
Create Date: 2026-06-23 16:37:42.651319+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a954a77667e'
down_revision: Union[str, None] = '006_add_user_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("address", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "address")

