"""add is_demo columns

Revision ID: 31675d11771f
Revises: ddafef325bad
Create Date: 2026-07-10 17:33:55

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '31675d11771f'
down_revision = 'ddafef325bad'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add is_demo column to: users, orders, products, reviews, deliveries, payments, transactions, addresses
    op.add_column('users', sa.Column('is_demo', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('orders', sa.Column('is_demo', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('products', sa.Column('is_demo', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('reviews', sa.Column('is_demo', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('deliveries', sa.Column('is_demo', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('payments', sa.Column('is_demo', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('transactions', sa.Column('is_demo', sa.Boolean(), server_default='0', nullable=False))
    op.add_column('addresses', sa.Column('is_demo', sa.Boolean(), server_default='0', nullable=False))

def downgrade() -> None:
    op.drop_column('addresses', 'is_demo')
    op.drop_column('transactions', 'is_demo')
    op.drop_column('payments', 'is_demo')
    op.drop_column('deliveries', 'is_demo')
    op.drop_column('reviews', 'is_demo')
    op.drop_column('products', 'is_demo')
    op.drop_column('orders', 'is_demo')
    op.drop_column('users', 'is_demo')
