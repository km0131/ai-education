# プロジェクト概要（要約）

このリポジトリは、バックエンド（GoとOpenAPI想定）とフロントエンド（Bun + Hono）を含む学習用のフルスタック構成です。ローカル実行は `docker-compose.yml` を使ってサービス（DB、backend、frontend）を起動する想定です。

## フォルダ構成（主要）

- `backend/`：Go 製（想定）のサーバー実装。`Dockerfile` があり、`docker-compose.yml` でビルドされる。
- `frontend/`：Bun + Hono によるフロントエンド。
- `openapi/`：OpenAPI または API 仕様関連。`schema.yaml` が存在し、生成設定（gin-server 等）が記述されている。
- ルート直下：`docker-compose.yml`（開発用のサービス定義）、`README.md`（このファイル）など。

## 主要ライブラリ・ツール（抽出結果）

- フロントエンド（`frontend/`）
	- ランタイム: `Bun`
	- フレームワーク: `Hono`
	- 開発依存: `typescript`, `tailwindcss` など
	- スクリプト: `dev`, `build`, `lint`
- API/OpenAPI
	- `openapi/schema.yaml` に `gin-server` の生成設定やモデル生成の設定があり、自動生成を想定している（出力先例: `api/generated.go`）。
- コンテナ/環境
	- `docker-compose.yml` で `postgres:17-alpine`（DB）、`backend`（./backend の Dockerfile をビルド）、`frontend`（./frontend をビルド）、`surrealdb` を定義。
	- 環境変数は `.env` 経由で注入される想定。

## 開発・実行方法（開発者向けメモ）

- ローカル（docker-compose）起動例：

```
docker compose up --build
```

- フロントエンド単体（ローカル開発）:

```
cd frontend
bun run dev
```

## 補足・観察事項

- `frontend` は Bun + Hono の構成を採用しており、軽量かつ高速な開発・実行環境を想定。
- `openapi/schema.yaml` の設定から、サーバー側は OpenAPI からコード生成（gin-server）を行うワークフローが想定される。

---

## ディレクトリ構成（図）

```
ai-education/
├─ README.md
├─ docker-compose.yml
├─ backend/
│  ├─ Dockerfile
│  └─ .air.toml
├─ frontend/
│  ├─ Dockerfile
│  ├─ package.json
│  └─ src/
│     └─ index.ts
├─ openapi/
│  └─ schema.yaml
└─ surreal_data/                     # SurrealDB データ永続化ボリューム
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

## データベースについて

### PostgreSQL
- イメージ: `postgres:17-alpine`
- ポート: `${DB_PORT}:5432`
- 永続化: `./postgres_data`

### SurrealDB
- イメージ: `surrealdb/surrealdb:latest`
- ポート: `8000:8000`
- 永続化: `./surreal_data`
- 特徴: マルチモデル（リレーショナル、ドキュメント、グラフ）データベース。

## 主要技術スタック

### Backend
- **Go 1.25**
- **Gin**: Web フレームワーク
- **PostgreSQL 17**: メインDB
- **SurrealDB**: サブDB / グラフデータ用

### Frontend
- **Bun**: ランタイム
- **Hono**: フレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング

---

## 運用ドメイン

### Backend
- APIドメイン: `https://ai-api.kiiswebai.com/` (localhost:8080)
- Swagger: `http://localhost:8080/swagger/index.html#/`

### Frontend
- スタート画面: `https://ai.kiiswebai.com/` (localhost:3000)

**このドキュメントは継続的に更新されます。**
