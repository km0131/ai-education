# プロジェクト計画書: Research-Form-Oasis (仮)

## 1. プロジェクト概要
本プロジェクトは、Google フォームのような手軽な収集機能と、研究者が必要とする高度な分析・統計機能を統合した、研究・学会発表特化型のデータ分析プラットフォームである。

### 開発の背景と目的
- **背景:** 既存ツールでは自由記述のクレンジングや統計検定に多大な手作業（Excel/外部ソフト）が発生し、データの秘匿性（クラウドAIへの送信）も課題となっている。
- **目的:** 形態素解析とローカルLLMを組み合わせたハイブリッド解析により、学術的妥当性と分析効率を両立させたオフライン完結型システムを構築する。

---

## 2. コア機能

### ① データ収集 (Data Collection)
- **ウェブ回答モード:** 公開URLによる匿名回答（回答者のログイン不要）。
- **代理入力モード:** 紙アンケートを高速にデジタル化するための管理者専用UI（キーボード操作最適化）。
- **汎用データインポート:** CSV/Excelファイルのアップロードによる外部数値データの取り込み。

### ② ハイブリッド・テキスト解析 (NLP Pipeline)
学会発表に耐えうる「再現性」と「文脈理解」を両立させる3段構えの処理を行う。
1.  **形態素解析 (Base):** `GiNZA (spaCy)` 等を用い、辞書に基づいた客観的な単語切り出し（名詞・形容詞抽出）を実行。
2.  **マスタ辞書置換 (Rule):** ユーザー定義の類義語辞書（例：スマホ → スマートフォン）による強制的な表記統一。
3.  **LLMセマンティック処理 (Advanced):** `llama-cpp-python` を活用。
    - **意味的統合:** 辞書にない表記揺れをLLMが「同一意味」と判定し名寄せ。
    - **感情・重要度抽出:** 文脈から感情スコア（-1.0〜1.0）と、単語の重要度を判定。

### ③ 高度な分析・可視化 (Analysis & Visualization)
- **アンケート統計:** 属性別クロス集計、t検定、カイ二乗検定、ANOVAの自動実行。
- **共起ネットワーク:** 形態素解析で抽出した単語間の統計的共起関係を可視化（ドラッグ＆ドロップで配置調整可能）。
- **ワードクラウド:** 単純な頻度だけでなく、LLMが判定した「重要度」に基づいたサイズ調整が可能。
- **汎用数値プロット:** 散布図（回帰線付き）、ヒートマップ、時系列ライン、エラーバー付き棒グラフ。

### ④ 学会・論文向け出力 (Professional Export)
- **グラフエディタ:** 軸ラベル、フォントサイズ、配色（モノクロ対応）をUI上で調整。
- **高解像度出力:** SVG、PDF、PNG形式（300dpi相当）。
- **論文用テーブル:** 統計量をまとめた「三線表」形式のMarkdown/HTML/CSV出力。

---

## 3. 技術スタック (Technical Stack)

| レイヤー | 技術 | 役割・備考 |
| :--- | :--- | :--- |
| **フロントエンド** | React (Vite), Bun + Hono | UI/UX、Plotly.js (グラフ描画) |
| **バックエンド (API)** | Go | 認証、データCRUD、メインロジック |
| **解析エンジン (AI)** | FastAPI (Python 3.10+) | 統計処理(SciPy/Pandas)、GiNZA、LLM |
| **データベース** | SurrealDB | データの永続化、グラフ構造による紐付け |
| **コンテナ管理** | Docker / Docker Compose | GPU(CUDA)連携、環境のポータビリティ |
| **認証** | Google OAuth 2.0 | 管理者ログイン（分析・設定画面用） |

---

## 4. フォルダ構成 (Directory Structure)

```text
/home/kaito/Research-Form/
├── docker-compose.yml
├── frontend/             # Bun + Hono + React
├── backend-api/          # Go (メインロジック)
├── analysis-engine/      # Python (NLP / LLM / 統計)
├── models/               # LLMモデル (GGUF) 格納用
└── data/                 # SurrealDB 永続化データ
```

## 5. インフラ構成 (Docker Compose 案)

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
  
  backend-api:
    build: ./backend-api
    ports: ["8080:8080"]
    environment:
      - SURREAL_DB_URL=http://surrealdb:8000
      - ANALYSIS_ENGINE_URL=http://analysis-engine:8000
  
  analysis-engine:
    build: ./analysis-engine
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ./models:/app/models
      - ./data:/app/data
    environment:
      - SURREAL_DB_URL=http://surrealdb:8000
  
  surrealdb:
    image: surrealdb/surrealdb:latest
    ports: ["8000:8000"]
    command: start --user root --pass root memory
