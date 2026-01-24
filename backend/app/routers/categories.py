"""
資産カテゴリ ルーター

マスタデータ（日本株、米国株、投資信託、現金）の取得
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AssetCategory
from app.schemas.category import AssetCategoryResponse

categories_router = APIRouter(
    prefix="/api/categories",
    tags=["資産カテゴリ"],
)


@categories_router.get(
    "",
    response_model=list[AssetCategoryResponse],
    summary="カテゴリ一覧取得",
    description="すべての資産カテゴリを取得します。",
)
async def get_categories(db: AsyncSession = Depends(get_db)):
    """
    資産カテゴリの一覧を取得。

    Returns:
        カテゴリ一覧（日本株、米国株、投資信託、現金）
    """
    result = await db.execute(select(AssetCategory).order_by(AssetCategory.id))
    return result.scalars().all()
