"""
Solo Saving API - メインアプリケーションエントリーポイント

このファイルはFastAPIアプリケーションの設定とルーターの登録を行います。
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    assets_router,
    cash_router,
    categories_router,
    dashboard_router,
    goals_router,
    snapshots_router,
)
from app.stock_router import stock_router

# ==============================================
# FastAPI アプリケーション設定
# ==============================================
app = FastAPI(
    title="Solo Saving API",
    description="""
## 個人資産管理 API

Solo Saving は個人の資産を管理・可視化するためのAPIです。

### 主な機能

* **資産カテゴリ** - 日本株、米国株、投資信託、現金などのカテゴリ管理
* **資産管理** - 個別銘柄の登録・更新・削除
* **スナップショット** - 日次の資産推移データ
* **貯金目標** - 目標金額と進捗の管理
* **ダッシュボード** - 統計情報とポートフォリオ構成

### 技術スタック

* FastAPI + SQLAlchemy (非同期)
* PostgreSQL
* Pydantic v2
    """,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "資産カテゴリ",
            "description": "資産カテゴリ（日本株、米国株、投資信託、現金）のマスタデータ",
        },
        {
            "name": "資産",
            "description": "個別資産（銘柄）の CRUD 操作",
        },
        {
            "name": "スナップショット",
            "description": "日次の資産スナップショット（チャート表示用）",
        },
        {
            "name": "貯金目標",
            "description": "貯金目標の設定と進捗管理",
        },
        {
            "name": "ダッシュボード",
            "description": "統計情報とポートフォリオ構成の取得",
        },
    ],
)

# ==============================================
# CORS（クロスオリジンリソース共有）設定
# フロントエンド（localhost:3000）からのアクセスを許可
# ==============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],  # すべてのHTTPメソッドを許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)

# ==============================================
# ルーターの登録
# 各機能ごとにルーターを分割して管理
# ==============================================
app.include_router(categories_router)
app.include_router(assets_router)
app.include_router(snapshots_router)
app.include_router(goals_router)
app.include_router(dashboard_router)
app.include_router(stock_router)
app.include_router(cash_router)


# ==============================================
# ヘルスチェックエンドポイント
# ==============================================
@app.get(
    "/",
    summary="ルートエンドポイント",
    description="APIが稼働しているかを確認するためのエンドポイント",
    tags=["ヘルスチェック"],
)
async def root():
    """
    APIのルートエンドポイント。

    Returns:
        APIが稼働中であることを示すメッセージ
    """
    return {"message": "Solo Saving API is running", "status": "ok"}


@app.get(
    "/health",
    summary="ヘルスチェック",
    description="アプリケーションの状態を確認",
    tags=["ヘルスチェック"],
)
async def health():
    """
    ヘルスチェックエンドポイント。

    ロードバランサーやモニタリングツールから
    アプリケーションの稼働状態を確認するために使用。

    Returns:
        ステータスOKを示すJSON
    """
    return {"status": "ok"}
