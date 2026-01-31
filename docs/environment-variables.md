# 環境変数管理方針

## 3つのパターン一覧

| パターン | 用途 | 設定タイミング |
|---------|------|---------------|
| 🔐 **Parameter Store** | 機密情報 | ECS起動時 |
| 📝 **ECS環境変数** | 非機密設定 | タスク定義 |
| 🏗️ **build-arg** | `NEXT_PUBLIC_*` | ビルド時 |

---

## 🔐 パターン1: Parameter Store

**用途**: DBパスワード、APIキーなど機密情報

| メリット | デメリット |
|---------|-----------|
| ✅ 暗号化保存 | ❌ IAM設定が必要 |
| ✅ 変更時に再デプロイ不要 | ❌ 高頻度アクセスは課金対象 |
| ✅ CloudTrailで監査可能 | |

**ECSタスク定義**
```json
{
  "secrets": [{
    "name": "DATABASE_URL",
    "valueFrom": "arn:aws:ssm:ap-northeast-1:123456789:parameter/solo-saving/DATABASE_URL"
  }]
}
```

**Next.js（サーバーサイドのみ）**
```typescript
// app/api/route.ts
const dbUrl = process.env.DATABASE_URL;
```

---

## 📝 パターン2: ECS環境変数

**用途**: ログレベルなど非機密設定

| メリット | デメリット |
|---------|-----------|
| ✅ 設定がシンプル | ❌ 平文で保存される |
| ✅ 無料 | ❌ 変更時は再デプロイ |

**ECSタスク定義**
```json
{
  "environment": [
    { "name": "LOG_LEVEL", "value": "INFO" }
  ]
}
```

**Next.js（サーバーサイドのみ）**
```typescript
const logLevel = process.env.LOG_LEVEL || "INFO";
```

---

## 🏗️ パターン3: build-arg

**用途**: `NEXT_PUBLIC_*` 環境変数

| メリット | デメリット |
|---------|-----------|
| ✅ クライアントJSで使える | ❌ 変更時は再ビルド |
| ✅ 設定がシンプル | ❌ 環境ごとに別イメージ必要 |

> ⚠️ **重要**: `NEXT_PUBLIC_*` はビルド時にJSへ埋め込まれる。
> ECS環境変数で設定しても**効かない**。

**Dockerfile**
```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build
```

**GitHub Actions**
```yaml
- run: docker build --build-arg NEXT_PUBLIC_API_URL=${{ secrets.API_URL }} -t frontend .
```

**Next.js（クライアント・サーバー両方OK）**
```typescript
"use client";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
fetch(`${apiUrl}/api/data`);
```

---

## 早見表

| 環境変数 | 保存先 | 使用場所 |
|---------|-------|---------|
| `DATABASE_URL` | Parameter Store | サーバーのみ |
| `API_SECRET_KEY` | Parameter Store | サーバーのみ |
| `LOG_LEVEL` | ECS環境変数 | サーバーのみ |
| `NEXT_PUBLIC_API_URL` | build-arg | クライアント+サーバー |
