"""
SQLAlchemy models for Solo Saving application.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class AssetCategory(Base):
    """Asset category master table (日本株, 米国株, 投資信託, 現金)."""

    __tablename__ = "asset_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name_en: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    assets: Mapped[list["Asset"]] = relationship("Asset", back_populates="category")

    def __repr__(self) -> str:
        return f"<AssetCategory(id={self.id}, name='{self.name}')>"


class Asset(Base):
    """Individual asset (stock, fund, cash, etc.)."""

    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("asset_categories.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    ticker_symbol: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0"))
    average_cost: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    current_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    current_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="JPY")
    total_cost_jpy: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    category: Mapped["AssetCategory"] = relationship("AssetCategory", back_populates="assets")
    histories: Mapped[list["AssetHistory"]] = relationship(
        "AssetHistory", back_populates="asset", cascade="all, delete-orphan"
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="asset", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("idx_assets_category_id", "category_id"),)

    def __repr__(self) -> str:
        return f"<Asset(id={self.id}, name='{self.name}')>"


class AssetHistory(Base):
    """Historical record of asset value/price per day."""

    __tablename__ = "asset_histories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(18, 4), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="histories")

    __table_args__ = (
        UniqueConstraint("asset_id", "record_date", name="uq_asset_history_date"),
        Index("idx_asset_histories_asset_id", "asset_id"),
        Index("idx_asset_histories_record_date", "record_date"),
    )

    def __repr__(self) -> str:
        return f"<AssetHistory(id={self.id}, record_date={self.record_date})>"


class AssetSnapshot(Base):
    """Daily snapshot of total assets by category (for charts)."""

    __tablename__ = "asset_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    snapshot_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    total_assets: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    japanese_stocks: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0")
    )
    us_stocks: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    investment_trusts: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0")
    )
    cash: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    holding_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    yield_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    __table_args__ = (Index("idx_asset_snapshots_snapshot_date", "snapshot_date"),)

    def __repr__(self) -> str:
        return f"<AssetSnapshot(id={self.id}, date={self.snapshot_date})>"


class SavingsGoal(Base):
    """Savings goal configuration."""

    __tablename__ = "savings_goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    target_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    current_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0")
    )
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<SavingsGoal(id={self.id}, label='{self.label}')>"


class Transaction(Base):
    """Asset purchase/sell transaction history."""

    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "buy", "sell"
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    price: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False
    )  # Unit price in original currency
    usd_jpy_rate: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="JPY")
    total_cost_jpy: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="transactions")

    __table_args__ = (
        Index("idx_transactions_asset_id", "asset_id"),
        Index("idx_transactions_date", "transaction_date"),
    )

    def __repr__(self) -> str:
        return (
            f"<Transaction(id={self.id}, asset_id={self.asset_id}, type={self.transaction_type})>"
        )
