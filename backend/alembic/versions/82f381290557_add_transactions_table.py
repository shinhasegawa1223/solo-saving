"""Add transactions table

Revision ID: 82f381290557
Revises: 001_initial_schema
Create Date: 2026-01-25 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "82f381290557"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "transactions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("transaction_type", sa.String(length=20), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("price", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("usd_jpy_rate", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False, default="JPY"),
        sa.Column("total_cost_jpy", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column(
            "transaction_date", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False
        ),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_transactions_asset_id", "transactions", ["asset_id"])
    op.create_index("idx_transactions_date", "transactions", ["transaction_date"])


def downgrade() -> None:
    op.drop_index("idx_transactions_date", table_name="transactions")
    op.drop_index("idx_transactions_asset_id", table_name="transactions")
    op.drop_table("transactions")
