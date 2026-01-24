"""
資産スナップショット スキーマ

チャート表示用の日次集計データ用のスキーマ定義
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AssetSnapshotBase(BaseModel):
    """資産スナップショットの基本スキーマ"""

    snapshot_date: date = Field(
        ...,
        description="スナップショット日付",
        json_schema_extra={"example": "2024-12-25"},
    )
    total_assets: Decimal = Field(
        ...,
        description="総資産額",
        json_schema_extra={"example": 4610000},
    )
    japanese_stocks: Decimal = Field(
        default=Decimal("0"),
        description="日本株合計",
        json_schema_extra={"example": 1350000},
    )
    us_stocks: Decimal = Field(
        default=Decimal("0"),
        description="米国株合計",
        json_schema_extra={"example": 1600000},
    )
    investment_trusts: Decimal = Field(
        default=Decimal("0"),
        description="投資信託合計",
        json_schema_extra={"example": 1050000},
    )
    cash: Decimal = Field(
        default=Decimal("0"),
        description="現金合計",
        json_schema_extra={"example": 610000},
    )
    holding_count: int = Field(
        default=0,
        description="保有銘柄数",
        json_schema_extra={"example": 12},
    )
    yield_rate: Decimal | None = Field(
        None,
        description="利回り（%）",
        json_schema_extra={"example": 3.24},
    )


class AssetSnapshotCreate(AssetSnapshotBase):
    """スナップショット作成用スキーマ"""

    pass


class AssetSnapshotResponse(AssetSnapshotBase):
    """スナップショットのレスポンススキーマ"""

    id: UUID = Field(..., description="スナップショットID（UUID）")
    created_at: datetime = Field(..., description="作成日時")

    model_config = ConfigDict(from_attributes=True)


class AssetSnapshotChartData(BaseModel):
    """チャート表示用データスキーマ（日/月/年切り替え対応）"""

    date: str = Field(
        ...,
        description="表示用日付文字列",
        json_schema_extra={"example": "12月"},
    )
    日本株: Decimal = Field(..., description="日本株の金額")
    米国株: Decimal = Field(..., description="米国株の金額")
    投資信託: Decimal = Field(..., description="投資信託の金額")
    現金: Decimal = Field(..., description="現金の金額")
    合計: Decimal = Field(..., description="合計金額")
