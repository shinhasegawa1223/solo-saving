"""
株式情報検索 API ルーター

yfinance を使用して株式シンボルから銘柄情報を検索します。
- 日本株: {symbol}.T（例: 7203.T → トヨタ自動車）
- 米国株: {symbol}（例: AAPL → Apple Inc.）
"""

from decimal import Decimal

import yfinance as yf
from fastapi import APIRouter, Query
from pydantic import BaseModel

stock_router = APIRouter(
    prefix="/api/stocks",
    tags=["株式検索"],
)


class StockSearchResult(BaseModel):
    """株式検索結果"""

    symbol: str
    name: str
    currency: str
    current_price: Decimal | None
    market: str  # "JP" or "US" or "OTHER"


class StockSearchResponse(BaseModel):
    """株式検索レスポンス"""

    success: bool
    data: StockSearchResult | None = None
    error: str | None = None


@stock_router.get(
    "/search",
    response_model=StockSearchResponse,
    summary="株式シンボル検索",
    description="ティッカーシンボルから銘柄情報を検索します。",
)
async def search_stock(
    symbol: str = Query(
        ...,
        min_length=1,
        max_length=20,
        description="ティッカーシンボル（日本株は証券コードのみ、米国株はティッカー）",
    ),
    market: str = Query(
        default="auto",
        description="市場指定: 'jp'（日本株）, 'us'（米国株）, 'auto'（自動判定）",
    ),
):
    """
    株式シンボルから銘柄情報を検索。

    Args:
        symbol: ティッカーシンボル
        market: 市場指定（jp/us/auto）

    Returns:
        銘柄情報（シンボル、銘柄名、通貨、現在価格、市場）
    """
    try:
        # 市場の判定とシンボル形式の調整
        if market == "jp" or (market == "auto" and symbol.isdigit()):
            # 日本株: 数字のみの場合は.Tを付与
            full_symbol = f"{symbol}.T" if not symbol.endswith(".T") else symbol
            detected_market = "JP"
        elif market == "us":
            full_symbol = symbol.upper()
            detected_market = "US"
        else:
            # 自動判定: まず米国株として検索
            full_symbol = symbol.upper()
            detected_market = "US"

        # yfinance で情報を取得
        ticker = yf.Ticker(full_symbol)
        info = ticker.info

        # 銘柄名を取得（複数のフィールドを試行）
        name = info.get("longName") or info.get("shortName") or info.get("displayName") or ""

        if not name:
            # 米国株として見つからない場合、日本株として再試行
            if detected_market == "US" and market == "auto":
                jp_symbol = f"{symbol}.T"
                ticker = yf.Ticker(jp_symbol)
                info = ticker.info
                name = (
                    info.get("longName") or info.get("shortName") or info.get("displayName") or ""
                )
                if name:
                    full_symbol = jp_symbol
                    detected_market = "JP"

        if not name:
            return StockSearchResponse(
                success=False,
                error=f"銘柄 '{symbol}' が見つかりません",
            )

        # 現在価格を取得
        current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        currency = info.get("currency", "JPY" if detected_market == "JP" else "USD")

        return StockSearchResponse(
            success=True,
            data=StockSearchResult(
                symbol=full_symbol,
                name=name,
                currency=currency,
                current_price=Decimal(str(current_price)) if current_price else None,
                market=detected_market,
            ),
        )

    except Exception as e:
        return StockSearchResponse(
            success=False,
            error=f"検索エラー: {str(e)}",
        )
