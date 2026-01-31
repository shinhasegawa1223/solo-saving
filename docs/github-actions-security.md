# GitHub Actions セキュリティ: アクションのハッシュ固定

## なぜハッシュ化するのか？

```yaml
# ❌ タグ指定（危険）
- uses: actions/checkout@v4

# ✅ SHA指定（推奨）
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
```

### リスク

| 指定方法 | リスク |
|---------|-------|
| `@v4` | タグは上書き可能。悪意ある変更が混入する可能性 |
| `@SHA` | 特定コミットに固定。改ざん不可能 |

---

## SHAの取得方法

### 方法1: GitHub CLI（推奨）

```bash
# インストール（未導入の場合）
brew install gh

# SHAを取得
gh api repos/actions/checkout/git/ref/tags/v4 --jq '.object.sha'
# 出力: b4ffde65f46336ab88eb53be808477a3936bae11
```

### 方法2: GitHubのWeb画面

1. アクションのリポジトリへ移動
   例: https://github.com/actions/checkout
2. 「Releases」または「Tags」をクリック
3. 対象バージョン（v4）のコミットをクリック
4. URLまたは画面に表示される40文字のSHAをコピー

### 方法3: git コマンド

```bash
git ls-remote --tags https://github.com/actions/checkout.git | grep 'v4$'
# 出力: b4ffde65f46336ab88eb53be808477a3936bae11	refs/tags/v4
```

---

## 主要アクションのSHA例

```yaml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4
- uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v4
- uses: docker/build-push-action@4a13e500e55cf31b7a5d59a38ab2040ab0f42f56 # v5
- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502 # v4
```

---

## Dependabotで自動更新

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

→ SHA指定でもDependabotが新バージョンのSHAを自動でPR作成してくれる

---

## 結論

| 環境 | 推奨 |
|-----|------|
| 本番・チーム開発 | ✅ SHA固定必須 |
| 個人開発 | ⚠️ タグでも可（リスク理解の上） |
