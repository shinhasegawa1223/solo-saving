"""
ダッシュボード ルーター

統計情報とポートフォリオ構成
"""

from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Asset, AssetCategory, AssetSnapshot
from app.schemas.dashboard import DashboardStats, PortfolioItem

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
        total_investment = sum((a.total_cost_jpy or Decimal("0")) for a in investment_assets)
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
