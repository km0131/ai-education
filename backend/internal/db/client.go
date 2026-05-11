package db

import (
	"fmt"
	"os"

	"ai-education/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	// docker-compose.ymlのenvironmentで設定した値を取得
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("データベースへの接続に失敗しました: " + err.Error())
	}
	fmt.Println("データベースに接続しました")
}

// または package db の init 時に全モデルをマイグレート
func Migrate() error {
	return DB.AutoMigrate(
		&model.User{},
		&model.Certification{},
		&model.Course{},
		&model.Enrollment{},
		&model.AiExplanation{},
		&model.AiPhotograph{},
		&model.AiModel{},
	)
}