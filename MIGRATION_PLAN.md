# main.go → バックエンド構造への移行計画書

作成日: 2026-04-15

## 概要
SQLite + セッション Cookie ベースの monolithic main.go を、PostgreSQL + Paseto トークンベースのマイクロサービス構造に段階的に移行する。

---

## フェーズ別移行計画

### Phase 1: データモデル統合 ⚠️ 高優先度
**目標:** 既存モデルを internal/model/model.go に統合

| モデル | 現在の場所 | 移行先 | ステータス |
|--------|-----------|--------|-----------|
| `user` | main.go:20-30  | ✅ 既存 | ✅ 完了 |
| `certification` | main.go:32-35  | ✅ 既存 | ✅ 完了 |
| `Course` | main.go:37-48 | ✅ 既存 | ✅ 完了 |
| `Enrollment` | main.go:50-56 | ✅ 既存 | ✅ 完了 |
| `AiExplanation` | main.go:58-65 | ✅ 既存 | ✅ 完了 |
| `AiPhotograph` | main.go:67-72 | ✅ 既存 | ✅ 完了 |
| `AiModel` | main.go:74-80 | ✅ 既存 | ✅ 完了 |

**作業内容:**
- [ ] `User` モデルを internal/model/model.go に追加（現在は backend/internal/model/model.go に存在確認）
- [ ] `Certification` モデルを internal/model/model.go に追加

**関連ファイル:**
- [backend/internal/model/model.go](backend/internal/model/model.go)

---

### Phase 2: DB操作層の構築 ⚠️ 高優先度
**目標:** main.go 内の DB関数を internal/db/ に分離

#### 2-1: ユーザー操作 (internal/db/user_repo.go)
| 関数 | 行番号 | 移行先 | ステータス |
|------|---------|--------|-----------|
| `InsertUser()` | 470-510 | internal/db/user_repo.go | ❌ 未実施 |
| `GetUser()` | 512-530 | internal/db/user_repo.go | ❌ 未実施 |
| `LoginUser()` | 632-660 | internal/db/user_repo.go | ❌ 未実施 |

**作業内容:**
- [ ] internal/db/user_repo.go を再構築（PostgreSQL 対応）
  - [ ] `InsertUser()` を移行
  - [ ] `GetUser()` を移行
  - [ ] `LoginUser()` をトークン式に更新

#### 2-2: 画像操作 (internal/db/image.go)
| 関数 | 行番号 | 移行先 | ステータス |
|------|---------|--------|-----------|
| `Random_image()` | 552-580 | internal/db/image.go | ❌ 未実施 |
| `Image_DB()` | 583-610 | internal/db/image.go | ❌ 未実施 |

**作業内容:**
- [ ] Random_image() → internal/db/image.go に移行
- [ ] Image_DB() → internal/db/image.go に移行

#### 2-3: クラス操作 (internal/db/course.go)
| 関数 | 行番号 | 移行先 | ステータス |
|------|---------|--------|-----------|
| `CreateCourseWithUniqueCode()` | 672-691 | internal/db/course.go | ❌ 未実施 |
| `GenerateInviteCode()` | 694-708 | internal/utils/helpers.go | ❌ 未実施 |

**作業内容:**
- [ ] CreateCourseWithUniqueCode() → internal/db/course.go に移行
- [ ] GenerateInviteCode() → internal/utils/helpers.go に移行

---

### Phase 3: ユーティリティ関数の整理 ⚠️ 中優先度
**目標:** 汎用関数を internal/utils/ に整理

#### 3-1: 暗号化・認証
| 関数 | 行番号 | 移行先 | ステータス |
|------|---------|--------|-----------|
| `hashPassword()` | 364-393 | internal/utils/crypto.go | ✅ 既存 |
| `ComparePassword()` | 401-456 | internal/utils/crypto.go | ✅ 既存 |

**作業内容:**
- [x] crypto.go に既に存在（確認済）

#### 3-2: トークン・セッション
| 関数 | 行番号 | 移行先 | ステータス |
|------|---------|--------|-----------|
| `GeneratePasetoToken()` | - | internal/utils/token.go | ✅ 実装済 |
| `VerifyPasetoToken()` | - | internal/utils/token.go | ✅ 実装済 |
| `generateRandomToken()` | 622-626 | internal/utils/helpers.go | ❌ 未実施 |

**作業内容:**
- [ ] generateRandomToken() → internal/utils/helpers.go に移行
- [ ] token.go の検証関数を各ハンドラーで使用・テスト

#### 3-3: ユーザー名・QR生成
| 関数 | 行番号 | 移行先 | ステータス |
|------|---------|--------|-----------|
| `createUniqueUsername()` | 543-550 | internal/utils/helpers.go | ❌ 未実施 |
| `normalizeJapaneseUsername()` | 613-628 | internal/utils/helpers.go | ❌ 未実施 |
| `generateRandomSuffix()` | 631-640 | internal/utils/helpers.go | ❌ 未実施 |
| `GetQRCode()` | 642-660 | internal/utils/qrcode.go | ❌ 未実施 |

