"""
Solo Saving API ルーター

各機能ごとに分割されたAPIエンドポイントを定義します。
- 資産カテゴリ: マスタデータの取得
- 資産: 個別銘柄のCRUD操作
- スナップショット: チャート表示用の日次データ
- 貯金目標: 目標設定と進捗管理
- ダッシュボード: 統計情報とポートフォリオ
"""

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Asset, AssetCategory, AssetHistory, AssetSnapshot, SavingsGoal
from app.schemas import (
    AssetCategoryResponse,
    AssetCreate,
    AssetHistoryChartData,
    AssetPurchaseRequest,
    AssetResponse,
    AssetSnapshotChartData,
    AssetSnapshotCreate,
    AssetSnapshotResponse,
    AssetUpdate,
    CashTransactionRequest,
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


@assets_router.post(
    "/purchase",
    response_model=AssetResponse,
    status_code=201,
    summary="株購入",
    description="株を購入し、資産として登録または追加購入を処理します。",
)
async def purchase_asset(
    purchase_data: AssetPurchaseRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    株を購入。

    既存銘柄の場合は数量と平均取得単価を更新。
    新規銘柄の場合は新しい資産として登録。

    Args:
        purchase_data: 購入データ

    Returns:
        作成/更新された資産情報
    """
    asset_ticker = purchase_data.ticker_symbol

    # 既存の資産を検索（ティッカーシンボルで照合）
    result = await db.execute(
        select(Asset)
        .options(selectinload(Asset.category))
        .where(Asset.ticker_symbol == asset_ticker)
    )
    existing_asset = result.scalar_one_or_none()

    # 日本円換算の単価を計算（2桁に丸める）
    price_in_jpy = purchase_data.purchase_price
    if purchase_data.usd_jpy_rate:
        price_in_jpy = (purchase_data.purchase_price * purchase_data.usd_jpy_rate).quantize(
            Decimal("0.01")
        )
    else:
        price_in_jpy = price_in_jpy.quantize(Decimal("0.01"))

    # 現在評価額（円）- 2桁に丸める
    current_value_jpy = (purchase_data.quantity * price_in_jpy).quantize(Decimal("0.01"))
    total_purchase_cost = current_value_jpy

    # 現金から差し引き
    # 現金カテゴリID = 4 (CASH_CATEGORY_ID)
    CASH_CATEGORY_ID = 4
    cash_result = await db.execute(select(Asset).where(Asset.category_id == CASH_CATEGORY_ID))
    cash_asset = cash_result.scalar_one_or_none()

    if not cash_asset or cash_asset.quantity < total_purchase_cost:
        raise HTTPException(
            status_code=400,
            detail=(
                f"現金残高が不足しています。必要額: ¥{total_purchase_cost:,.0f}, "
                f"残高: ¥{cash_asset.quantity if cash_asset else 0:,.0f}"
            ),
        )

    cash_asset.quantity = (cash_asset.quantity - total_purchase_cost).quantize(Decimal("0.01"))
    cash_asset.current_value = cash_asset.quantity
    # 現金の更新は後ほどまとめてcommitされる

    if existing_asset:
        # 追加購入: 平均取得単価を再計算
        old_quantity = existing_asset.quantity
        old_avg_cost = existing_asset.average_cost or Decimal("0")
        new_quantity = purchase_data.quantity

        # 平均取得単価の計算（すべて円ベース）
        # 新しい平均取得単価 = (旧数量×旧単価 + 新数量×新単価) / (旧数量 + 新数量)
        total_quantity = old_quantity + new_quantity
        if total_quantity > 0:
            new_avg_cost = (
                (old_quantity * old_avg_cost) + (new_quantity * price_in_jpy)
            ) / total_quantity
            new_avg_cost = new_avg_cost.quantize(Decimal("0.01"))
        else:
            new_avg_cost = price_in_jpy

        total_current_value = (total_quantity * price_in_jpy).quantize(Decimal("0.01"))

        existing_asset.quantity = total_quantity
        existing_asset.average_cost = new_avg_cost
        existing_asset.current_price = price_in_jpy
        existing_asset.current_value = total_current_value

        # 通貨情報は既存のものを維持（または更新？）
        # 米国株カテゴリの場合でも、amount系フィールドが円表記なら currency="JPY" にすべきか？
        # 現状は purchase_data.currency を優先する実装になっていたが、
        # 値を円にするなら currency も JPY にすべきかもしれないが、
        # 「米国株」であることを示すために USD のままにする（値だけ円換算）運用と仮定
        if purchase_data.currency:
            existing_asset.currency = purchase_data.currency

        await db.commit()
        # カテゴリを含めて再取得
        result = await db.execute(
            select(Asset).options(selectinload(Asset.category)).where(Asset.id == existing_asset.id)
        )
        return result.scalar_one()
    else:
        # 新規購入: 新しい資産として作成
        new_asset = Asset(
            category_id=purchase_data.category_id,
            name=purchase_data.name,
            ticker_symbol=purchase_data.ticker_symbol,
            quantity=purchase_data.quantity,
            # 円換算した値を保存
            average_cost=price_in_jpy,
            current_price=price_in_jpy,
            current_value=current_value_jpy,
            currency=purchase_data.currency,
            created_at=datetime.combine(purchase_data.purchase_date, datetime.min.time())
            if purchase_data.purchase_date
            else datetime.now(),
        )
        db.add(new_asset)
        await db.commit()
        # カテゴリを含めて再取得
        result = await db.execute(
            select(Asset).options(selectinload(Asset.category)).where(Asset.id == new_asset.id)
        )
        return result.scalar_one()


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


@assets_router.get(
    "/{asset_id}/history",
    response_model=list[AssetHistoryChartData],
    summary="資産履歴取得",
    description="指定された資産の価格履歴を取得します。",
)
async def get_asset_history(
    asset_id: UUID,
    days: int = Query(
        default=30,
        le=365,
        description="取得日数（最大365日）",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    資産の価格履歴を取得（チャート表示用）。

    Args:
        asset_id: 資産ID（UUID）
        days: 取得日数（デフォルト30日）

    Returns:
        価格履歴リスト（日付、価格、評価額）

    Raises:
        404: 資産が見つからない場合
    """
    # 資産の存在確認
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="資産が見つかりません")

    # 履歴を取得
    start_date = date.today() - timedelta(days=days)
    query = (
        select(AssetHistory)
        .where(AssetHistory.asset_id == asset_id)
        .where(AssetHistory.record_date >= start_date)
        .order_by(AssetHistory.record_date)
    )
    result = await db.execute(query)
    histories = result.scalars().all()

    return [
        AssetHistoryChartData(
            date=h.record_date.strftime("%m/%d"),
            price=h.price,
            value=h.value,
        )
        for h in histories
    ]


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

    # リアルタイム総資産を集計 (現在時点のデータを追加するため)
    assets_result = await db.execute(select(Asset))
    current_assets = assets_result.scalars().all()

    current_totals = {
        1: Decimal("0"),  # japanese_stocks
        2: Decimal("0"),  # us_stocks
        3: Decimal("0"),  # investment_trusts
        4: Decimal("0"),  # cash
    }

    for asset in current_assets:
        if asset.category_id in current_totals:
            current_totals[asset.category_id] += asset.current_value or Decimal("0")

    total_current = sum(current_totals.values())

    current_chart_data = AssetSnapshotChartData(
        date=today.strftime("%m/%d"),  # default for day
        日本株=current_totals[1],
        米国株=current_totals[2],
        投資信託=current_totals[3],
        現金=current_totals[4],
        合計=total_current,
    )

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

        data = [
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

        # 今日の日付のデータがあれば置換、なければ追加
        current_date_str = today.strftime("%m/%d")
        if data and data[-1].date == current_date_str:
            data[-1] = current_chart_data
        else:
            data.append(current_chart_data)

        return data[-30:]  # 最新30件

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
        data = [
            AssetSnapshotChartData(
                date=f"{int(monthly_data[m].snapshot_date.month)}月",
                日本株=monthly_data[m].japanese_stocks,
                米国株=monthly_data[m].us_stocks,
                投資信託=monthly_data[m].investment_trusts,
                現金=monthly_data[m].cash,
                合計=monthly_data[m].total_assets,
            )
            for m in sorted_months
        ]

        # 今月のデータとして現在の値を採用
        current_month_label = f"{today.month}月"
        current_chart_data.date = current_month_label

        # 最後のデータが今月なら置換（または未確定として追加）
        if data and data[-1].date == current_month_label:
            data[-1] = current_chart_data
        else:
            data.append(current_chart_data)

        return data[-12:]

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
        data = [
            AssetSnapshotChartData(
                date=str(year),
                日本株=yearly_data[year].japanese_stocks,
                米国株=yearly_data[year].us_stocks,
                投資信託=yearly_data[year].investment_trusts,
                現金=yearly_data[year].cash,
                合計=yearly_data[year].total_assets,
            )
            for year in sorted_years
        ]

        # 今年のデータとして現在の値を採用
        current_year_label = str(today.year)
        current_chart_data.date = current_year_label

        if data and data[-1].date == current_year_label:
            data[-1] = current_chart_data
        else:
            data.append(current_chart_data)

        return data[-5:]


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
    # リアルタイム総資産を集計
    assets_result = await db.execute(select(Asset))
    all_assets = assets_result.scalars().all()

    total_assets = sum((a.current_value or Decimal("0")) for a in all_assets)
    holding_count = len([a for a in all_assets if a.category_id != 4])  # 現金以外

    # 比較対象として最新のスナップショット（昨日以前のデータとして扱う）を取得
    # ※理想的には昨日のスナップショットだが、最新があればそれと比較
    snapshots_result = await db.execute(
        select(AssetSnapshot).order_by(AssetSnapshot.snapshot_date.desc()).limit(1)
    )
    prev_snapshot = snapshots_result.scalar_one_or_none()

    # トレンド（前回比）を計算
    total_trend = "+0%"
    total_diff = "+¥0"
    holding_trend = "+0銘柄"
    yield_trend = "+0%"
    yield_rate = None

    if prev_snapshot:
        # 総資産の増減率と金額差分
        diff_val = total_assets - prev_snapshot.total_assets
        total_diff = f"{'+' if diff_val >= 0 else ''}¥{diff_val:,.0f}"

        if prev_snapshot.total_assets > 0:
            pct = (diff_val / prev_snapshot.total_assets) * 100
            total_trend = f"{'+' if pct >= 0 else ''}{pct:.1f}%"

        # 保有銘柄数の増減
        holding_diff = holding_count - prev_snapshot.holding_count
        holding_trend = f"{'+' if holding_diff >= 0 else ''}{holding_diff}銘柄"

        # 利回りを計算
        # 総投資額（average_cost * quantity）を算出
        # 現金(category_id=4)は投資額に含めない、または投資額=評価額とする
        # ここでは「投資パフォーマンス」を見るため、現金以外の資産で計算するのが一般的だが、
        # 全体資産の利回りなら現金も含める場合もある。
        # ユーザー要望は「利回り」なので、投資信託や株のパフォーマンス（含み益/投資額）を表示する。

        investment_assets = [a for a in all_assets if a.category_id != 4]
        total_investment = sum(
            (a.average_cost or Decimal("0")) * a.quantity for a in investment_assets
        )
        total_current_value = sum((a.current_value or Decimal("0")) for a in investment_assets)

        if total_investment > 0:
            yield_rate = ((total_current_value - total_investment) / total_investment) * 100
            yield_rate = yield_rate.quantize(Decimal("0.01"))
        else:
            yield_rate = Decimal("0.00")

        # トレンド比較（前回比）
        if prev_snapshot and prev_snapshot.yield_rate is not None:
            diff_yield = yield_rate - prev_snapshot.yield_rate
            yield_trend = f"{'+' if diff_yield >= 0 else ''}{diff_yield:.2f}%"

    return DashboardStats(
        total_assets=total_assets,
        total_assets_trend=total_trend,
        total_assets_diff=total_diff,
        holding_count=holding_count,
        holding_count_trend=holding_trend,
        yield_rate=yield_rate,
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
    # リアルタイム資産を取得
    assets_result = await db.execute(select(Asset).options(selectinload(Asset.category)))
    assets = assets_result.scalars().all()

    # カテゴリごとに集計
    category_totals: dict[str, Decimal] = {
        "japanese_stocks": Decimal("0"),
        "us_stocks": Decimal("0"),
        "investment_trusts": Decimal("0"),
        "cash": Decimal("0"),
    }

    # カテゴリIDマッピング (DBのIDとカテゴリ名の対応)
    # 1: 日本株, 2: 米国株, 3: 投資信託, 4: 現金
    id_map = {1: "japanese_stocks", 2: "us_stocks", 3: "investment_trusts", 4: "cash"}

    for asset in assets:
        cat_key = id_map.get(asset.category_id)
        if cat_key:
            category_totals[cat_key] += asset.current_value or Decimal("0")

    total = sum(category_totals.values())
    if total == 0:
        return []

    # カテゴリ情報を取得
    categories_result = await db.execute(select(AssetCategory))
    categories = {c.name_en: c for c in categories_result.scalars().all()}

    # ポートフォリオアイテムを作成
    portfolio = [
        PortfolioItem(
            name="日本株",
            value=category_totals["japanese_stocks"],
            percentage=(category_totals["japanese_stocks"] / total) * 100,
            color=categories.get("japanese_stocks", AssetCategory(color="indigo")).color,
            icon=categories.get("japanese_stocks", AssetCategory(icon="Building2")).icon,
        ),
        PortfolioItem(
            name="米国株",
            value=category_totals["us_stocks"],
            percentage=(category_totals["us_stocks"] / total) * 100,
            color=categories.get("us_stocks", AssetCategory(color="amber")).color,
            icon=categories.get("us_stocks", AssetCategory(icon="Globe")).icon,
        ),
        PortfolioItem(
            name="投資信託",
            value=category_totals["investment_trusts"],
            percentage=(category_totals["investment_trusts"] / total) * 100,
            color=categories.get("investment_trusts", AssetCategory(color="emerald")).color,
            icon=categories.get("investment_trusts", AssetCategory(icon="TrendingUp")).icon,
        ),
        PortfolioItem(
            name="現金",
            value=category_totals["cash"],
            percentage=(category_totals["cash"] / total) * 100,
            color=categories.get("cash", AssetCategory(color="slate")).color,
            icon=categories.get("cash", AssetCategory(icon="Wallet")).icon,
        ),
    ]

    # 金額が0より大きいもののみ返す
    return [p for p in portfolio if p.value > 0]


# ============================================
# 現金管理 ルーター
# 入金・出金の処理
# ============================================
cash_router = APIRouter(
    prefix="/api/cash",
    tags=["現金管理"],
)

# 現金カテゴリID
CASH_CATEGORY_ID = 4


@cash_router.post(
    "/transaction",
    response_model=AssetResponse,
    status_code=200,
    summary="現金入出金",
    description="現金の入金または出金を処理します。",
)
async def cash_transaction(
    transaction: CashTransactionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    現金の入出金を処理。

    Args:
        transaction: 入出金データ（amount, transaction_type）

    Returns:
        更新された現金資産情報
    """
    # 現金資産を取得または作成
    result = await db.execute(
        select(Asset)
        .options(selectinload(Asset.category))
        .where(Asset.category_id == CASH_CATEGORY_ID)
    )
    cash_asset = result.scalar_one_or_none()

    amount = transaction.amount.quantize(Decimal("0.01"))

    if transaction.transaction_type == "deposit":
        # 入金
        if cash_asset:
            cash_asset.quantity = (cash_asset.quantity + amount).quantize(Decimal("0.01"))
            cash_asset.current_value = cash_asset.quantity
        else:
            # 現金資産が存在しない場合は作成
            cash_asset = Asset(
                category_id=CASH_CATEGORY_ID,
                name="現金",
                ticker_symbol=None,
                quantity=amount,
                average_cost=Decimal("1"),
                current_price=Decimal("1"),
                current_value=amount,
                currency="JPY",
            )
            db.add(cash_asset)
    elif transaction.transaction_type == "withdraw":
        # 出金
        if not cash_asset or cash_asset.quantity < amount:
            raise HTTPException(
                detail=(
                    f"残高不足です。現在の残高: ¥{cash_asset.quantity if cash_asset else 0:,.0f}"
                ),
            )
        cash_asset.quantity = (cash_asset.quantity - amount).quantize(Decimal("0.01"))
        cash_asset.current_value = cash_asset.quantity
    else:
        raise HTTPException(
            status_code=400,
            detail="transaction_type は 'deposit' または 'withdraw' を指定してください",
        )

    await db.commit()

    # 再取得してレスポンス
    result = await db.execute(
        select(Asset).options(selectinload(Asset.category)).where(Asset.id == cash_asset.id)
    )
    return result.scalar_one()


@cash_router.get(
    "/balance",
    response_model=dict,
    summary="現金残高取得",
    description="現在の現金残高を取得します。",
)
async def get_cash_balance(db: AsyncSession = Depends(get_db)):
    """
    現金残高を取得。

    Returns:
        現金残高
    """
    result = await db.execute(select(Asset).where(Asset.category_id == CASH_CATEGORY_ID))
    cash_asset = result.scalar_one_or_none()

    balance = cash_asset.quantity if cash_asset else Decimal("0")
    return {"balance": balance, "currency": "JPY"}


@assets_router.post(
    "/refresh",
    summary="資産価格更新",
    description="外部API(yfinance)から最新の株価・為替を取得し、すべての資産の評価額を更新します。",
)
async def refresh_asset_prices(db: AsyncSession = Depends(get_db)):
    """
    全資産の価格を再取得して更新する。
    """
    import asyncio

    import yfinance as yf

    # 全資産取得
    result = await db.execute(select(Asset))
    assets = result.scalars().all()

    if not assets:
        return {"message": "No assets to update", "updated_count": 0}

    # カテゴリごとに分類
    us_assets = [a for a in assets if a.category_id == 2 and a.ticker_symbol]
    jp_assets = [a for a in assets if a.category_id == 1 and a.ticker_symbol]

    # データ取得用の同期関数（yfinanceは同期I/Oを行うため別スレッドで実行）
    def fetch_market_data():
        updated_data = {}  # {ticker: {price_type: 'USD'|'JPY', price: Decimal, rate: Decimal}}

        # 1. 為替レート取得
        try:
            usdjpy_ticker = yf.Ticker("USDJPY=X")
            try:
                usdjpy_rate = Decimal(str(usdjpy_ticker.fast_info.last_price))
            except Exception:
                hist = usdjpy_ticker.history(period="1d")
                if not hist.empty:
                    usdjpy_rate = Decimal(str(hist["Close"].iloc[-1]))
                else:
                    usdjpy_rate = Decimal("150.0")
        except Exception:
            usdjpy_rate = Decimal("150.0")

        # 2. 米国株
        for asset in us_assets:
            try:
                t = yf.Ticker(asset.ticker_symbol)
                price_usd = Decimal(str(t.fast_info.last_price))
                updated_data[asset.ticker_symbol] = {
                    "price": price_usd,
                    "currency": "USD",
                    "rate": usdjpy_rate,
                }
            except Exception as e:
                print(f"Failed to fetch US stock {asset.ticker_symbol}: {e}")

        # 3. 日本株
        for asset in jp_assets:
            try:
                sym = asset.ticker_symbol
                if not sym.endswith(".T"):
                    sym += ".T"
                t = yf.Ticker(sym)
                price_jpy = Decimal(str(t.fast_info.last_price))
                updated_data[asset.ticker_symbol] = {
                    "price": price_jpy,
                    "currency": "JPY",
                    "rate": Decimal("1.0"),
                }
            except Exception as e:
                print(f"Failed to fetch JP stock {asset.ticker_symbol}: {e}")

        return updated_data, usdjpy_rate

    # スレッドプールで実行（メインループをブロックしない）
    loop = asyncio.get_event_loop()
    market_data, current_rate = await loop.run_in_executor(None, fetch_market_data)

    # DB更新
    updated_count = 0
    for asset in assets:
        if not asset.ticker_symbol:
            continue

        data = market_data.get(asset.ticker_symbol)
        if data:
            if data["currency"] == "USD":
                asset.current_price = (data["price"] * data["rate"]).quantize(Decimal("0.01"))
            else:
                asset.current_price = data["price"].quantize(Decimal("0.01"))

            asset.current_value = (asset.current_price * asset.quantity).quantize(Decimal("0.01"))
            updated_count += 1

    await db.commit()

    return {
        "message": "Assets updated successfully",
        "updated_count": updated_count,
        "usd_jpy_rate": current_rate,
    }
