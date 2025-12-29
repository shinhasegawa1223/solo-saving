"""
保有銘柄の履歴データを yfinance から取得して DB に保存するスクリプト
"""

import asyncio
from decimal import Decimal

import yfinance as yf
from sqlalchemy import delete, select

from app.database import async_session_maker
from app.models import Asset, AssetHistory


async def seed_history():
    """11月1日から今日までの終値データを取得して保存"""
    async with async_session_maker() as session:
        # 既存の assets を取得
        result = await session.execute(select(Asset))
        assets = {a.ticker_symbol: a for a in result.scalars().all()}

        if not assets:
            print("No assets found")
            return

        print(f"Found {len(assets)} assets: {list(assets.keys())}")

        # yfinance でデータ取得
        start_date = "2024-11-01"
        end_date = "2024-12-29"

        histories_to_add = []

        for ticker, asset in assets.items():
            if not ticker:
                continue

            stock = yf.Ticker(ticker)
            hist = stock.history(start=start_date, end=end_date)

            for idx, row in hist.iterrows():
                record_date = idx.date()
                price = Decimal(str(round(row["Close"], 2)))
                quantity = asset.quantity
                value = price * quantity

                history = AssetHistory(
                    asset_id=asset.id,
                    record_date=record_date,
                    price=price,
                    value=value,
                    quantity=quantity,
                )
                histories_to_add.append(history)

            print(f"  {ticker}: {len(hist)} records prepared")

        # 既存の履歴を削除（重複防止）
        await session.execute(delete(AssetHistory))

        # 保存
        session.add_all(histories_to_add)
        await session.commit()
        print(f"✓ Saved {len(histories_to_add)} history records")


if __name__ == "__main__":
    asyncio.run(seed_history())
