"""Schemas for price history and transactions."""

from decimal import Decimal

from pydantic import BaseModel


class PriceHistoryData(BaseModel):
    """Historical price data point."""

    date: str  # YYYY-MM-DD format
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int


class TransactionData(BaseModel):
    """Asset transaction/purchase data."""

    date: str  # YYYY-MM-DD format
    quantity: Decimal
    price: Decimal  # Purchase price per unit
    usd_jpy_rate: Decimal | None = None  # Exchange rate if USD asset
    total_cost: Decimal  # Total cost in JPY
