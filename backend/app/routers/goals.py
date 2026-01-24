"""
貯金目標 ルーター

目標金額と進捗の管理
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import SavingsGoal
from app.schemas.goal import (
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsGoalUpdate,
)

goals_router = APIRouter(
    prefix="/api/goals",
    tags=["貯金目標"],
)


@goals_router.get(
    "",
    response_model=list[SavingsGoalResponse],
    summary="貯金目標一覧取得",
    description="貯金目標の一覧を取得します。",
)
async def get_goals(
    active_only: bool = Query(
        default=True,
        description="アクティブな目標のみ取得",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    貯金目標の一覧を取得。

    Args:
        active_only: Trueの場合、アクティブな目標のみ取得

    Returns:
        貯金目標一覧（作成日時の降順）
    """
    query = select(SavingsGoal)
    if active_only:
        query = query.where(SavingsGoal.is_active == True)  # noqa: E712
    query = query.order_by(SavingsGoal.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@goals_router.get(
    "/{goal_id}",
    response_model=SavingsGoalResponse,
    summary="貯金目標詳細取得",
    description="指定されたIDの貯金目標を取得します。",
)
async def get_goal(
    goal_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    単一の貯金目標を取得。

    Args:
        goal_id: 目標ID（UUID）

    Returns:
        貯金目標情報

    Raises:
        404: 目標が見つからない場合
    """
    result = await db.execute(select(SavingsGoal).where(SavingsGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="貯金目標が見つかりません")
    return goal


@goals_router.post(
    "",
    response_model=SavingsGoalResponse,
    status_code=201,
    summary="貯金目標登録",
    description="新しい貯金目標を登録します。",
)
async def create_goal(
    goal_data: SavingsGoalCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    新しい貯金目標を作成。

    Args:
        goal_data: 目標作成データ

    Returns:
        作成された貯金目標
    """
    goal = SavingsGoal(**goal_data.model_dump())
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return goal


@goals_router.put(
    "/{goal_id}",
    response_model=SavingsGoalResponse,
    summary="貯金目標更新",
    description="既存の貯金目標を更新します。",
)
async def update_goal(
    goal_id: UUID,
    goal_data: SavingsGoalUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    貯金目標を更新。

    Args:
        goal_id: 目標ID（UUID）
        goal_data: 更新データ（変更するフィールドのみ）

    Returns:
        更新された貯金目標

    Raises:
        404: 目標が見つからない場合
    """
    result = await db.execute(select(SavingsGoal).where(SavingsGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="貯金目標が見つかりません")

    update_data = goal_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.flush()
    await db.refresh(goal)
    return goal


@goals_router.delete(
    "/{goal_id}",
    status_code=204,
    summary="貯金目標削除",
    description="指定された貯金目標を削除します。",
)
async def delete_goal(
    goal_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    貯金目標を削除。

    Args:
        goal_id: 目標ID（UUID）

    Raises:
        404: 目標が見つからない場合
    """
    result = await db.execute(select(SavingsGoal).where(SavingsGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="貯金目標が見つかりません")
    await db.delete(goal)