**作業内容:**
- [ ] ユーザー名正規化関数群を internal/utils/helpers.go に整理
- [ ] QRコード生成を internal/utils/qrcode.go に分離

#### 3-4: ファイル操作
| 関数 | 行番号 | 移行先 | ステータス |
|------|---------|--------|-----------|
| `decodeBase64Image()` | 711-738 | internal/utils/image.go | ❌ 未実施 |
| `unzip()` | 757-801 | internal/utils/archive.go | ❌ 未実施 |

**作業内容:**
- [ ] Base64 画像デコード → internal/utils/image.go
- [ ] ZIP解凍 → internal/utils/archive.go

---

### Phase 4: ハンドラー関数の移行・新実装 🔴 最高優先度
**目標:** 全13個のエンドポイントを internal/handler/handler.go に移行

#### 4-1: ログイン関連（3個）
| エンドポイント | 現在の実装 | 移行内容 | ステータス |
|-------|-----------|--------|-----------|
| `POST /api/login` | main.go:168-200 | PostLogin() に統合・Paseto化 | ⚠️ 部分実装 |
| `POST /api/login_registrer` | main.go:201-241 | 新しい認証ロジック | ❌ 未実施 |
| `POST /api/login_qr` | main.go:242-274 | QR認証ロジック | ❌ 未実施 |

**移行の詳細:**
1. POST /api/login
   - 現在: ユーザー名から画像リストを返す
   - 移行: JSON リクエスト（username, password）→ Paseto トークン返却
   - 実装: [handler.go](backend/internal/handler/handler.go) の PostLogin（部分実装済）

2. POST /api/login_registrer
   - 現在: 画像選択の照合ロジック
   - 移行: 画像IDの照合 → Paseto トークン生成
   - 実装: 新規ハンドラー `VerifyLoginImages()` を追加

3. POST /api/login_qr
   - 現在: QRコード内容の復号・照合
   - 移行: QRトークン検証 → Paseto トークン生成
   - 実装: 新規ハンドラー `LoginByQR()` を追加

#### 4-2: 登録関連（2個）
| エンドポイント | 現在の実装 | 移行内容 | ステータス |
|-------|-----------|--------|-----------|
| `POST /api/signup` | main.go:275-300 | GetSignup() に統合 | ✅ 実装済 |
| `POST /api/register` | main.go:301-370 | PostSignup() に統合 | ⚠️ 部分実装 |

**移行の詳細:**
1. POST /api/signup
   - 現在: ランダム画像リスト＋セッション保存
   - 移行: ランダム画像リスト返却のみ（トークン不要）
   - 実装: [handler.go](backend/internal/handler/handler.go) の GetSignup（実装済）

2. POST /api/register
   - 現在: ユーザー作成＋QRコード生成
   - 移行: JSON リクエスト → ユーザー作成 → Paseto トークン＋QRコード返却
   - 実装: [handler.go](backend/internal/handler/handler.go) の PostSignup（部分実装）
   - 変更点: QRコード生成ロジックを内部に組み込む

#### 4-3: セッション確認（1個）
| エンドポイント | 現在の実装 | 移行内容 | ステータス |
|-------|-----------|--------|-----------|
| `GET /api/session` | main.go:371-396 | 新規ハンドラー | ❌ 未実施 |

**移行の詳細:**
- 現在: セッション情報を返す
- 移行: Authorization ヘッダーの Paseto トークンを仕様 → ユーザー情報返却
- 実装: 新規ハンドラー `GetSession()` を追加（ミドルウェアで検証済み前提）

#### 4-4: クラス関連（3個）
| エンドポイント | 現在の実装 | 移行内容 | ステータス |
|-------|-----------|--------|-----------|
| `POST /api/create_class` | main.go:397-438 | 新規ハンドラー | ❌ 未実施 |
| `POST /api/join_class` | main.go:439-476 | 新規ハンドラー | ❌ 未実施 |
| `GET /api/my_courses` | main.go:477-515 | 新規ハンドラー | ❌ 未実施 |

**移行の詳細:**
1. POST /api/create_class
   - 現在: セッションから教師ID取得 → クラス作成
   - 移行: Paseto トークンから UserID 抽出 → クラス作成
   - 実装: `CreateClass()` ハンドラーを追加

2. POST /api/join_class
   - 現在: 招待コード照合＋Enrollment作成
   - 移行: トークン検証 → 招待コード照合 → Enrollment作成
   - 実装: `JoinClass()` ハンドラーを追加

3. GET /api/my_courses
   - 現在: Enrollment.Preload で取得
   - 移行: トークンから StudentID 抽出 → Enrollment 取得
   - 実装: `GetMyCourses()` ハンドラーを追加

