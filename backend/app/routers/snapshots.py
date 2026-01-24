"""
スナップショット ルーター

日次の資産スナップショット（チャート表示用データ）
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Asset, AssetSnapshot
from app.schemas.snapshot import (
    AssetSnapshotChartData,
    AssetSnapshotCreate,
    AssetSnapshotResponse,
)

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

        def format_day_label(d: date) -> str:
            """日次ラベル: M/D形式（例: 12/31, 1/1）"""
            return f"{d.month}/{d.day}"

        data = [
            AssetSnapshotChartData(
                date=format_day_label(s.snapshot_date),
                日本株=s.japanese_stocks,
                米国株=s.us_stocks,
                投資信託=s.investment_trusts,
                現金=s.cash,
                合計=s.total_assets,
            )
            for s in snapshots
        ]

        # 今日の日付のデータがあれば置換、なければ追加
        current_date_label = format_day_label(today)
        current_chart_data.date = current_date_label
        if data and data[-1].date == current_date_label:
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
