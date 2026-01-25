"""
資産 ルーター

個別銘柄の登録・更新・削除・取得・購入・価格更新
"""

import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

import yfinance as yf
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Asset, AssetHistory, AssetSnapshot, Transaction
from app.schemas.asset import (
    AssetCreate,
    AssetPurchaseRequest,
    AssetResponse,
    AssetUpdate,
)
from app.schemas.history import AssetHistoryChartData
from app.schemas.price_history import PriceHistoryData, TransactionData
from app.services import YFinanceService

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

        # 取得単価（保存用）: USDならドルのまま、JPYなら円
        # purchase_price はユーザー入力の単価（USDならドル、JPYなら円）
        input_price = purchase_data.purchase_price

        # 平均取得単価の計算（加重平均）
        total_quantity = old_quantity + new_quantity
        if total_quantity > 0:
            new_avg_cost = (
                (old_quantity * old_avg_cost) + (new_quantity * input_price)
            ) / total_quantity
            new_avg_cost = new_avg_cost.quantize(Decimal("0.01"))
        else:
            new_avg_cost = input_price.quantize(Decimal("0.01"))

        # current_value (評価額) は常に日本円で保存
        # 米国株の場合: 数量 * 現在価格(USD) * レート
        # 日本株の場合: 数量 * 現在価格(JPY)
        # ここでは「購入直後」なので、購入価格を現在価格とする

        current_price = input_price  # Native currency

        if purchase_data.currency == "USD":
            # USDの場合: USD価格 * 数量 * レート
            current_value_jpy = (
                total_quantity * current_price * (purchase_data.usd_jpy_rate or Decimal("1"))
            ).quantize(Decimal("0.01"))
        else:
            # JPYの場合
            current_value_jpy = (total_quantity * current_price).quantize(Decimal("0.01"))

        existing_asset.quantity = total_quantity
        existing_asset.average_cost = new_avg_cost
        existing_asset.current_price = current_price
        existing_asset.current_value = current_value_jpy

        # 通貨情報は既存のものを維持（または更新？）
        # 米国株カテゴリの場合でも、amount系フィールドが円表記なら currency="JPY" にすべきか？
        # 現状は purchase_data.currency を優先する実装になっていたが、
        # 値を円にするなら currency も JPY にすべきかもしれないが、
        # 「米国株」であることを示すために USD のままにする（値だけ円換算）運用と仮定
        if purchase_data.currency:
            existing_asset.currency = purchase_data.currency

        # Create Transaction record
        transaction = Transaction(
            asset_id=existing_asset.id,
            transaction_type="buy",
            quantity=purchase_data.quantity,
            price=purchase_data.purchase_price,
            usd_jpy_rate=purchase_data.usd_jpy_rate,
            currency=purchase_data.currency,
            total_cost_jpy=current_value_jpy,  # Calculated at purchase time
            transaction_date=datetime.combine(
                purchase_data.purchase_date or date.today(), datetime.min.time()
            ),
        )
        db.add(transaction)

        await db.commit()
        # カテゴリを含めて再取得
        result = await db.execute(
            select(Asset).options(selectinload(Asset.category)).where(Asset.id == existing_asset.id)
        )
        return result.scalar_one()
    else:
        # 新規購入: 新しい資産として作成
        # 保存する単価・価格は「元の通貨」のままにする
        asset_price = purchase_data.purchase_price  # Native currency

        new_asset = Asset(
            category_id=purchase_data.category_id,
            name=purchase_data.name,
            ticker_symbol=purchase_data.ticker_symbol,
            quantity=purchase_data.quantity,
            # 元の通貨のまま保存
            average_cost=asset_price,
            current_price=asset_price,
            # 評価額は常に日本円
            current_value=current_value_jpy,
            currency=purchase_data.currency,
            created_at=datetime.combine(purchase_data.purchase_date, datetime.min.time())
            if purchase_data.purchase_date
            else datetime.now(),
        )
        db.add(new_asset)
        await db.flush()  # to get new_asset.id

        # Create Transaction record
        transaction = Transaction(
            asset_id=new_asset.id,
            transaction_type="buy",
            quantity=purchase_data.quantity,
            price=purchase_data.purchase_price,
            usd_jpy_rate=purchase_data.usd_jpy_rate,
            currency=purchase_data.currency,
            total_cost_jpy=current_value_jpy,  # Calculated at purchase time
            transaction_date=datetime.combine(
                purchase_data.purchase_date or date.today(), datetime.min.time()
            ),
        )
        db.add(transaction)

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


