"""
貯金目標 スキーマ

目標金額と進捗管理用のスキーマ定義
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


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
