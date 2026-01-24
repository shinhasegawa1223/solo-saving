"""
資産履歴 スキーマ

日次の価格・評価額履歴用のスキーマ定義
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AssetHistoryBase(BaseModel):
    """資産履歴の基本スキーマ"""

    asset_id: UUID = Field(..., description="資産ID（UUID）")
    record_date: date = Field(
        ...,
        description="記録日",
        json_schema_extra={"example": "2024-12-25"},
    )
    price: Decimal | None = Field(None, description="その日の価格")
    value: Decimal = Field(..., description="その日の評価額")
    quantity: Decimal | None = Field(None, description="その日の保有数量")


class AssetHistoryCreate(AssetHistoryBase):
    """資産履歴作成用スキーマ"""

    pass


class AssetHistoryResponse(AssetHistoryBase):
    """資産履歴のレスポンススキーマ"""

    id: UUID = Field(..., description="履歴ID（UUID）")
    created_at: datetime = Field(..., description="作成日時")

    model_config = ConfigDict(from_attributes=True)


class AssetHistoryChartData(BaseModel):
    """資産履歴チャート表示用スキーマ"""

    date: str = Field(
        ...,
        description="表示用日付文字列",
        json_schema_extra={"example": "01/08"},
    )
    price: Decimal | None = Field(None, description="その日の価格")
    value: Decimal = Field(..., description="その日の評価額")
