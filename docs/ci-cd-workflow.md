# CI/CD ワークフロー概要

本プロジェクトにおける品質管理（CI/CD）のフローを記載します。
ローカル開発時の `pre-commit` と、GitHub上の `GitHub Actions` の2段階で品質を担保します。

## 全体フロー

```mermaid
graph TD
    User[開発者] -->|git commit| PreCommit["pre-commit (Local)"]
    PreCommit -->|Pass| Commit[コミット完了]
    PreCommit -->|Fail| Fix[修正して再コミット]

    Commit -->|git push| GitHub[GitHub Repository]
    GitHub -->|Push/PR to main| Actions["GitHub Actions (CI) トリガー"]

    subgraph Local [ローカル環境]
        PreCommit -- フロントエンド --> BiomeCheck["Biome Check & Write"]
        PreCommit -- バックエンド --> RuffCheck["Ruff Check & Format"]
    end

    subgraph CI [GitHub Actions]
        Actions --> DiffCheck{"変更パスの検知<br>(Path Filters)"}

        DiffCheck -- "frontend/**" --> FE_Workflow["Frontend Workflow"]
        DiffCheck -- "backend/**" --> BE_Workflow["Backend Workflow"]
        DiffCheck -- 両方変更 --> Both["並列実行"]
        DiffCheck -- その他 --> Skip[スキップ]

        FE_Workflow --> FE_Steps["Setup Bun <br> Install Dependencies <br> Biome Check <br> Build"]
        BE_Workflow --> BE_Steps["Setup uv <br> Install Dependencies <br> Ruff Check <br> Ruff Format"]

        Both --> FE_Workflow
        Both --> BE_Workflow
    end
```

---

## 1. ローカルチェック (pre-commit)

コミットを行う直前に自動実行され、コードの整形と基本的なエラーチェックを行います。
ここでエラーになった場合、コミットは中断されます。

- **実行タイミング**: `git commit` 時
- **修正の自動化**: 可能な限り自動修正（`--write`, `--fix`）を行います。

### チェック内容

| 対象 | ツール | 実行コマンド（相当） | 内容 |
|------|--------|---------------------|------|
| **Frontend** | Biome | `biome check --write` | コード整形、Lintエラー修正、import整列 |
| **Backend** | Ruff | `ruff check --fix`<br>`ruff format` | コード整形、Lintエラー修正、import整列 |
| **共通** | pre-commit-hooks | - | 末尾の空白除去、改行コード統一、YAML構文チェック |

### セットアップ
```bash
# 初回のみ実行
pre-commit install
```

---

## 2. CIチェック (GitHub Actions)

`main` ブランチへのプルリクエストまたはプッシュ時に実行されます。
より厳密なチェックと、ビルドの成否を確認します。

- **実行タイミング**: `main` への `push` または `pull_request`

### ジョブ詳細

#### Frontend CI (Next.js + Biome)
1. **Setup**: `bun` 環境をセットアップ
2. **Install**: `bun install --frozen-lockfile` で依存関係インストール
3. **Lint & Format**: `bun run biome ci .` で変更漏れがないかチェック（修正はしない）
4. **Build**: `bun run build` でビルドが通るか確認

#### Backend CI (FastAPI + Ruff)
1. **Setup**: `uv` と Python 3.12 をセットアップ
2. **Install**: `uv sync` で依存関係インストール
3. **Lint**: `uv run ruff check .` で静的解析
4. **Format**: `uv run ruff format --check .` でフォーマット崩れがないかチェック
