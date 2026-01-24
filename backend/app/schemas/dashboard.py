"""
ダッシュボード スキーマ

統計情報とポートフォリオ用のスキーマ定義
"""

from decimal import Decimal

from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    """ダッシュボード統計情報スキーマ"""

    total_assets: Decimal = Field(
        ...,
        description="総資産額",
        json_schema_extra={"example": 4610000},
    )
    total_assets_trend: str = Field(
        ...,
        description="総資産の前月比",
        json_schema_extra={"example": "+5.2%"},
    )
    total_assets_diff: str = Field(
        ...,
        description="総資産の前月比（金額）",
        json_schema_extra={"example": "+¥100,000"},
    )

    holding_count: int = Field(
        ...,
        description="保有銘柄数",
        json_schema_extra={"example": 12},
    )
    holding_count_trend: str = Field(
        ...,
        description="銘柄数の前月比",
        json_schema_extra={"example": "+2銘柄"},
    )
    yield_rate: Decimal | None = Field(
        None,
        description="利回り（%）",
        json_schema_extra={"example": 3.24},
    )
    yield_rate_trend: str = Field(
        ...,
        description="利回りの前月比",
        json_schema_extra={"example": "+0.5%"},
    )


class PortfolioItem(BaseModel):
    """ポートフォリオ構成アイテム（円グラフ用）"""

    name: str = Field(
        ...,
        description="カテゴリ名",
        json_schema_extra={"example": "日本株"},
    )
    value: Decimal = Field(
        ...,
        description="金額",
        json_schema_extra={"example": 1350000},
    )
    percentage: Decimal = Field(
        ...,
        description="割合（%）",
        json_schema_extra={"example": 29.3},
    )
    color: str = Field(
        ...,
        description="表示色",
        json_schema_extra={"example": "indigo"},
    )
    icon: str | None = Field(
        None,
        description="アイコン名",
        json_schema_extra={"example": "Building2"},
    )