```

## 5. 開発ロードマップ

### Phase 1: 基盤構築 (Week 1)
- [ ] Docker Compose による開発環境の整備（GPU認識確認）
- [ ] Go API ⇔ SurrealDB の基本CRUD実装
- [ ] Googleログインによる管理者認証の統合

### Phase 2: 解析エンジンの構築 (Week 2)
- [ ] GiNZA による形態素解析パイプラインの構築
- [ ] llama-cpp-python による意味的統合・感情分析の実装
- [ ] マスタ辞書置換ロジックの統合

### Phase 3: 可視化と統計処理 (Week 3)
- [ ] Plotly.js によるインタラクティブなグラフ表示（アンケート・CSV対応）
- [ ] 統計検定エンジン（SciPy）の統合
- [ ] 自由記述の共起ネットワーク描画機能の実装

### Phase 4: UI/UXとエクスポート (Week 4)
- [ ] グラフエディタ（学会向けデザイン調整機能）の開発
- [ ] 紙アンケート用「高速入力モード」のUI最適化
- [ ] 各種フォーマットへのエクスポート機能検証

---

## 6. セキュリティ・ポリシー

### 完全ローカル推論
- すべてのLLM処理はローカルGPU上で実行
- 外部APIへのデータ送信は一切行わない

### 解析の透明性
- 使用した形態素解析辞書のログ保持
- LLMモデル名のログ保持
- プロンプトのログ保持
- 研究の再現性を担保

### アクセス制御
- 回答フォームURLを除き、すべての機能はGoogle OAuthによる管理者認証を必須とする

# 技術スタック詳細

---

## 1. フロントエンド (React / Bun + Hono)

ユーザーインターフェースとインタラクティブな可視化を担当。Bun + Hono 構成で高速な開発・実行環境を構築。

### ライブラリ構成

| カテゴリ | ライブラリ名 | 採用理由 |
| :--- | :--- | :--- |
| 実行環境 | Bun + Hono | 高速なビルド・実行、エッジ親和性 |
| グラフ・可視化 | Plotly.js（react-plotly.js） | 学会品質の統計グラフに強く、SVG/PNG書き出しが容易 |
| ネットワーク図 | react-force-graph | 共起ネットワークを2D/3Dで描画 |
| データグリッド | React Data Grid | 紙アンケートの高速入力や辞書編集に適したExcelライクUI |
| スタイリング | Tailwind CSS + shadcn/ui | 清潔感のあるUIを高速構築 |
| 状態管理 | TanStack Query | データ取得・キャッシュ管理の最適化 |

---

## 2. バックエンド & 解析エンジン

役割に応じて Go と Python (FastAPI) を使い分ける。

### バックエンド (Go)
- **役割:** 認証、メインAPI、SurrealDBとのデータ連携、ビジネスロジック。
- **採用理由:** 型安全、高速な実行、並行処理への強さ。

### 解析エンジン (FastAPI / Python)
- **役割:** NLP、LLM推論、複雑な統計計算。
- **主要ライブラリ:**
    - `llama-cpp-python`: ローカルLLM実行
    - `GiNZA (spaCy)`: 形態素解析
    - `SciPy / Pandas`: 統計・データ解析

---

## 3. インフラ・開発環境

| カテゴリ | 技術 | 役割 |
| :--- | :--- | :--- |
| コンテナ化 | Docker / Docker Compose | フロント・バック(Go)・解析(Py)・DBの統合 |
| GPU連携 | NVIDIA Container Toolkit | Docker内からGPUを利用 |

---

## 4. 開発のポイント：コンポーネント間連携

### 処理フロー
1. **Front (Bun/Hono/React)** ⇔ **Back (Go API)**: ユーザー操作、データ保存
2. **Back (Go API)** ⇔ **Analysis (FastAPI)**: 解析リクエスト、統計計算依頼
3. **Analysis (FastAPI)** ⇔ **SurrealDB**: 大規模データ抽出・解析結果保存

---

## 5. 設計思想

- **API/ロジックは Go** で堅牢に構築
- **AI/解析は Python** で柔軟に構築
- **フロントは Bun + Hono** でモダンかつ高速に
- すべての処理はローカル環境で完結

## 6. 技術スタック (Selected Libraries)

### フロントエンド (React)
- **実行:** `Bun`, `Hono`
- **可視化:** `Plotly.js`, `react-force-graph`
- **UI基盤:** `Tailwind CSS`, `shadcn/ui`

### バックエンド (Go)
- **Framework:** `Echo` or `Gin` (予定)
- **DB Client:** `SurrealDB SDK for Go`

### 解析エンジン (FastAPI)
- **解析:** `GiNZA (spaCy)`, `llama-cpp-python`
- **統計:** `Pandas`, `SciPy`

# Research-Form 開発ロードマップ

## Phase 1: データベース・バックエンド基盤（最優先）
- [ ] **DBスキーマ設計 (SurrealDB)**
- [ ] **API基盤作成 (Go)**: `POST /api/questions`, `POST /api/responses`
- [ ] **解析エンジン基盤 (FastAPI)**: Goからのリクエストを待機するAPI作成

## Phase 2: フロントエンド・アンケート収集機能
- [ ] **動的フォーム生成 (React + Hono on Bun)**
- [ ] **回答送信機能の実装**

## Phase 3: AI分析・クリーニング機能
- [ ] **AI Worker実装 (FastAPI)**
- [ ] **データクリーニング・感情分析ロジック**

## Phase 4: 可視化とエクスポート
- [ ] **分析ダッシュボード (Plotly.js)**
- [ ] **学会向けエクスポート機能**