---
description: データベースのセットアップとマイグレーション手順
---

# Database Setup Workflow

## 前提条件
- Docker Desktop が起動していること

## 手順

### 1. PostgreSQL を起動
```bash
docker compose up -d db
```

### 2. Backend コンテナを起動（Alembic 実行用）
```bash
docker compose up -d backend
```

### 3. マイグレーションを実行
```bash
docker compose exec backend alembic upgrade head
```

### 4. デモデータを投入
```bash
docker compose exec backend python -m app.seed
```

### 5. データ確認（オプション）
```bash
# テーブル一覧
docker compose exec db psql -U postgres -d appdb -c "\dt"

# スナップショット数
docker compose exec db psql -U postgres -d appdb -c "SELECT COUNT(*) FROM asset_snapshots;"

# 貯金目標
docker compose exec db psql -U postgres -d appdb -c "SELECT * FROM savings_goals;"
```

### 6. pgAdmin でアクセス（オプション）
```bash
docker compose up -d pgadmin
```
- URL: http://localhost:5050
- Email: admin@admin.com
- Password: admin
- DB Host: db
- DB User/Password: postgres/postgres

## トラブルシューティング

### Alembic バージョンエラーが発生した場合
```bash
# alembic_version テーブルをリセット
docker compose exec db psql -U postgres -d appdb -c "DROP TABLE IF EXISTS alembic_version CASCADE;"

# 再度マイグレーション
docker compose exec backend alembic upgrade head
```

### すべてリセットしたい場合
```bash
docker compose down -v
docker compose up -d db backend
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```
