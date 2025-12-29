"""
Solo Saving API ルーター

各機能ごとに分割されたAPIエンドポイントを定義します。
- 資産カテゴリ: マスタデータの取得
- 資産: 個別銘柄のCRUD操作
- スナップショット: チャート表示用の日次データ
- 貯金目標: 目標設定と進捗管理
- ダッシュボード: 統計情報とポートフォリオ
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Asset, AssetCategory, AssetSnapshot, SavingsGoal
from app.schemas import (
    AssetCategoryResponse,
    AssetCreate,
    AssetResponse,
    AssetSnapshotChartData,
    AssetSnapshotCreate,
    AssetSnapshotResponse,
    AssetUpdate,
    DashboardStats,
    PortfolioItem,
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsGoalUpdate,
)

# ============================================
# 資産カテゴリ ルーター
# マスタデータ（日本株、米国株、投資信託、現金）の取得
# ============================================
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


# ============================================
# 資産 ルーター
# 個別銘柄の登録・更新・削除・取得
# ============================================
assets_router = APIRouter(
    prefix="/api/assets",
    tags=["資産"],
)


@assets_router.get(
    "",
    response_model=list[AssetResponse],
    summary="資産一覧取得",
    description="すべての資産を取得します。カテゴリIDで絞り込み可能。",
)
async def get_assets(
    category_id: int | None = Query(
        default=None,
        description="カテゴリIDで絞り込み（1: 日本株, 2: 米国株, 3: 投資信託, 4: 現金）",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    資産一覧を取得。

    Args:
        category_id: カテゴリIDで絞り込み（オプション）

    Returns:
        資産一覧（作成日時の降順）
    """
    query = select(Asset).options(selectinload(Asset.category))
    if category_id:
        query = query.where(Asset.category_id == category_id)
    query = query.order_by(Asset.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@assets_router.get(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="資産詳細取得",
    description="指定されたIDの資産を取得します。",
)
async def get_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    単一の資産を取得。

    Args:
        asset_id: 資産ID（UUID）

    Returns:
        資産情報

    Raises:
        404: 資産が見つからない場合
    """
    result = await db.execute(
        select(Asset).options(selectinload(Asset.category)).where(Asset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="資産が見つかりません")
    return asset


@assets_router.post(
    "",
    response_model=AssetResponse,
    status_code=201,
    summary="資産登録",
    description="新しい資産を登録します。",
)
async def create_asset(
    asset_data: AssetCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    新しい資産を作成。

    Args:
        asset_data: 資産作成データ

    Returns:
        作成された資産情報
    """
    asset = Asset(**asset_data.model_dump())
    db.add(asset)
    await db.flush()
    await db.refresh(asset, ["category"])
    return asset


@assets_router.put(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="資産更新",
    description="既存の資産を更新します。",
)
async def update_asset(
    asset_id: UUID,
    asset_data: AssetUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    既存の資産を更新。

    Args:
        asset_id: 資産ID（UUID）
        asset_data: 更新データ（変更するフィールドのみ）

    Returns:
        更新された資産情報

    Raises:
        404: 資産が見つからない場合
    """
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="資産が見つかりません")

    update_data = asset_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)

    await db.flush()
    await db.refresh(asset, ["category"])
    return asset


@assets_router.delete(
    "/{asset_id}",
    status_code=204,
    summary="資産削除",
    description="指定された資産を削除します。",
)
async def delete_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    資産を削除。

    Args:
        asset_id: 資産ID（UUID）

    Raises:
        404: 資産が見つからない場合
    """
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="資産が見つかりません")
    await db.delete(asset)


# ============================================
# スナップショット ルーター
# 日次の資産スナップショット（チャート表示用データ）
# ============================================
snapshots_router = APIRouter(
    prefix="/api/snapshots",
    tags=["スナップショット"],
)


@snapshots_router.get(
    "",
    response_model=list[AssetSnapshotResponse],
    summary="スナップショット一覧取得",
    description="資産スナップショットを取得します。日付で絞り込み可能。",
)
async def get_snapshots(
    start_date: date | None = Query(
        default=None,
        description="開始日（この日以降のデータを取得）",
    ),
    end_date: date | None = Query(
        default=None,
        description="終了日（この日以前のデータを取得）",
    ),
    limit: int = Query(
        default=30,
        le=365,
        description="取得件数（最大365件）",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    スナップショット一覧を取得。

    Args:
        start_date: 開始日フィルター
        end_date: 終了日フィルター
        limit: 取得件数上限

    Returns:
        スナップショット一覧（日付の降順）
    """
    query = select(AssetSnapshot)
    if start_date:
        query = query.where(AssetSnapshot.snapshot_date >= start_date)
    if end_date:
        query = query.where(AssetSnapshot.snapshot_date <= end_date)
    query = query.order_by(AssetSnapshot.snapshot_date.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@snapshots_router.get(
    "/chart",
    response_model=list[AssetSnapshotChartData],
    summary="チャートデータ取得",
    description="チャート表示用のデータを取得します。日/月/年で集計期間を選択可能。",
)
async def get_chart_data(
    period: Literal["day", "month", "year"] = Query(
        default="month",
        description="集計期間: day（直近30日）, month（直近12ヶ月）, year（直近5年）",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    チャート表示用の集計データを取得。

    Args:
        period: 集計期間
            - "day": 直近30日の日次データ
            - "month": 直近12ヶ月の月末データ
            - "year": 直近5年の年末データ

    Returns:
        チャート用データ（日本株、米国株、投資信託、現金、合計）
    """
    today = date.today()

    if period == "day":
        # 日次データ - 直近30日
        start_date = today - timedelta(days=30)
        query = (
            select(AssetSnapshot)
            .where(AssetSnapshot.snapshot_date >= start_date)
            .order_by(AssetSnapshot.snapshot_date)
        )
        result = await db.execute(query)
        snapshots = result.scalars().all()

        return [
            AssetSnapshotChartData(
                date=s.snapshot_date.strftime("%m/%d"),
                日本株=s.japanese_stocks,
                米国株=s.us_stocks,
                投資信託=s.investment_trusts,
                現金=s.cash,
                合計=s.total_assets,
            )
            for s in snapshots
        ]

    elif period == "month":
        # 月次データ - 直近12ヶ月の月末データ
        start_date = today.replace(day=1) - timedelta(days=365)
        query = select(AssetSnapshot).where(AssetSnapshot.snapshot_date >= start_date)
        result = await db.execute(query)
        snapshots = result.scalars().all()

        # 各月の最終日を抽出
        monthly_data: dict[str, AssetSnapshot] = {}
        for s in snapshots:
            month_key = s.snapshot_date.strftime("%Y-%m")
            if (
                month_key not in monthly_data
                or s.snapshot_date > monthly_data[month_key].snapshot_date
            ):
                monthly_data[month_key] = s

        sorted_months = sorted(monthly_data.keys())
        return [
            AssetSnapshotChartData(
                date=f"{int(monthly_data[m].snapshot_date.month)}月",
                日本株=monthly_data[m].japanese_stocks,
                米国株=monthly_data[m].us_stocks,
                投資信託=monthly_data[m].investment_trusts,
                現金=monthly_data[m].cash,
                合計=monthly_data[m].total_assets,
            )
            for m in sorted_months[-12:]
        ]

    else:  # year
        # 年次データ - 直近5年の年末データ
        start_year = today.year - 5
        query = select(AssetSnapshot).where(AssetSnapshot.snapshot_date >= date(start_year, 1, 1))
        result = await db.execute(query)
        snapshots = result.scalars().all()

        # 各年の最終日を抽出
        yearly_data: dict[int, AssetSnapshot] = {}
        for s in snapshots:
            year = s.snapshot_date.year
            if year not in yearly_data or s.snapshot_date > yearly_data[year].snapshot_date:
                yearly_data[year] = s

        sorted_years = sorted(yearly_data.keys())
        return [
            AssetSnapshotChartData(
                date=str(year),
                日本株=yearly_data[year].japanese_stocks,
                米国株=yearly_data[year].us_stocks,
                投資信託=yearly_data[year].investment_trusts,
                現金=yearly_data[year].cash,
                合計=yearly_data[year].total_assets,
            )
            for year in sorted_years[-5:]
        ]


@snapshots_router.post(
    "",
    response_model=AssetSnapshotResponse,
    status_code=201,
    summary="スナップショット登録",
    description="新しいスナップショットを登録します。同一日付は重複不可。",
)
async def create_snapshot(
    snapshot_data: AssetSnapshotCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    新しいスナップショットを作成。

    Args:
        snapshot_data: スナップショット作成データ

    Returns:
        作成されたスナップショット

    Raises:
        400: 同一日付のスナップショットが既に存在する場合
    """
    # 同一日付の重複チェック
    result = await db.execute(
        select(AssetSnapshot).where(AssetSnapshot.snapshot_date == snapshot_data.snapshot_date)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"{snapshot_data.snapshot_date} のスナップショットは既に存在します",
        )

    snapshot = AssetSnapshot(**snapshot_data.model_dump())
    db.add(snapshot)
    await db.flush()
    await db.refresh(snapshot)
    return snapshot


@snapshots_router.get(
    "/latest",
    response_model=AssetSnapshotResponse | None,
    summary="最新スナップショット取得",
    description="最新のスナップショットを取得します。",
)
async def get_latest_snapshot(db: AsyncSession = Depends(get_db)):
    """
    最新のスナップショットを取得。

    Returns:
        最新のスナップショット（存在しない場合は null）
    """
    result = await db.execute(
        select(AssetSnapshot).order_by(AssetSnapshot.snapshot_date.desc()).limit(1)
    )
    return result.scalar_one_or_none()


# ============================================
# 貯金目標 ルーター
# 目標金額と進捗の管理
# ============================================
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


# ============================================
# ダッシュボード ルーター
# 統計情報とポートフォリオ構成
# ============================================
dashboard_router = APIRouter(
    prefix="/api/dashboard",
    tags=["ダッシュボード"],
)


@dashboard_router.get(
    "/stats",
    response_model=DashboardStats,
    summary="統計情報取得",
    description="ダッシュボードに表示する統計情報を取得します。",
)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    ダッシュボードの統計情報を取得。

    以下の情報を返します:
    - 総資産額と前月比の増減率
    - 保有銘柄数と前月比の増減
    - 利回りと前月比の増減

    Returns:
        統計情報
    """
    # 最新のスナップショットとその1つ前を取得
    snapshots_result = await db.execute(
        select(AssetSnapshot).order_by(AssetSnapshot.snapshot_date.desc()).limit(2)
    )
    snapshots = snapshots_result.scalars().all()

    # データがない場合のデフォルト値
    if not snapshots:
        return DashboardStats(
            total_assets=Decimal("0"),
            total_assets_trend="+0%",
            total_assets_diff="+¥0",
            holding_count=0,
            holding_count_trend="+0",
            yield_rate=None,
            yield_rate_trend="+0%",
        )

    latest = snapshots[0]
    prev = snapshots[1] if len(snapshots) > 1 else None

    # トレンド（前回比）を計算
    total_trend = "+0%"
    total_diff = "+¥0"
    holding_trend = "+0"
    yield_trend = "+0%"

    if prev:
        # 総資産の増減率と金額差分
        diff_val = latest.total_assets - prev.total_assets
        total_diff = f"{'+' if diff_val >= 0 else ''}¥{diff_val:,.0f}"

        if prev.total_assets > 0:
            pct = (diff_val / prev.total_assets) * 100
            total_trend = f"{'+' if pct >= 0 else ''}{pct:.1f}%"

        # 保有銘柄数の増減
        holding_diff = latest.holding_count - prev.holding_count
        holding_trend = f"{'+' if holding_diff >= 0 else ''}{holding_diff}銘柄"

        # 利回りの増減
        if prev.yield_rate is not None and latest.yield_rate is not None:
            yield_diff = latest.yield_rate - prev.yield_rate
            yield_trend = f"{'+' if yield_diff >= 0 else ''}{yield_diff:.2f}%"

    return DashboardStats(
        total_assets=latest.total_assets,
        total_assets_trend=total_trend,
        total_assets_diff=total_diff,
        holding_count=latest.holding_count,
        holding_count_trend=holding_trend,
        yield_rate=latest.yield_rate,
        yield_rate_trend=yield_trend,
    )


@dashboard_router.get(
    "/portfolio",
    response_model=list[PortfolioItem],
    summary="ポートフォリオ構成取得",
    description="円グラフ表示用のポートフォリオ構成を取得します。",
)
async def get_portfolio(db: AsyncSession = Depends(get_db)):
    """
    ポートフォリオ構成を取得（円グラフ用）。

    最新のスナップショットから各カテゴリの割合を計算します。

    Returns:
        ポートフォリオアイテムのリスト（名前、金額、割合、色、アイコン）
    """
    # 最新のスナップショットを取得
    result = await db.execute(
        select(AssetSnapshot).order_by(AssetSnapshot.snapshot_date.desc()).limit(1)
    )
    snapshot = result.scalar_one_or_none()

    if not snapshot:
        return []

    total = snapshot.total_assets
    if total == 0:
        return []

    # カテゴリ情報を取得
    categories_result = await db.execute(select(AssetCategory))
    categories = {c.name_en: c for c in categories_result.scalars().all()}

    # ポートフォリオアイテムを作成
    portfolio = [
        PortfolioItem(
            name="日本株",
            value=snapshot.japanese_stocks,
            percentage=(snapshot.japanese_stocks / total) * 100,
            color=categories.get("japanese_stocks", AssetCategory(color="indigo")).color,
            icon=categories.get("japanese_stocks", AssetCategory(icon="Building2")).icon,
        ),
        PortfolioItem(
            name="米国株",
            value=snapshot.us_stocks,
            percentage=(snapshot.us_stocks / total) * 100,
            color=categories.get("us_stocks", AssetCategory(color="amber")).color,
            icon=categories.get("us_stocks", AssetCategory(icon="Globe")).icon,
        ),
        PortfolioItem(
            name="投資信託",
            value=snapshot.investment_trusts,
            percentage=(snapshot.investment_trusts / total) * 100,
            color=categories.get("investment_trusts", AssetCategory(color="emerald")).color,
            icon=categories.get("investment_trusts", AssetCategory(icon="TrendingUp")).icon,
        ),
        PortfolioItem(
            name="現金",
            value=snapshot.cash,
            percentage=(snapshot.cash / total) * 100,
            color=categories.get("cash", AssetCategory(color="slate")).color,
            icon=categories.get("cash", AssetCategory(icon="Wallet")).icon,
        ),
    ]

    # 金額が0より大きいもののみ返す
    return [p for p in portfolio if p.value > 0]
