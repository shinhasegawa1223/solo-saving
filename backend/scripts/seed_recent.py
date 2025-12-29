"""
直近30日分のスナップショットデータを追加するスクリプト
"""

import asyncio
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.database import async_session_maker
from app.models import AssetSnapshot


async def add_recent_snapshots():
    """今日から過去30日分のスナップショットを追加"""
    async with async_session_maker() as session:
        today = date.today()

        # 基準値
        base_values = {
            "japanese_stocks": Decimal("1350000"),
            "us_stocks": Decimal("1600000"),
            "investment_trusts": Decimal("1050000"),
            "cash": Decimal("610000"),
        }

        snapshots_added = 0

        for i in range(30, -1, -1):  # 30日前から今日まで
            snapshot_date = today - timedelta(days=i)

            # 既存チェック
            result = await session.execute(
                select(AssetSnapshot).where(AssetSnapshot.snapshot_date == snapshot_date)
            )
            if result.scalar_one_or_none():
                continue

            # 少しずつ値を変動させる（リアルなデータに見せる）
            factor = Decimal("1") + Decimal(str((30 - i) * 0.002))  # 0.2%ずつ増加

            jp = (base_values["japanese_stocks"] * factor).quantize(Decimal("1"))
            us = (base_values["us_stocks"] * factor).quantize(Decimal("1"))
            inv = (base_values["investment_trusts"] * factor).quantize(Decimal("1"))
            cash = base_values["cash"]  # 現金は固定
            total = jp + us + inv + cash

            snapshot = AssetSnapshot(
                snapshot_date=snapshot_date,
                total_assets=total,
                japanese_stocks=jp,
                us_stocks=us,
                investment_trusts=inv,
                cash=cash,
                holding_count=4,
                yield_rate=Decimal("3.24"),
            )
            session.add(snapshot)
            snapshots_added += 1

        await session.commit()
        print(f"✓ Added {snapshots_added} snapshots for recent 30 days")


if __name__ == "__main__":
    asyncio.run(add_recent_snapshots())
