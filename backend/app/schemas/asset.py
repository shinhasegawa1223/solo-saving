"""
資産 スキーマ

個別の資産（銘柄）用のスキーマ定義
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category import AssetCategoryResponse


class AssetBase(BaseModel):
    """資産の基本スキーマ"""

    category_id: int = Field(
        ...,
        description="カテゴリID（1: 日本株, 2: 米国株, 3: 投資信託, 4: 現金）",
        json_schema_extra={"example": 1},
    )
    name: str = Field(
        ...,
        max_length=255,
        description="資産名（銘柄名など）",
        json_schema_extra={"example": "トヨタ自動車"},
    )
    ticker_symbol: str | None = Field(
        None,
        max_length=50,
        description="ティッカーシンボル",
        json_schema_extra={"example": "7203"},
    )
    quantity: Decimal = Field(
        default=Decimal("0"),
        description="保有数量",
        json_schema_extra={"example": 100},
    )
    average_cost: Decimal | None = Field(
        None,
        description="平均取得単価（円）",
        json_schema_extra={"example": 2500.00},
    )
    current_price: Decimal | None = Field(
        None,
        description="現在価格（円）",
        json_schema_extra={"example": 2800.00},
    )
    current_value: Decimal | None = Field(
        None,
        description="現在評価額（円）",
        json_schema_extra={"example": 280000.00},
    )
    currency: str = Field(
        default="JPY",
        max_length=3,
        description="通貨コード",
        json_schema_extra={"example": "JPY"},
    )


class AssetCreate(AssetBase):
    """資産作成用スキーマ"""

    pass


class AssetPurchaseRequest(BaseModel):
    """株購入リクエスト用スキーマ"""

    category_id: int = Field(
        ...,
        description="カテゴリID（1: 日本株, 2: 米国株, 3: 投資信託）",
        json_schema_extra={"example": 1},
    )
    ticker_symbol: str = Field(
        ...,
        max_length=50,
        description="ティッカーシンボル",
        json_schema_extra={"example": "7203.T"},
    )
    name: str = Field(
        ...,
        max_length=255,
        description="正式銘柄名",
        json_schema_extra={"example": "トヨタ自動車"},
    )
    quantity: Decimal = Field(
        ...,
        gt=0,
        description="購入株数",
        json_schema_extra={"example": 100},
    )
    purchase_price: Decimal = Field(
        ...,
        gt=0,
        description="購入単価",
        json_schema_extra={"example": 2500.00},
    )
    currency: str = Field(
        default="JPY",
        max_length=3,
        description="通貨コード",
        json_schema_extra={"example": "JPY"},
    )
    usd_jpy_rate: Decimal | None = Field(
        None,
        gt=0,
        description="購入時のドル円レート（米国株の場合のみ）",
        json_schema_extra={"example": 150.25},
    )
    purchase_date: date | None = Field(
        None,
        description="購入日（指定がない場合は現在日時）",
        json_schema_extra={"example": "2024-01-01"},
    )


class CashTransactionRequest(BaseModel):
    """現金入出金リクエスト用スキーマ"""

    amount: Decimal = Field(
        ...,
        gt=0,
        description="入出金額（円）",
        json_schema_extra={"example": 100000},
    )
    transaction_type: str = Field(
        ...,
        description="取引種別（deposit: 入金, withdraw: 出金）",
        json_schema_extra={"example": "deposit"},
    )
    note: str | None = Field(
        None,
        max_length=255,
        description="メモ",
        json_schema_extra={"example": "給与入金"},
    )


class AssetUpdate(BaseModel):
    """資産更新用スキーマ（部分更新対応）"""

    category_id: int | None = Field(None, description="カテゴリID")
    name: str | None = Field(None, max_length=255, description="資産名")
    ticker_symbol: str | None = Field(None, max_length=50, description="ティッカーシンボル")
    quantity: Decimal | None = Field(None, description="保有数量")
    average_cost: Decimal | None = Field(None, description="平均取得単価")
    current_price: Decimal | None = Field(None, description="現在価格")
    current_value: Decimal | None = Field(None, description="現在評価額")
    currency: str | None = Field(None, max_length=3, description="通貨コード")


class AssetResponse(AssetBase):
    """資産のレスポンススキーマ"""

    id: UUID = Field(..., description="資産ID（UUID）")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")
    category: AssetCategoryResponse | None = Field(None, description="カテゴリ情報")

    model_config = ConfigDict(from_attributes=True)
