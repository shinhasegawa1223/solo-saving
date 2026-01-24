"""
Pydantic スキーマ定義

API のリクエスト/レスポンスのバリデーションを行うスキーマ。
各スキーマは対応するSQLAlchemyモデルと連携します。

このモジュールはすべてのスキーマを再エクスポートして後方互換性を維持します。
"""

# カテゴリ
# 資産
from app.schemas.asset import (
    AssetBase,
    AssetCreate,
    AssetPurchaseRequest,
    AssetResponse,
    AssetUpdate,
    CashTransactionRequest,
)
from app.schemas.category import AssetCategoryBase, AssetCategoryResponse

# ダッシュボード
from app.schemas.dashboard import DashboardStats, PortfolioItem

# 目標
from app.schemas.goal import (
    SavingsGoalBase,
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsGoalUpdate,
)

# 履歴
from app.schemas.history import (
    AssetHistoryBase,
    AssetHistoryChartData,
    AssetHistoryCreate,
    AssetHistoryResponse,
)

# スナップショット
from app.schemas.snapshot import (
    AssetSnapshotBase,
    AssetSnapshotChartData,
    AssetSnapshotCreate,
    AssetSnapshotResponse,
)

__all__ = [
    # カテゴリ
    "AssetCategoryBase",
    "AssetCategoryResponse",
    # 資産
    "AssetBase",
    "AssetCreate",
    "AssetPurchaseRequest",
    "CashTransactionRequest",
    "AssetUpdate",
    "AssetResponse",
    # 履歴
    "AssetHistoryBase",
    "AssetHistoryCreate",
    "AssetHistoryResponse",
    "AssetHistoryChartData",
    # スナップショット
    "AssetSnapshotBase",
    "AssetSnapshotCreate",
    "AssetSnapshotResponse",
    "AssetSnapshotChartData",
    # 目標
    "SavingsGoalBase",
    "SavingsGoalCreate",
    "SavingsGoalUpdate",
    "SavingsGoalResponse",
    # ダッシュボード
    "DashboardStats",
    "PortfolioItem",
]
