package db

import (
	"errors"
	"math/rand"
	"time"

	"ai-education/backend/internal/model"
	"gorm.io/gorm"
)

// Image_DB は指定された番号のスライスに基づいて画像リストと名前を取得します。
func Image_DB(db *gorm.DB, numbers []int) (list []string, name []string, err error) {
	var certifications []model.Certification

	if err := db.Where("id IN ?", numbers).Find(&certifications).Error; err != nil {
		return nil, nil, err
	}

	for _, cert := range certifications {
		list = append(list, "/static/"+cert.Name)
		name = append(name, cert.Name)
	}

	return list, name, nil
}

// Random_image はデータベースからランダムな画像を3枚選択して返します。
func Random_image(db *gorm.DB) (list []string, name []string, number []int, err error) {
	var count int
	if err := db.Model(&model.Certification{}).Count(&count).Error; err != nil {
		return nil, nil, nil, err
	}

	if count < 3 {
		return nil, nil, nil, errors.New("データベースに3つ以上の画像がありません")
	}

	rand.Seed(time.Now().UnixNano())
	
	// ランダムな3つの異なるIDを選択
	selectedIDs := make(map[int]bool)
	var randomNumbers []int
	for len(randomNumbers) < 3 {
		randomID := rand.Intn(count) + 1 // IDは1から始まることを想定
		if !selectedIDs[randomID] {
			selectedIDs[randomID] = true
			randomNumbers = append(randomNumbers, randomID)
		}
	}

	list, name, err = Image_DB(db, randomNumbers)
	return list, name, randomNumbers, err
}
