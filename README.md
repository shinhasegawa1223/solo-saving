# Full Stack Development Environment

Next.js (Frontend) + FastAPI (Backend) + PostgreSQL (Database) の完全な開発環境です。
Docker を使用して環境構築されているため、ローカルに `bun` や `uv` がインストールされていなくても動作します。

## 🛠 技術スタック

- **Frontend**: Next.js (App Router), Bun, Biome, Tailwind CSS, Recharts
- **Backend**: FastAPI, uv (Package Manager), Ruff (Linter/Formatter)
- **Database**: PostgreSQL
- **Tools**: Docker Compose, pgAdmin4

## 🚀 起動方法

Docker Desktop が起動していることを確認してから、以下のコマンドを実行してください。

```bash
docker compose up -d
```

初回起動時は各種 Docker イメージのビルドと依存関係のインストールが行われるため、数分かかる場合があります。

## 🌐 アクセス

起動後、以下の URL で各サービスにアクセスできます。

| サービス | URL | 備考 |
| --- | --- | --- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | 疎通確認用ページが表示されます |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | API エンドポイント |
| **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI |
| **pgAdmin** | [http://localhost:5050](http://localhost:5050) | DB管理ツール |

### pgAdmin ログイン情報

- **Email**: `admin@admin.com`
- **Password**: `admin`

**DBサーバーへの接続設定**:
- Host name/address: `db`
- Username: `postgres`
- Password: `postgres`

## 💻 開発コマンド

ホストマシンにツールがない場合、Docker 経由でコマンドを実行できます。

### Backend (uv)

パッケージの追加:
```bash
docker compose exec backend uv add <package_name>
```

Lint/Format の実行 (Ruff):
```bash
docker compose exec backend uv run ruff check .
docker compose exec backend uv run ruff format .
```

### Frontend (Bun)

パッケージの追加:
```bash
docker compose exec frontend bun add <package_name>
```

Lint/Format の実行 (Biome):
```bash
docker compose exec frontend bun run lint
docker compose exec frontend bun run format
```

## 停止方法

```bash
docker compose down
```

## ドキュメント一覧

プロジェクトの各ドキュメントへのリンクです。

- [**CI/CD Workflow**](docs/ci-cd-workflow.md)
  - CI/CDパイプラインの詳細とワークフローについて解説しています。
- [**Git運用ルール**](docs/git.md)
  - コミットメッセージの規約やブランチ戦略について記載しています。
- [**RLS Decision**](docs/rls-decision.md)
  - Row Level Security (RLS) の採用理由と設計について説明しています。
- [**技術選定比較**](docs/technology-comparison.md)
  -採用した技術スタックと、比較検討した他の技術についての詳細です。
- [**IDE選定**](docs/ide-selection.md)
  - Google Antigravityを採用した理由と、コストメリット（3ヶ月950円等）について記載しています。
