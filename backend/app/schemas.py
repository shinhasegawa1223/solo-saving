"""
Pydantic スキーマ定義

API のリクエスト/レスポンスのバリデーションを行うスキーマ。
各スキーマは対応するSQLAlchemyモデルと連携します。
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ============================================
# 資産カテゴリ スキーマ
# カテゴリマスタ（日本株、米国株、投資信託、現金）
# ============================================
class AssetCategoryBase(BaseModel):
    """資産カテゴリの基本スキーマ"""

    name: str = Field(
        ...,
        max_length=50,
        description="カテゴリ名（日本語）",
        json_schema_extra={"example": "日本株"},
    )
    name_en: str = Field(
        ...,
        max_length=50,
        description="カテゴリ名（英語）",
        json_schema_extra={"example": "japanese_stocks"},
    )
    color: str = Field(
        ...,
        max_length=20,
        description="チャート表示色",
        json_schema_extra={"example": "indigo"},
    )
    icon: str | None = Field(
        None,
        max_length=50,
        description="アイコン名（Lucide React）",
        json_schema_extra={"example": "Building2"},
    )


class AssetCategoryResponse(AssetCategoryBase):
    """資産カテゴリのレスポンススキーマ"""

    id: int = Field(..., description="カテゴリID")

    model_config = ConfigDict(from_attributes=True)


# ============================================
# 資産 スキーマ
# 個別の資産（銘柄）
# ============================================
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


# ============================================
# 資産履歴 スキーマ
# 日次の価格・評価額履歴
# ============================================
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


# ============================================
# 資産スナップショット スキーマ
# チャート表示用の日次集計データ
# ============================================
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


# ============================================
# 貯金目標 スキーマ
# 目標金額と進捗管理
# ============================================
class SavingsGoalBase(BaseModel):
    """貯金目標の基本スキーマ"""

    label: str = Field(
        ...,
        max_length=100,
        description="目標ラベル",
        json_schema_extra={"example": "目標資産額"},
    )
    target_amount: Decimal = Field(
        ...,
        description="目標金額",
        json_schema_extra={"example": 10000000},
    )
    current_amount: Decimal = Field(
        default=Decimal("0"),
        description="現在金額",
        json_schema_extra={"example": 4610000},
    )
    target_date: date | None = Field(
        None,
        description="目標達成予定日",
        json_schema_extra={"example": "2025-12-31"},
    )
    is_active: bool = Field(
        default=True,
        description="アクティブフラグ",
    )


class SavingsGoalCreate(SavingsGoalBase):
    """貯金目標作成用スキーマ"""

    pass


class SavingsGoalUpdate(BaseModel):
    """貯金目標更新用スキーマ（部分更新対応）"""

    label: str | None = Field(None, max_length=100, description="目標ラベル")
    target_amount: Decimal | None = Field(None, description="目標金額")
    current_amount: Decimal | None = Field(None, description="現在金額")
    target_date: date | None = Field(None, description="目標達成予定日")
    is_active: bool | None = Field(None, description="アクティブフラグ")


class SavingsGoalResponse(SavingsGoalBase):
    """貯金目標のレスポンススキーマ"""

    id: UUID = Field(..., description="目標ID（UUID）")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    model_config = ConfigDict(from_attributes=True)


# ============================================
# ダッシュボード スキーマ
# 統計情報とポートフォリオ
# ============================================
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
