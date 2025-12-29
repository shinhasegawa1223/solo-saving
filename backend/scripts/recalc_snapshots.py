"""
スナップショットデータを実際の保有銘柄データで再計算するスクリプト
- USD → JPY 換算あり
- 日本株・投資信託: 0
- 現金: 9,000円
- 米国株: asset_histories から日次で計算（円換算）
"""

import asyncio
from decimal import Decimal

from sqlalchemy import delete, func, select

from app.database import async_session_maker
from app.models import AssetHistory, AssetSnapshot

# USD/JPY レート（現在のおおよそのレート）
USD_JPY_RATE = Decimal("157")


async def recalculate_snapshots():
    """スナップショットを実際のデータで再計算（円換算）"""
    async with async_session_maker() as session:
        # 現金は9000円固定
        cash = Decimal("9000")

        # 既存のスナップショットを全削除
        await session.execute(delete(AssetSnapshot))
        print("✓ Deleted all existing snapshots")

        # asset_histories から日付一覧を取得
        result = await session.execute(
            select(AssetHistory.record_date).distinct().order_by(AssetHistory.record_date)
        )
        dates = [row[0] for row in result.fetchall()]

        if not dates:
            print("No history data found")
            return

        print(f"Found {len(dates)} dates with history data")
        print(f"USD/JPY rate: {USD_JPY_RATE}")

        # 各日付のスナップショットを作成
        snapshots = []
        for record_date in dates:
            # その日の全銘柄の評価額合計を取得（USD）
            result = await session.execute(
                select(func.sum(AssetHistory.value)).where(AssetHistory.record_date == record_date)
            )
            us_stocks_usd = result.scalar() or Decimal("0")

            # USD → JPY 換算
            us_stocks_jpy = (us_stocks_usd * USD_JPY_RATE).quantize(Decimal("1"))

            # 総資産 = 米国株（円換算） + 現金
            total = us_stocks_jpy + cash

            snapshot = AssetSnapshot(
                snapshot_date=record_date,
                total_assets=total,
                japanese_stocks=Decimal("0"),
                us_stocks=us_stocks_jpy,
                investment_trusts=Decimal("0"),
                cash=cash,
                holding_count=4,
                yield_rate=Decimal("3.24"),
            )
            snapshots.append(snapshot)

        session.add_all(snapshots)
        await session.commit()
        print(f"✓ Created {len(snapshots)} snapshots from {dates[0]} to {dates[-1]}")

        # 最新のスナップショットを表示
        latest = snapshots[-1] if snapshots else None
        if latest:
            print(f"\nLatest snapshot ({latest.snapshot_date}):")
            print(f"  米国株: ¥{latest.us_stocks:,.0f}")
            print(f"  現金: ¥{latest.cash:,.0f}")
            print(f"  総資産: ¥{latest.total_assets:,.0f}")


if __name__ == "__main__":
    asyncio.run(recalculate_snapshots())