@assets_router.post(
    "/refresh",
    summary="資産価格更新",
    description="外部API(yfinance)から最新の株価・為替を取得し、すべての資産の評価額を更新します。",
)
async def refresh_asset_prices(db: AsyncSession = Depends(get_db)):
    """
    全資産の価格を再取得して更新する。
    同時に、前回のスナップショットから昨日までの期間のデータが欠損していれば
    自動的にバックフィル（過去データの補完）を行う。
    """
    # 1. 資産があるか確認
    result = await db.execute(select(Asset).options(selectinload(Asset.category)))
    assets = result.scalars().all()

    if not assets:
        return {"message": "No assets to update", "updated_count": 0}

    today = date.today()
    yesterday = today - timedelta(days=1)

    # 2. 自動バックフィル処理
    # 最新のスナップショット日付を取得
    latest_snap_result = await db.execute(
        select(AssetSnapshot.snapshot_date).order_by(AssetSnapshot.snapshot_date.desc()).limit(1)
    )
    latest_snap_date = latest_snap_result.scalar_one_or_none()

    # スナップショットが全くない場合は、過去データを作りすぎないように「昨日」だけ作る、
    # あるいは「作成日」から作るなどの戦略があるが、
    # ここでは簡易的に「直近30日以内なら埋める」などの制限を設けてもよい。
    # 今回は「最新スナップショットの翌日 〜 昨日」を埋める。

    start_backfill_date = None
    if latest_snap_date:
        if latest_snap_date < yesterday:
            start_backfill_date = latest_snap_date + timedelta(days=1)

    # 3. yfinanceから現在価格と（必要なら）履歴を取得する関数
    def fetch_market_data(backfill_start: date | None):
        updated_data = {}  # 現在価格 {ticker: {price, currency, rate}}
        history_data = {}  # 履歴 {date: {ticker: price_jpy}}

        # ... (既存の現在価格取得ロジック + 履歴取得)

        # 通貨レートの履歴も必要
        usdjpy_history = {}  # {date: rate}

        # ---------------------------------------------------------
        # A. 現在価格とレートの取得 (既存ロジック)
        # ---------------------------------------------------------
        # 1. 為替レート
        usdjpy_rate = Decimal("150.0")
        try:
            usdjpy_ticker = yf.Ticker("USDJPY=X")
            try:
                usdjpy_rate = Decimal(str(usdjpy_ticker.fast_info.last_price))
            except Exception:
                hist = usdjpy_ticker.history(period="1d")
                if not hist.empty:
                    usdjpy_rate = Decimal(str(hist["Close"].iloc[-1]))
        except Exception:
            pass

        # ---------------------------------------------------------
        # B. バックフィル用の履歴データ取得 (必要な場合のみ)
        # ---------------------------------------------------------
        if backfill_start:
            # yfinanceのhistoryは start(inclusive), end(exclusive)
            # 昨日まで含めるには end = today
            yf_start = backfill_start.strftime("%Y-%m-%d")
            yf_end = today.strftime("%Y-%m-%d")

            # 為替履歴
            try:
                usdjpy_hist = yf.Ticker("USDJPY=X").history(start=yf_start, end=yf_end)
                for dt, row in usdjpy_hist.iterrows():
                    d_date = dt.date()
                    usdjpy_history[d_date] = Decimal(str(row["Close"]))
            except Exception as e:
                print(f"Failed to fetch USDJPY history: {e}")

            # 各銘柄の履歴
            # まとめて取得したほうが早いが、現状のリスト構造的にループで処理
            all_tickers = [a.ticker_symbol for a in assets if a.ticker_symbol]

            for ticker_symbol in all_tickers:
                try:
                    sym = ticker_symbol
                    is_jp = sym.isdigit() or sym.endswith(".T")
                    if is_jp and not sym.endswith(".T"):
                        sym += ".T"

                    hist = yf.Ticker(sym).history(start=yf_start, end=yf_end)

                    for dt, row in hist.iterrows():
                        d_date = dt.date()
                        price = Decimal(str(row["Close"]))

                        if d_date not in history_data:
                            history_data[d_date] = {}

                        # 日本円に換算して保存（スナップショット用）
                        rate = Decimal("1.0")
                        if not is_jp:  # US stock
                            # 履歴がない場合は最新レートで代用
                            rate = usdjpy_history.get(d_date, usdjpy_rate)

                        history_data[d_date][ticker_symbol] = (price * rate).quantize(
                            Decimal("0.01")
                        )

                except Exception as e:
                    print(f"Failed to fetch history for {ticker_symbol}: {e}")

        # ---------------------------------------------------------
        # C. 現在価格の取得 (既存ロジック再利用)
        # ---------------------------------------------------------
        # カテゴリ分類
        us_assets_list = [a for a in assets if a.category_id == 2 and a.ticker_symbol]
        jp_assets_list = [a for a in assets if a.category_id == 1 and a.ticker_symbol]

        for asset in us_assets_list:
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

        for asset in jp_assets_list:
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

        return updated_data, usdjpy_rate, history_data

    # スレッドプールで実行
    loop = asyncio.get_event_loop()
    market_data, current_rate, history_data = await loop.run_in_executor(
        None, fetch_market_data, start_backfill_date
    )

    # 4. バックフィルデータの保存 (AssetSnapshot作成)
    if history_data:
        # 現金資産を取得 (スナップショット計算用)
        # ※本来は現金の履歴も必要だが、ここでは「現在の現金残高」を過去にも持っていたと仮定する
        # （より正確にするにはTransaction履歴から逆算する必要があるが今回は簡易実装）
        cash_result = await db.execute(select(Asset).where(Asset.category_id == 4))
        cash_asset = cash_result.scalar_one_or_none()
        current_cash = cash_asset.quantity if cash_asset else Decimal("0")

        new_snapshots = []
        sorted_dates = sorted(history_data.keys())

        for d_date in sorted_dates:
            daily_prices = history_data[d_date]  # {ticker: price_jpy}

            # 日次集計
            total_jp_stocks = Decimal("0")
            total_us_stocks = Decimal("0")
            total_trusts = Decimal("0")
            total_cash = current_cash

            # 資産ごとの計算
            for asset in assets:
                val = Decimal("0")
                if asset.ticker_symbol and asset.ticker_symbol in daily_prices:
                    # 履歴価格 * 現在の数量
                    val = (daily_prices[asset.ticker_symbol] * asset.quantity).quantize(
                        Decimal("0.01")
                    )
                elif asset.category_id != 4:
                    # Tickerがない、または履歴が取れなかった場合
                    # 現在の評価額を代用（あるいは0にする）
                    val = asset.current_value or Decimal("0")

                if asset.category_id == 1:
                    total_jp_stocks += val
                elif asset.category_id == 2:
                    total_us_stocks += val
                elif asset.category_id == 3:
                    # 投資信託はTickerがない場合が多いので現在値を使うことが多い
                    # 一律 現在値を使用
                    if not asset.ticker_symbol:
                        total_trusts += asset.current_value or Decimal("0")
                    else:
                        total_trusts += val

            total_assets = total_jp_stocks + total_us_stocks + total_trusts + total_cash

            # スナップショット作成
            snapshot = AssetSnapshot(
                snapshot_date=d_date,
                japanese_stocks=total_jp_stocks,
                us_stocks=total_us_stocks,
                investment_trusts=total_trusts,
                cash=total_cash,
                total_assets=total_assets,
            )
            new_snapshots.append(snapshot)

        if new_snapshots:
            db.add_all(new_snapshots)

    # 5. 現在価格の更新 (既存ロジック)
    updated_count = 0

    for asset in assets:
        if not asset.ticker_symbol:
            continue

        data = market_data.get(asset.ticker_symbol)
        if data:
            if data["currency"] == "USD":
                # USDの場合: current_priceはUSDのまま保存
                asset.current_price = data["price"].quantize(Decimal("0.01"))
                # current_valueはJPYに換算して保存 (Price(USD) * Quantity * Rate)
                asset.current_value = (
                    asset.current_price * asset.quantity * data["rate"]
                ).quantize(Decimal("0.01"))
            else:
                # JPYの場合
                asset.current_price = data["price"].quantize(Decimal("0.01"))
                asset.current_value = (asset.current_price * asset.quantity).quantize(
                    Decimal("0.01")
                )

            updated_count += 1

    await db.commit()

    return {
        "message": "Assets updated successfully",
        "updated_count": updated_count,
        "usd_jpy_rate": current_rate,
    }


