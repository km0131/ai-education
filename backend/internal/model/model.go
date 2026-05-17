package model

import (
	"time"

	"gorm.io/gorm"
)

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Role     string `json:"role" binding:"required"`
	Images   []int  `json:"images" binding:"required"`
	Email    string `json:"email"`
}

type RegistrationTicket struct {
	ID               string    `gorm:"type:varchar(36);primaryKey" json:"id"`
	ExhibitedNumbers string    `gorm:"type:text;not null" json:"exhibited_numbers"` // カンマ区切りなどで画像番号を保存
	CreatedAt        time.Time `json:"created_at"`
	ExpiresAt        time.Time `gorm:"index" json:"expires_at"` // 有効期限
}

type User struct { //ユーザ登録のDB
	ID            string         `gorm:"type:VARCHAR(36) PRIMARY KEY"` // ID(UUID)を使用
	CreatedAt     time.Time      //作成日時
	UpdatedAt     time.Time      //更新日時
	DeletedAt     gorm.DeletedAt `gorm:"index"`                      //倫理削除
	Name          string         `gorm:"type:text;unique;not null"`  // TEXT UNIQUE NOT NULL 名前
	Password      string         `gorm:"type:varchar(255);not null"` // VARCHAR(255) NOT NULL パスワード
	PasswordGroup string         `gorm:"type:text;not null"`         // TEXT NOT NULL 画像のグループ
	Email         string         `gorm:"type:text"`                  // TEXT メール（生徒は登録しないためNULLを許容）
	Teacher       bool           `gorm:"type:boolean;not null"`      // BOOLEAN NOT NULL 生徒か生徒かを登録
	QRpassword    string         `gorm:"type:varchar(255);not null"` // VARCHAR(255) NOT NULL QRパスワード
}

type Certification struct { //セキュリティー用画像のDB
	ID   uint   `gorm:"primaryKey"` //画像番号
	Name string `gorm:"not null"`   //画像の名前
}

type Course struct { //クラス用のDB
	// ID	自動採番される主キー (Primary Key)
	// CreatedAt	データが作成された日時を自動記録
	// UpdatedAt	データが更新された日時を自動記録
	// DeletedAt	論理削除（後述）のためのフラグ
	// 自動追加　めっちゃ便利
	gorm.Model
	Title       string `gorm:"not null"` // クラス名
	Description string // 説明
	InviteCode  string `gorm:"unique;not null;index"` // 参加コード (一意の文字列 / 重複不可)
	TeacherID   string `gorm:"index"`                 // 担任教師のID (UsersテーブルのIDを参照する外部キー想定)
	Teacher     User   `gorm:"foreignKey:TeacherID"`  //教師IDを使ってuserのデータを検索して取り出せる。便利
	ThemeColor  string //クラスのカラーコード
}

type Enrollment struct { //履修者用DB
	gorm.Model        // 自動追加　めっちゃ便利
	CourseID   uint   `gorm:"not null;index"`      // クラスid
	StudentID  string `gorm:"not null;index"`      // 生徒id
	Course     Course `gorm:"foreignKey:CourseID"` //生徒IDを使ってcourseのデータを検索して取り出せる。便利
}

// AIの説明・セット情報を管理（親テーブル）
type AiExplanation struct {
    gorm.Model
    StudentID   string `gorm:"not null;index"`
    CourseID    string `gorm:"not null;index"`
    Name        string `gorm:"size:255"`  // セットの名前
    Explanation string `gorm:"type:text"` // セットの説明
    
    // 修正箇所：スライス名と型、タグを一行にまとめます
    Photographs []AiPhotograph `gorm:"foreignKey:AiExplanationID"`
}

// AIの画像パスを管理（子テーブル）
type AiPhotograph struct {
	gorm.Model
	AiExplanationID uint   `gorm:"not null;index"` // 親IDへの参照
	PhotographPath  string `gorm:"not null"`       // 保存したファイルパス
}

type AiModel struct {
	gorm.Model
	StudentID string `gorm:"not null;index"`
	CourseID  string `gorm:"not null;index"`
	ModelPath string `json:"model_path"` // モデルの保存場所
	IsReady   bool   `json:"is_ready"`   // 学習完了フラグ
}

// TokenClaims は Paseto トークンのペイロード構造です。
type TokenClaims struct {
	UserID       uint      `json:"user_id"`
	Username     string    `json:"username"`
	ImageNumbers []int     `json:"image_numbers,omitempty"`
	IssuedAt     time.Time `json:"iat"`
	ExpiresAt    time.Time `json:"exp"`
}