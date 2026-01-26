# システムアーキテクチャ仕様書

## 1. 概要

本ドキュメントは、Solo Saving アプリケーションのAWSインフラストラクチャ構成を定義します。
高可用性、セキュリティ、運用保守性を考慮したコンテナベースのアーキテクチャを採用します。

## 1.1 なぜこのアーキテクチャか？（設計意図）

本アーキテクチャは以下の目的・背景から設計されました。

### コンテナベース（ECS Fargate）を選択した理由
- **運用負荷の最小化**: 個人開発プロジェクトのため、サーバー管理（OSパッチ、スケーリング）に時間を割きたくない。Fargateならサーバーレスでインフラ管理不要。
- **コスト効率**: EC2インスタンスを常時起動するより、Fargateで必要な分だけ課金される方が個人利用には適している。
- **将来の拡張性**: Kubernetes（EKS）への移行も視野に入れつつ、まずは学習コストの低いECSで開始。

### Multi-AZ構成を採用した理由
- **可用性の担保**: 単一AZ障害時でもサービスを継続できるようにするため。個人アプリとはいえ、日々の資産管理に使うため「見れない」状況を避けたい。
- **AWS Well-Architected Framework準拠**: 本番環境のベストプラクティスを個人開発でも実践し、学習機会とする。

### NAT Gatewayを使用しない理由
- **コスト削減**: NAT Gatewayは時間課金＋データ転送課金があり、個人プロジェクトには高コスト。
- **VPC Endpointsで代替可能**: AWSサービス（ECR, CloudWatch, SSM）へのアクセスはVPC Endpoints経由で完結するため、外部インターネットアクセスが不要。

### バックエンドへの直接アクセスを禁止した理由
- **セキュリティの多層防御**: APIを直接公開せず、フロントエンド経由のみとすることで攻撃対象面（Attack Surface）を縮小。
- **将来の認証追加を見据えた設計**: Cognito等を追加する際、フロントエンドで認証を一元管理しやすい構造にしておく。

---

## 2. システム構成図

![AWS Architecture](./images/aws_architecture.png)
*※ 構成図の元ファイル: `docs/aws_architecture.drawio`*

---

## 3. セキュリティ設計（強化版）

### 3.1 ネットワークセキュリティ
- **Multi-AZ構成**:
  - ap-northeast-1a と ap-northeast-1c の2つのAZに分散配置し、高可用性を確保。
  - Public SubnetにALBを配置し、各AZのPrivate Subnetに負荷分散。
- **VPC設計**:
  - **Public Subnet**: ALBのみを配置（NAT Gatewayは不要のため削除）。
  - **Private Subnet (App)**: ECSタスクを配置。直接のインターネット接続を遮断。
  - **Private Subnet (DB)**: Aurora RDSを配置。AppサブネットからのDBポートアクセスのみ許可。
- **バックエンドアクセス制御**:
  - **Backend (FastAPI) はFrontend (Next.js) からのみアクセス可能**。
  - ALBからBackendへの直接アクセスは不可。Frontendを経由した内部通信のみ。
- **VPC Endpoints (PrivateLink)**:
  - ECR (DKR/API), CloudWatch Logs, SSM (Parameter Store), S3 Gateway Endpoint を配置。
  - 外部インターネットへのアクセスが不要なため、NAT Gatewayは使用しない。
  - AWSサービスへの通信はVPC Endpoints経由でAWSバックボーンネットワーク内で完結。
- **Route 53, ACM & WAF**:
  - **Route 53**: ドメイン管理とDNSルーティング。
  - **ACM (AWS Certificate Manager)**: SSL/TLS証明書を管理し、ALBにHTTPSを提供。
  - **WAF**: SQLインジェクション、XSS、Geo-blocking等の攻撃をエッジで防御。

### 3.2 データセキュリティ
- **AWS Systems Manager Parameter Store**:
  - データベース認証情報（ホスト、ユーザー、パスワード）、APIキー等の機密情報を安全に管理。
  - SecureString タイプでパラメータを暗号化保存。
  - **ECSタスク (Backend)** および **Aurora RDS** の接続情報をParameter Storeから取得。
  - ECSタスク定義では環境変数の値を直接記述せず、Parameter Store のパラメータ ARN を参照してコンテナ起動時に安全に注入します。
- **暗号化**:
  - Aurora PostgreSQL のストレージ暗号化は RDS の組み込み暗号化機能を使用。
  - 転送中のデータは TLS により保護。

### 3.3 権限管理 (IAM)
- **最小権限の原則 (Least Privilege)**:
  - **Task Execution Role**: コンテナイメージのPull (ECR) とログ出力 (CloudWatch)、Parameter Store読み取り権限のみを付与。
  - **Task Role**: アプリケーションコードが必要とするAWSサービス（例: S3へのファイルアップロード等があれば）へのアクセス権限のみを付与。

---

## 4. インフラストラクチャ詳細

### 4.1 コンピュート (ECS Fargate)
- **ECS Service**: フロントエンドとバックエンドを個別のサービスとして定義。
- **Fargate**: サーバーレス実行環境。ホストOSの管理・パッチ当て不要。
- **Auto Scaling**: CPU/メモリ使用率に基づきタスク数を自動調整。

### 4.2 データベース (Aurora PostgreSQL)
- **Multi-AZ配置**: Primary (AZ-a) と Replica (AZ-c) で自動同期。
- **Serverless v2**: 負荷に応じてACU (Aurora Capacity Unit) を細かく自動スケーリング。コスト効率とパフォーマンスを両立。

### 4.3 CI/CD パイプライン

#### インフラ構築 (IaC)
- **Terraform**: AWSリソースをコードで管理。
  - VPC, Subnet, Security Group, ALB, ECS, RDS, Parameter Store等を定義。
  - GitHub Actionsから `terraform apply` を実行。

#### アプリケーションデプロイ
- **GitHub Actions**: mainブランチへのマージをトリガーに自動デプロイ。
- **Amazon ECR**: Dockerイメージのプライベートレジストリ。
- **デプロイフロー**:
  1. GitHub にコードをPush
  2. GitHub Actions がトリガー
  3. Dockerイメージをビルド
  4. ECR にイメージをPush
  5. ECS サービスを更新（新しいタスク定義でデプロイ）

#### 監視・ロギング
- **CloudWatch Logs**: アプリケーションログ、データベースログを集約。
- **CloudWatch Alarms**: 異常検知時にSNS経由で管理者に通知。

---

## 5. セキュリティグループ設計概要

| SG名称 | インバウンド許可 | アウトバウンド許可 | 備考 |
|--------|------------------|--------------------|------|
| **ALB SG** | 0.0.0.0/0 (HTTPS:443) | App SG (HTTP:80) | インターネットからのアクセス |
| **App SG** | ALB SG (HTTP:80) | RDS SG (5432), VPC Endpoints (443) | アプリケーションコンテナ用 |
| **RDS SG** | App SG (5432) | なし | データベース用 |
| **VPCE SG**| App SG (443) | なし | VPCエンドポイント用 |