@assets_router.get(
    "/{asset_id}/price-history",
    response_model=list[PriceHistoryData],
    summary="yfinance価格履歴取得",
    description="yfinanceから指定された資産の全期間価格データを取得します。",
)
async def get_asset_price_history(
    asset_id: UUID,
    period: str = Query(
        default="1mo",
        description="取得期間 (7d, 1mo, 3mo, 1y, max)",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    yfinanceから資産の価格履歴を取得。

    Args:
        asset_id: 資産ID（UUID）
        period: 取得期間（7d, 1mo, 3mo, 1y, max）

    Returns:
        価格履歴リスト（日付、始値、高値、安値、終値、出来高）

    Raises:
        404: 資産が見つからない場合
        400: 価格データの取得に失敗した場合
    """
    # 資産の存在確認
    result = await db.execute(
        select(Asset).options(selectinload(Asset.category)).where(Asset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="資産が見つかりません")

    # ティッカーシンボルがない場合はエラー
    if not asset.ticker_symbol:
        raise HTTPException(
            status_code=400,
            detail="この資産にはティッカーシンボルが設定されていません",
        )

    # yfinanceから価格データを取得
    try:
        price_history = YFinanceService.get_price_history(
            ticker_symbol=asset.ticker_symbol,
            category_id=asset.category_id,
            period=period,
        )
        return price_history
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@assets_router.get(
    "/{asset_id}/transactions",
    response_model=list[TransactionData],
    summary="購入履歴取得",
    description="指定された資産の購入履歴を取得します。",
)
async def get_asset_transactions(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    資産の購入履歴を取得。

    現在の実装では、初回購入日のみを返します。
    将来的にトランザクションテーブルを追加して、
    複数回の購入履歴を記録することを推奨します。

    Args:
        asset_id: 資産ID（UUID）

    Returns:
        購入履歴リスト

    Raises:
        404: 資産が見つかりません
    """
    # 資産の存在確認
    result = await db.execute(
        select(Asset).options(selectinload(Asset.category)).where(Asset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="資産が見つかりません")

    # Fetch transactions from DB
    txn_result = await db.execute(
        select(Transaction)
        .where(Transaction.asset_id == asset_id)
        .order_by(Transaction.transaction_date)
    )
    transactions = txn_result.scalars().all()

    if transactions:
        return [
            TransactionData(
                date=t.transaction_date.strftime("%Y-%m-%d"),
                quantity=t.quantity,
                price=t.price,
                usd_jpy_rate=t.usd_jpy_rate,
                total_cost=t.total_cost_jpy,
            )
            for t in transactions
        ]

    # Fallback for legacy data (no transaction records)
    # created_atを初回購入日として使用
    purchase_date = asset.created_at.date() if asset.created_at else date.today()

    # 購入価格は average_cost を使用
    purchase_price = asset.average_cost or Decimal("0")

    # 合計コスト（円建て）
    total_cost_jpy = (purchase_price * asset.quantity).quantize(Decimal("0.01"))
    if asset.currency == "USD":
        # USD資産の場合、為替レートが必要だが、履歴がないため現在のレートを使用
        # これは正確ではないが、簡易実装として許容
        # 注意: current_valueは現在の価格ベースなので、購入時のコストとは異なる可能性があるが
        # 履歴がない以上、推定するしかない。あるいは average_cost * quantity * assumed_rate
        # ここでは average_cost が USD であると仮定
        if asset.current_price and asset.current_price > 0:
            # 推定レート
            assumed_rate = (
                (asset.current_value / (asset.current_price * asset.quantity))
                if asset.quantity > 0
                else Decimal("150")
            )
            total_cost_jpy = (purchase_price * asset.quantity * assumed_rate).quantize(
                Decimal("0.01")
            )
        else:
            total_cost_jpy = (purchase_price * asset.quantity * Decimal("150")).quantize(
                Decimal("0.01")
            )

    transaction = TransactionData(
        date=purchase_date.strftime("%Y-%m-%d"),
        quantity=asset.quantity,
        price=purchase_price,
        usd_jpy_rate=None,  # 履歴がないため None
        total_cost=total_cost_jpy,
    )

    return [transaction]
