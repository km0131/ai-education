
# プロジェクト概要（要約）

このリポジトリは、バックエンド（GoとOpenAPI想定）とフロントエンド（Next.js）を含む学習用のフルスタック構成です。ローカル実行は `docker-compose.yml` を使ってサービス（DB、backend、frontend）を起動する想定です。

## フォルダ構成（主要）

- `backend/`：Go 製（想定）のサーバー実装。`Dockerfile` があり、`docker-compose.yml` でビルドされる。
- `frontend/`：Next.js（app router）によるフロントエンド。`app/` ディレクトリに `layout.tsx` と `page.tsx` がある。
- `openapi/`：OpenAPI または API 仕様関連。`schema.yaml` が存在し、生成設定（gin-server 等）が記述されている。
- ルート直下：`docker-compose.yml`（開発用のサービス定義）、`ai-education.md`（このファイル）など。

## 主要ライブラリ・ツール（抽出結果）

- フロントエンド（`frontend/package.json`）
	- ランタイム: `next` 16.x、`react` 19.x、`react-dom` 19.x
	- 開発依存: `typescript`, `eslint`, `tailwindcss`, `@tailwindcss/postcss`, `eslint-config-next` など
	- スクリプト: `dev`, `build`, `start`, `lint`
- API/OpenAPI
	- `openapi/schema.yaml` に `gin-server` の生成設定やモデル生成の設定があり、自動生成を想定している（出力先例: `api/generated.go`）。
- コンテナ/環境
	- `docker-compose.yml` で `postgres:15-alpine`（DB）、`backend`（./backend の Dockerfile をビルド）、`frontend`（./frontend をビルド）を定義。
	- 環境変数は `.env` 経由で注入される想定（`POSTGRES_USER` 等）。

## 開発・実行方法（開発者向けメモ）

- ローカル（docker-compose）起動例：

```
docker compose up --build
```

- フロントエンド単体（ローカル開発）:

```
cd frontend
npm run dev
```

## 補足・観察事項

- `frontend` は Next.js の `app` ディレクトリ構成を使用しているため、React 18+ / Next 13+ 系のアーキテクチャに沿った設計。
- `openapi/schema.yaml` の設定から、サーバー側は OpenAPI からコード生成（gin-server）を行うワークフローが想定される。
- `docker-compose.yml` では `frontend` の `node_modules` をホストと共有しないようボリューム指定が工夫されている（プラットフォーム差分対策）。

---

必要なら、このファイルに「依存パッケージ一覧（バージョン付き）」「起動手順の詳細」「環境変数一覧（.env で必要なキー）」を追記します。どれを追加しますか？

## ディレクトリ構成（図）

```
ai-education/
├─ ai-education.md
├─ docker-compose.yml
├─ backend/
│  ├─ Dockerfile
│  └─ .air.toml
├─ frontend/
│  ├─ Dockerfile
│  ├─ package.json
│  └─ app/
│     ├─ layout.tsx
│     └─ page.tsx
└─ openapi/
	 └─ schema.yaml
```

## バックエンド構成（詳細）

- 実行環境
	- コンテナベース: `golang:1.24-alpine` をベースにビルドする Dockerfile を使用。
	- 開発向けにホットリロードツールとして `github.com/air-verse/air`（`air`）をインストールし、コンテナ起動時に `air -c .air.toml` を実行する設定になっています。

- ビルド手順（Dockerfile より）
	1. 必要パッケージ（`git`, `gcc`, `musl-dev`）を apk でインストール。
	2. `go.mod` / `go.sum` をコピーして `go mod download` を実行（依存をキャッシュ）。
	3. ソースをコピーして `air` を利用した開発用実行コマンドで起動。

- 開発ワークフロー
	- `docker-compose.yml` では `./backend` をコンテナ内 `/app` にマウントしており、ソース編集が即座に反映される想定（`air` による監視）。
	- 実運用では `air` を使わずバイナリをビルドして `./bin/app` 等を起動する方式に切り替えることが一般的です。

- API とコード生成
	- リポジトリの `openapi/schema.yaml` には `gin-server` の自動生成設定があり、OpenAPI から Go のサーバー/モデルを生成するワークフローを想定しています（例: 出力先 `api/generated.go`）。

## データベース（PostgreSQL）について

- 主要設定（`docker-compose.yml` から）
	- イメージ: `postgres:15-alpine`
	- ポート: ホスト側の `${DB_PORT}` をコンテナの `5432` にマッピング（`.env` に `DB_PORT` を設定）
	- 永続化: ホストの `./postgres_data` をコンテナの `/var/lib/postgresql/data` にマウント
	- 環境変数: `.env` 経由で `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`（`DB_USER`, `DB_PASSWORD`, `DB_NAME` などが使われている想定）を渡す

