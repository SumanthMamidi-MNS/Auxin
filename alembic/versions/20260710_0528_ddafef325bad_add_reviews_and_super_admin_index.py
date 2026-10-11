"""add_reviews_and_super_admin_index

Revision ID: ddafef325bad
Revises: 8a954a77667f
Create Date: 2026-07-10 05:28:25.899031+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ddafef325bad'
down_revision: Union[str, None] = '8a954a77667f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add unique index for super admin
    op.create_index(
        "unique_super_admin",
        "users",
        ["is_super_admin"],
        unique=True,
        postgresql_where=sa.text("is_super_admin = true"),
    )

    # 2. Add plain_otp to deliveries
    op.add_column("deliveries", sa.Column("plain_otp", sa.String(length=6), nullable=True))

    # 3. Create reviews table
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("farmer_id", sa.Integer(), nullable=False),
        sa.Column("delivery_partner_id", sa.Integer(), nullable=True),
        sa.Column("farmer_rating", sa.Integer(), nullable=False),
        sa.Column("farmer_review", sa.Text(), nullable=True),
        sa.Column("delivery_rating", sa.Integer(), nullable=True),
        sa.Column("delivery_review", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["farmer_id"], ["farmers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["delivery_partner_id"], ["delivery_partners.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("order_id"),
        sa.CheckConstraint("farmer_rating >= 1 AND farmer_rating <= 5", name="check_farmer_rating_range"),
        sa.CheckConstraint("delivery_rating IS NULL OR (delivery_rating >= 1 AND delivery_rating <= 5)", name="check_delivery_rating_range"),
    )


def downgrade() -> None:
    op.drop_table("reviews")
    op.drop_column("deliveries", "plain_otp")
    op.drop_index("unique_super_admin", table_name="users", postgresql_where=sa.text("is_super_admin = true"))
