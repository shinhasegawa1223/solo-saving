"""
実際の保有銘柄データでスナップショットを再計算
- 購入日: NVDA/KO=12/17, JNJ=12/23, V=12/24
- 現金: 9,000円
- レート: 1 USD = 156.38 JPY
"""

import asyncio
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import delete, select

from app.database import async_session_maker
from app.models import Asset, AssetHistory, AssetSnapshot

# USD/JPY レート
USD_JPY_RATE = Decimal("156.38")
CASH_JPY = Decimal("9000")

# 購入履歴
PURCHASE_HISTORY = {
    "NVDA": {"date": date(2025, 12, 17), "cost": Decimal("177.67")},
    "KO": {"date": date(2025, 12, 17), "cost": Decimal("71.09")},
    "JNJ": {"date": date(2025, 12, 23), "cost": Decimal("207.11")},
    "V": {"date": date(2025, 12, 24), "cost": Decimal("356.25")},
}

# 現在価格（2025/12/29時点）
CURRENT_PRICES = {
    "NVDA": Decimal("190.53"),
    "KO": Decimal("69.87"),
    "JNJ": Decimal("207.63"),
    "V": Decimal("355.00"),
}


async def rebuild_data():
    """履歴とスナップショットを再構築"""
    async with async_session_maker() as session:
        # 既存データを削除
        await session.execute(delete(AssetHistory))
        await session.execute(delete(AssetSnapshot))
        print("✓ Deleted existing histories and snapshots")

        # assets を取得
        result = await session.execute(select(Asset))
        assets = {a.ticker_symbol: a for a in result.scalars().all()}

        today = date(2025, 12, 29)
        start_date = date(2025, 12, 17)  # 最初の購入日

        # 各日の資産履歴とスナップショットを作成
        histories = []
        snapshots = []

        current_date = start_date
        while current_date <= today:
            us_stocks_usd = Decimal("0")

            for ticker, asset in assets.items():
                purchase = PURCHASE_HISTORY.get(ticker)
                if not purchase:
                    continue

                # 購入日以降のみ保有
                if current_date < purchase["date"]:
                    continue

                # 価格は購入価格から現在価格へ線形補間
                purchase_date = purchase["date"]
                cost = purchase["cost"]
                current_price = CURRENT_PRICES[ticker]

                days_since_purchase = (current_date - purchase_date).days
                total_days = (today - purchase_date).days
                if total_days > 0:
                    ratio = Decimal(days_since_purchase) / Decimal(total_days)
                    price = cost + (current_price - cost) * ratio
                else:
                    price = current_price

                price = price.quantize(Decimal("0.01"))

                # 履歴を追加
                history = AssetHistory(
                    asset_id=asset.id,
                    record_date=current_date,
                    price=price,
                    value=price,  # 1株なので price = value
                    quantity=Decimal("1"),
                )
                histories.append(history)

                us_stocks_usd += price

            # スナップショットを作成
            us_stocks_jpy = (us_stocks_usd * USD_JPY_RATE).quantize(Decimal("1"))
            total_jpy = us_stocks_jpy + CASH_JPY

            # 保有銘柄数を計算
            holding_count = sum(
                1 for ticker in PURCHASE_HISTORY if PURCHASE_HISTORY[ticker]["date"] <= current_date
            )

            snapshot = AssetSnapshot(
                snapshot_date=current_date,
                total_assets=total_jpy,
                japanese_stocks=Decimal("0"),
                us_stocks=us_stocks_jpy,
                investment_trusts=Decimal("0"),
                cash=CASH_JPY,
                holding_count=holding_count,
                yield_rate=Decimal("0.25"),  # 実際の利回り +0.25%
            )
            snapshots.append(snapshot)

            current_date += timedelta(days=1)

        session.add_all(histories)
        session.add_all(snapshots)
        await session.commit()

        print(f"✓ Created {len(histories)} history records")
        print(f"✓ Created {len(snapshots)} snapshots from {start_date} to {today}")

        # 最新のスナップショットを表示
        latest = snapshots[-1]
        print(f"\nLatest snapshot ({latest.snapshot_date}):")
        print(f"  米国株: ¥{latest.us_stocks:,.0f}")
        print(f"  現金: ¥{latest.cash:,.0f}")
        print(f"  総資産: ¥{latest.total_assets:,.0f}")
        print(f"  保有銘柄数: {latest.holding_count}")


if __name__ == "__main__":
    asyncio.run(rebuild_data())
