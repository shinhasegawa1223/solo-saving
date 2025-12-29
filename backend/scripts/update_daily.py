import asyncio

# プロジェクトルートにパスを通す（backendディレクトリ）
import os
import sys
from datetime import date
from decimal import Decimal

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

import yfinance as yf
from sqlalchemy import select

from app.database import async_session_maker
from app.models import Asset, AssetSnapshot


async def update_daily_data():
    """
    日次データ更新処理
    1. 最新の為替レートを取得
    2. 各資産の現在価格と評価額を更新
    3. 本日のスナップショットを作成・保存
    """
    print(f"--- Daily Update Started: {date.today()} ---")

    async with async_session_maker() as session:
        # 1. 為替レート取得 (USD/JPY)
        print("Fetching USD/JPY rate...")
        try:
            forex = yf.Ticker("JPY=X")
            # 直近のデータから最新の終値を取得
            hist = forex.history(period="1d")
            if hist.empty:
                print("Error: Could not fetch exchange rate.")
                return
            usd_jpy_rate = Decimal(str(hist["Close"].iloc[-1]))
            print(f"USD/JPY Rate: {usd_jpy_rate:.2f}")
        except Exception as e:
            print(f"Error fetching exchange rate: {e}")
            return

        # 2. 全資産を取得
        result = await session.execute(select(Asset))
        assets = result.scalars().all()

        total_japanese_stocks = Decimal("0")
        total_us_stocks = Decimal("0")
        total_investment_trusts = Decimal("0")
        total_cash = Decimal("0")
        holding_count = 0

        # 保有資産ごとの処理
        print("\nUpdating assets...")
        for asset in assets:
            # 現金の場合
            if asset.category_id == 4:  # Cash
                total_cash += asset.current_value
                # 現金は価格変動なしとする
                # （あるいは外貨預金ならレート計算が必要だが今回は日本円想定）
                continue

            # 株式等の場合
            ticker = asset.ticker_symbol
            if not ticker:
                continue

            holding_count += 1

            try:
                # 最新株価を取得
                stock = yf.Ticker(ticker)
                hist = stock.history(period="1d")

                if not hist.empty:
                    current_price_usd = Decimal(str(hist["Close"].iloc[-1]))

                    # 資産テーブルを更新
                    asset.current_price = current_price_usd

                    # 円換算評価額
                    # 米国株なら: 株価(USD) * 数量 * レート
                    # 日本株なら: 株価(JPY) * 数量
                    # (今回はあえてUSD判定を入れるなら currency カラムを見るべきだが、
                    # 簡易的にカテゴリで判断)

                    current_value_jpy = Decimal("0")

                    if asset.category_id == 2:  # US Stocks
                        current_value_jpy = current_price_usd * asset.quantity * usd_jpy_rate
                        total_us_stocks += current_value_jpy
                        # DB更新用の現在価値（円）をセット
                        asset.current_value = current_value_jpy.quantize(Decimal("1"))
                        print(
                            f"  [Updated] {asset.name} ({ticker}): "
                            f"${current_price_usd:.2f} -> ¥{asset.current_value:,.0f}"
                        )

                    elif asset.category_id == 1:  # JP Stocks
                        # 日本株の場合は為替レートをかけない
                        current_value_jpy = current_price_usd * asset.quantity
                        total_japanese_stocks += current_value_jpy
                        asset.current_value = current_value_jpy.quantize(Decimal("1"))
                        print(
                            f"  [Updated] {asset.name} ({ticker}): "
                            f"¥{current_price_usd:.0f} -> ¥{asset.current_value:,.0f}"
                        )

                else:
                    print(f"  [Skip] No data found for {ticker}")
                    # データが取れない場合は前回値を維持して集計に加算
                    if asset.category_id == 2:
                        total_us_stocks += asset.current_value
                    elif asset.category_id == 1:
                        total_japanese_stocks += asset.current_value

            except Exception as e:
                print(f"  [Error] Failed to update {ticker}: {e}")
                # エラー時も前回値を集計
                if asset.category_id == 2:
                    total_us_stocks += asset.current_value

        # 3. スナップショットの保存
        print("\nCreating snapshot...")
        today = date.today()

        # 今日のスナップショットが既に存在するか確認
        query = select(AssetSnapshot).where(AssetSnapshot.snapshot_date == today)
        result = await session.execute(query)
        existing_snapshot = result.scalar_one_or_none()

        # 総資産
        # 総資産
        total_assets = (
            total_japanese_stocks + total_us_stocks + total_investment_trusts + total_cash
        )

        # 利回り計算 (簡易版: 総資産 / 元本 - 1。
        # 元本が管理されていない場合は前日比などを使用するが、
        # ここでは前のコードに合わせて固定or単純計算。
        # 今回は一旦0.25%固定のロジックを踏襲せず、
        # もし元本管理がないなら、前回利回り + α などの擬似計算、あるいはNULLにする)
        # 今回は暫定的に固定値または再計算ロジックが必要だが、元本データがないため
        # 単純に「評価額合計」を保存することに集中する。
        yield_rate = Decimal("0.25")  # ToDo: 元本管理機能を実装して正確に計算する

        if existing_snapshot:
            # 更新
            existing_snapshot.total_assets = total_assets.quantize(Decimal("1"))
            existing_snapshot.us_stocks = total_us_stocks.quantize(Decimal("1"))
            existing_snapshot.japanese_stocks = total_japanese_stocks.quantize(Decimal("1"))
            existing_snapshot.cash = total_cash.quantize(Decimal("1"))
            existing_snapshot.holding_count = holding_count
            existing_snapshot.yield_rate = yield_rate
            print("  Snapshot updated.")
        else:
            # 新規作成
            new_snapshot = AssetSnapshot(
                snapshot_date=today,
                total_assets=total_assets.quantize(Decimal("1")),
                japanese_stocks=total_japanese_stocks.quantize(Decimal("1")),
                us_stocks=total_us_stocks.quantize(Decimal("1")),
                investment_trusts=total_investment_trusts.quantize(Decimal("1")),
                cash=total_cash.quantize(Decimal("1")),
                holding_count=holding_count,
                yield_rate=yield_rate,
            )
            session.add(new_snapshot)
            print("  New snapshot created.")

        await session.commit()
        print(f"--- Daily Update Completed. Total Assets: ¥{total_assets:,.0f} ---")


if __name__ == "__main__":
    asyncio.run(update_daily_data())