- 接続と依存関係
	- `backend` コンテナには環境変数 `DB_HOST: db` が設定されており、サービス名 `db` をホスト名として Postgres に接続する設計です。
	- `backend` の `depends_on` に `condition: service_healthy` が使われています。これを確実に機能させるには `db` サービス側に `healthcheck` が定義されていることが望ましく、定義がない場合は起動順序の保証が弱くなります。

## 推奨確認事項 / 次の作業候補

- `.env` ファイルの必須キー一覧を `ai-education.md` に追加
- `backend` の `go.mod` / エントリポイント（`main.go` 等）の有無を確認して、起動手順を明確化
- OpenAPI 生成手順（使用ツール、コマンド例）をドキュメント化

必要なら、上記のうちどれを優先して追記しますか？

---

## 詳細なディレクトリ構成

```
ai-education/
│
├─ Makefile                          # 開発タスク（API生成など）定義
├─ docker-compose.yml                # ローカル開発用マルチコンテナ設定
├─ ai-education.md                   # このファイル・プロジェクト全体ドキュメント
│
├─ backend/
│  ├─ Dockerfile                     # 開発用Dockerfile（air ホットリロード付き）
│  ├─ Dockerfile.prod                # 本番用Dockerfile（multi-stage, 静的バイナリ生成）
│  ├─ .air.toml                      # air（ホットリロード）設定
│  ├─ go.mod / go.sum                # Go 依存関係管理（swaggo, gin, gin-swagger等）
│  ├─ server                         # コンパイルされたバイナリ（本番用）
│  │
│  ├─ cmd/
│  │  └─ main.go                     # エントリー: @Router, @Summary 等で API 定義
│  │
│  ├─ docs/                          # 自動生成フォルダ（swag init で生成）
│  │  ├─ docs.go                     # swag が生成した Go パッケージ
│  │  ├─ swagger.json / swagger.yaml # Swagger 2.0 形式
│  │  └─ openapi.yaml                # OpenAPI 3.0 形式（Makefile で生成）
│  │
│  └─ internal/                      # (現在は空) 将来の内部ライブラリ
│
├─ frontend/
│  ├─ Dockerfile                     # Next.js 本番用
│  ├─ package.json                   # Node.js 依存関係
│  ├─ tsconfig.json / next.config.ts # TS, Next.js 設定
│  ├─ app/
│  │  ├─ layout.tsx / page.tsx       # App Router
│  │  └─ globals.css
│  │
│  ├─ src/api/
│  │  └─ api.d.ts                    # 自動生成型定義（openapi-typescript）
│  │
│  └─ public/
│
├─ postgres_data/                    # DB データ永続化ボリューム
│
└─ openapi/
   └─ schema.yaml                    # OpenAPI 参考テンプレート
```

## 開発ワークフロー（API-First 型生成フロー）

1. **Go ハンドラ実装** (`cmd/main.go` に `@Router`, `@Success` 等を追加)
2. **Swagger 2.0 生成** (`swag init` で `docs/swagger.yaml` 生成)
3. **OpenAPI 3.0 変換** (`swagger2openapi` で変換)
4. **TypeScript 型定義生成** (`openapi-typescript` で自動生成)
5. **Frontend 開発** (型安全な API 呼び出し実装)

**ワンコマンド**: `make gen-api` でステップ 2-4 を自動実行


## 主要技術スタック

### Backend
- **Go 1.25**
- **Gin**: Web フレームワーク
- **swaggo/swag**: Swagger 生成
- **PostgreSQL 15**: DB

### Frontend
- **Next.js 16**: フレームワーク
- **React 19**: UI ライブラリ
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **openapi-typescript**: 自動型生成

## トラブルシューティング

| 症状 | 対応 |
|------|------|
| HEAD /swagger → 404 | main.go のミドルウェアで HEAD→GET 変換（実装済み） |
| docs.go コンパイラエラー | `go get -u github.com/swaggo/swag` + `swag init` |
| api.d.ts が古い | `make gen-api` 実行 |
| Docker GOPROXY エラー | Dockerfile に `ENV GOPROXY=https://goproxy.cn,direct` |
| 本番起動失敗 | Dockerfile.prod を使用（air 不使用） |

---

## 運用ドメイン

### Backend
- APIドメイン
```
https://ai-api.kiiswebai.com/
```
localhost:8080につながってる

- swaggerアクセス
**ローカル**
[ローカル](http://localhost:8080/swagger/index.html#/)
**グローバル**
[グローバル](https://ai-api.kiiswebai.com/swagger/index.html#/)

- API確認用
[API起動確認用](https://ai-api.kiiswebai.com/api/v1/ping)

### Frontend

- スタート画面
[スタート画面](https://ai.kiiswebai.com/)

localhost:3000につながっている

### Cloudflare Tunnelを使って接続
 トンネル名：ai_web
 アプリケーションルール：
 - フロント:https://ai.kiiswebai.com/→localhost:3000
 - バックエンド：https://ai-api.kiiswebai.com/→localhost:8080





**このドキュメントは継続的に更新されます。**


