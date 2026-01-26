"""
yfinance service for fetching historical stock price data.
"""

from decimal import Decimal
from typing import Optional

import yfinance as yf
from pydantic import BaseModel


class PricePoint(BaseModel):
    """Single price data point."""

    date: str  # YYYY-MM-DD format
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int


class YFinanceService:
    """Service for fetching stock price data from yfinance."""

    @staticmethod
    def _get_ticker_symbol(ticker: str, category_id: int) -> str:
        """
        Convert ticker symbol to yfinance format.

        Args:
            ticker: Original ticker symbol
            category_id: Asset category ID (1=日本株, 2=米国株)

        Returns:
            Formatted ticker symbol for yfinance
        """
        # 日本株の場合、.T サフィックスを追加
        if category_id == 1:
            if not ticker.endswith(".T"):
                return f"{ticker}.T"
        return ticker

    @staticmethod
    def get_price_history(
        ticker_symbol: str,
        category_id: int,
        period: str = "1mo",
    ) -> list[PricePoint]:
        """
        Fetch historical price data from yfinance.

        Args:
            ticker_symbol: Stock ticker symbol
            category_id: Asset category ID (1=日本株, 2=米国株)
            period: Time period (7d, 1mo, 3mo, 1y, max)

        Returns:
            List of price data points

        Raises:
            ValueError: If ticker is invalid or data cannot be fetched
        """
        try:
            # Format ticker for yfinance
            formatted_ticker = YFinanceService._get_ticker_symbol(ticker_symbol, category_id)

            # Fetch data from yfinance
            ticker = yf.Ticker(formatted_ticker)
            hist = ticker.history(period=period)

            if hist.empty:
                raise ValueError(f"No data found for ticker: {formatted_ticker}")

            # Convert to our format
            price_points = []
            for date_idx, row in hist.iterrows():
                price_points.append(
                    PricePoint(
                        date=date_idx.strftime("%Y-%m-%d"),
                        open=Decimal(str(round(row["Open"], 2))),
                        high=Decimal(str(round(row["High"], 2))),
                        low=Decimal(str(round(row["Low"], 2))),
                        close=Decimal(str(round(row["Close"], 2))),
                        volume=int(row["Volume"]),
                    )
                )

            return price_points

        except Exception as e:
            raise ValueError(f"Failed to fetch price data: {e!s}") from e

    @staticmethod
    def get_current_price(ticker_symbol: str, category_id: int) -> Optional[Decimal]:
        """
        Get the current/latest price for a ticker.

        Args:
            ticker_symbol: Stock ticker symbol
            category_id: Asset category ID

        Returns:
            Current price or None if unavailable
        """
        try:
            formatted_ticker = YFinanceService._get_ticker_symbol(ticker_symbol, category_id)
            ticker = yf.Ticker(formatted_ticker)
            hist = ticker.history(period="1d")

            if hist.empty:
                return None

            return Decimal(str(round(hist["Close"].iloc[-1], 2)))

        except Exception:
            return None
