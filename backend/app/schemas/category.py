"""
資産カテゴリ スキーマ

カテゴリマスタ（日本株、米国株、投資信託、現金）用のスキーマ定義
"""

from pydantic import BaseModel, ConfigDict, Field


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
