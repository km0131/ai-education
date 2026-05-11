# プロジェクトの完全API化（RESTful API）移行計画

このプロジェクトを現在のHTMLレンダリング混在型から、バックエンド（Go）を純粋なAPIサーバー、フロントエンド（Next.js）をSPA/SSGとする完全APIベースの構成に移行します。

## 1. バックエンド（Go/Gin）のリファクタリング
- [ ] **HTMLレンダリングの廃止**: `main.go` から `LoadHTMLGlob` や `Static` の設定を削除し、純粋なJSONサーバーにする。
- [ ] **ハンドラーのJSON化**: `internal/handler/handler.go` の `c.HTML` を全て `c.JSON` に置き換える。
- [ ] **レスポンス構造の統一**: 成功時とエラー時のJSONフォーマットをプロジェクト全体で統一する。
- [ ] **認証フローのAPI化**:
    - `POST /api/v1/auth/login/check`: ユーザー確認（画像リスト返却）
    - `POST /api/v1/auth/login/verify`: 画像認証実行
    - `POST /api/v1/auth/signup/images`: 新規登録用画像取得
    - `POST /api/v1/auth/register`: ユーザー登録
- [ ] **CORS設定の最適化**: フロントエンド（port 3000）からのリクエストを許可。

## 2. API仕様の定義（OpenAPI 3.0）
- [ ] `backend/docs/openapi.yaml` の拡充。
- [ ] 全てのエンドポイント、リクエストボディ、レスポンススキーマを定義。
- [ ] `swag` コマンドによるGoコードからのSwagger自動生成を継続、またはOpenAPI定義からのコード生成（oapi-codegen）への移行を検討。

## 3. フロントエンド（Next.js）の統合
- [ ] **モックAPIの削除**: `frontend/app/api/` 下にある現在のモック実装を削除。
- [ ] **バックエンドAPIへの接続**: `fetch` または `axios` を使用して、Goバックエンド（:8080）を直接叩くように修正。
- [ ] **APIクライアントの整備**: Orval等を使用して、OpenAPI定義から型安全なAPIクライアントを自動生成する。
- [ ] **フロントエンドスタックの整理**: `Hono`（`src/index.ts`）を削除し、Next.jsに一本化する。

## 4. インフラ・デプロイ環境
- [ ] `docker-compose.yml` の環境変数の整理。
- [ ] `Makefile` にAPI生成・フロントエンドビルドのコマンドを追加。

---

## ステップ別実施項目

### フェーズ1: バックエンドの基盤整備
1. `handler.go` を修正し、既存の機能をJSON APIとして提供する。
2. `main.go` のルーティングを `/api/v1/` 下に整理する。

### フェーズ2: フロントエンドの接続
1. Next.js の `page.tsx` 内の `fetch` 先をバックエンドに変更する。
2. 開発環境でのプロキシ設定（Next.js rewriteなど）を検討する。

### フェーズ3: 型安全性の向上
1. OpenAPI定義を完成させる。
2. フロントエンドに自動生成された型を導入する。