#### 4-5: AI学習関連（4個）
| エンドポイント | 現在の実装 | 移行内容 | ステータス |
|-------|-----------|--------|-----------|
| `POST /api/ai_create` | main.go:516-567 | 新規ハンドラーで整理 | ❌ 未実施 |
| `POST /api/callback/model_ready` | main.go:568-612 | コールバック処理 | ❌ 未実施 |
| `GET /api/ai_status/all/:course_id` | main.go:613-633 | 新規ハンドラー | ❌ 未実施 |
| `GET /api/ai_status/detail/:course_id/:student_id` | main.go:634-662 | 新規ハンドラー | ❌ 未実施 |

**移行の詳細:**
すべてPython連携関連。内部ロジック（Multipart送信、ZIP解凍など）は関数化して utils/ に分離。

---

### Phase 5: 認証ミドルウェア実装 🔴 高優先度
**目標:** Paseto トークン検証ミドルウェアを導入

**作業内容:**
- [ ] internal/middleware/auth.go を作成
  - [ ] `VerifyToken()` ミドルウェア関数を実装
  - [ ] Authorization ヘッダーから Paseto トークンを抽出
  - [ ] トークン検証＆ UserID / Username を gin.Context に設定
- [ ] main.go でミドルウェアを登録（特定ルートのみ）
- [ ] 保護されたエンドポイントを指定

**コード例:**
```go
// ログイン前のエンドポイント
api.POST("/login", h.PostLogin)
api.POST("/signup", h.GetSignup)

// ログイン後のエンドポイント（ミドルウェア適用）
protected := api.Group("")
protected.Use(middleware.VerifyToken())
{
    protected.POST("/register", h.PostSignup)
    protected.GET("/session", h.GetSession)
    // ... その他
}
```

---

### Phase 6: main.go の簡潔化 ⚠️ 中優先度
**目標:** backend/cmd/main.go とコード統合・削減

**現在の状態:**
- root 直下 main.go: 800+ 行（全機能を含む）
- backend/cmd/main.go: 90 行（ルーティングのみ）

**作業内容:**
- [ ] 全ユーティリティ関数をルートの main.go から削除
- [ ] ルートの main.go を削除（または テスト/互換性用に残す）
- [ ] backend/cmd/main.go に統合（PostgreSQL 設定追加）
- [ ] Dockerfile でエントリーポイント変更
  ```dockerfile
  ENTRYPOINT ["./server"]
  CMD []
  ```

---

### Phase 7: 環境変数・設定 ⚠️ 中優先度
**目標:** .env ファイルの整備

**必要な環境変数:**
```env
# Database
DB_HOST=db
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db

# Paseto / セキュリティ
PASETO_KEY=your-very-long-secret-key-for-token-signing
APP_MASTER_KEY=your-qr-encryption-key (既存)

# API設定
GIN_MODE=release
SERVER_PORT=8080
PYTHON_AI_ENDPOINT=http://100.121.255.9:8000
```

**作業内容:**
- [ ] .env ファイルを作成・設定
- [ ] docker-compose.yml で env_file を参照（既に設定済み）
- [ ] backend/.env をコピーして PostgreSQL 接続確認

---

### Phase 8: テスト・検証 🟢 デバッグ/最終段階
**目標:** 各エンドポイントの動作確認

**テスト対象:**
- [ ] ログイン/QRログイン
- [ ] ユーザー登録
- [ ] クラス作成・参加
- [ ] AI学習リクエスト
- [ ] トークン有効期限・検証

**テストツール:**
- `curl` / `Postman` / 既存フロントエンド
- `go test` でユニットテスト

---

## 依存関係グラフ

```
Phase 1: モデル定義
    ↓
Phase 2: DB操作層 (Phase 1 に依存)
    ↓
Phase 3: ユーティリティ (独立)
    ↓
Phase 4: ハンドラー実装 (Phase 2, 3 に依存)
    ↓
Phase 5: 認証ミドルウェア (Phase 4 に依存)
    ↓
Phase 6: main.go 統合 (全 Phase に依存)
    ↓
Phase 7: 環境設定 (独立)
    ↓
Phase 8: テスト・検証 (全 Phase 後)
```

---

## 実装順序（推奨）

1. **Phase 1 + Phase 2** →基盤構築（1-2日）
2. **Phase 3** → ユーティリティ統合（1日）
3. **Phase 4** → ハンドラー移行（2-3日）
4. **Phase 5** → ミドルウェア追加（0.5日）
5. **Phase 7** → 環境設定（0.5日）
6. **Phase 6** → main.go 統合（0.5日）
7. **Phase 8** → テスト・デバッグ（1-2日）

**総工数:** 約 6-9日

---

## 注記

- ✅ 完了 = 既に実装済
- ⚠️ 部分実装 = 一部完了、残り作業が必要
- ❌ 未実施 = 実装予定

最新の実装状況は確認のため、各ファイルを直接参照してください。

