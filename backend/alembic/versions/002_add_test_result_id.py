"""Add test_result_id to test_sessions

Revision ID: 002_add_test_result_id
Revises: 001_initial
Create Date: 2025-09-29 12:01:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_test_result_id'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add test_result_id column to test_sessions table
    op.add_column('test_sessions', 
        sa.Column('test_result_id', sa.Integer(), nullable=True)
    )
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_test_sessions_test_result_id',
        'test_sessions', 'test_results',
        ['test_result_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remove foreign key constraint
    op.drop_constraint('fk_test_sessions_test_result_id', 'test_sessions', type_='foreignkey')
    
    # Remove column
    op.drop_column('test_sessions', 'test_result_id')