package db

import (
	"ai-education/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// InsertUser は新しいユーザーをデータベースに挿入します。
func InsertUser(db *gorm.DB, username, hashPassword, passwordGroup, email string, teacher bool) (model.User, error) {
	user := model.User{
		ID:            uuid.New().String(),
		Name:          username,
		Password:      hashPassword,
		PasswordGroup: passwordGroup,
		Email:         email,
		Teacher:       teacher,
		QRpassword:    "", // QRpasswordは後で設定されるか、別のロジックで生成されると仮定
	}

	if err := db.Create(&user).Error; err != nil {
		return model.User{}, err
	}

	return user, nil
}

// FindUserByName はユーザー名を元にユーザーを検索します。
func FindUserByName(db *gorm.DB, username string) (model.User, error) {
	var user model.User
	result := db.Where("name = ?", username).First(&user)
	return user, result.Error
}
