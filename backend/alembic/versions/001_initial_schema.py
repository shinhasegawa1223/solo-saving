"""Initial schema with all tables

Revision ID: 001_initial_schema
Revises:
Create Date: 2025-12-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Create asset_categories table
    op.create_table(
        "asset_categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("name_en", sa.String(length=50), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=False),
        sa.Column("icon", sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # Create assets table
    op.create_table(
        "assets",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("ticker_symbol", sa.String(length=50), nullable=True),
        sa.Column("quantity", sa.Numeric(precision=18, scale=4), nullable=False, default=0),
        sa.Column("average_cost", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("current_price", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("current_value", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False, default="JPY"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["asset_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_assets_category_id", "assets", ["category_id"])

    # Create asset_histories table
    op.create_table(
        "asset_histories",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_date", sa.Date(), nullable=False),
        sa.Column("price", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("value", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("asset_id", "record_date", name="uq_asset_history_date"),
    )
    op.create_index("idx_asset_histories_asset_id", "asset_histories", ["asset_id"])
    op.create_index("idx_asset_histories_record_date", "asset_histories", ["record_date"])

    # Create asset_snapshots table
    op.create_table(
        "asset_snapshots",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("total_assets", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column(
            "japanese_stocks",
            sa.Numeric(precision=18, scale=2),
            nullable=False,
            default=0,
        ),
        sa.Column("us_stocks", sa.Numeric(precision=18, scale=2), nullable=False, default=0),
        sa.Column(
            "investment_trusts",
            sa.Numeric(precision=18, scale=2),
            nullable=False,
            default=0,
        ),
        sa.Column("cash", sa.Numeric(precision=18, scale=2), nullable=False, default=0),
        sa.Column("holding_count", sa.Integer(), nullable=False, default=0),
        sa.Column("yield_rate", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("snapshot_date"),
    )
    op.create_index("idx_asset_snapshots_snapshot_date", "asset_snapshots", ["snapshot_date"])

    # Create savings_goals table
    op.create_table(
        "savings_goals",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("target_amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column(
            "current_amount",
            sa.Numeric(precision=18, scale=2),
            nullable=False,
            default=0,
        ),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Insert initial asset categories
    op.execute("""
        INSERT INTO asset_categories (name, name_en, color, icon) VALUES
        ('日本株', 'japanese_stocks', 'indigo', 'Building2'),
        ('米国株', 'us_stocks', 'amber', 'Globe'),
        ('投資信託', 'investment_trusts', 'emerald', 'TrendingUp'),
        ('現金', 'cash', 'slate', 'Wallet')
    """)


def downgrade() -> None:
    op.drop_table("savings_goals")
    op.drop_index("idx_asset_snapshots_snapshot_date", table_name="asset_snapshots")
    op.drop_table("asset_snapshots")
    op.drop_index("idx_asset_histories_record_date", table_name="asset_histories")
    op.drop_index("idx_asset_histories_asset_id", table_name="asset_histories")
    op.drop_table("asset_histories")
    op.drop_index("idx_assets_category_id", table_name="assets")
    op.drop_table("assets")
    op.drop_table("asset_categories")
