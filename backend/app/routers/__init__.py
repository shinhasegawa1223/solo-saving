"""
Solo Saving API ルーター

各機能ごとに分割されたAPIエンドポイントを定義します。
- 資産カテゴリ: マスタデータの取得
- 資産: 個別銘柄のCRUD操作
- スナップショット: チャート表示用の日次データ
- 貯金目標: 目標設定と進捗管理
- ダッシュボード: 統計情報とポートフォリオ

このモジュールはすべてのルーターを再エクスポートして後方互換性を維持します。
"""

from app.routers.assets import assets_router
from app.routers.cash import cash_router
from app.routers.categories import categories_router
from app.routers.dashboard import dashboard_router
from app.routers.goals import goals_router
from app.routers.snapshots import snapshots_router

__all__ = [
    "categories_router",
    "assets_router",
    "snapshots_router",
    "goals_router",
    "dashboard_router",
    "cash_router",
]
