package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"ai-education/backend/internal/db"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handler は全てのハンドラーが共有する依存関係を保持します。
type Handler struct {
	DB *gorm.DB
}

// GetLogin はログイン用のデータを返します。
func (h *Handler) GetLogin(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "login endpoint",
	})
}

// PostLogin はログイン認証を処理し、ユーザーが入力したユーザー名から
// パスワード画像リストを返します。
func (h *Handler) PostLogin(c *gin.Context) {
	var req struct {
		InputUsername string `json:"inputUsername" binding:"required"`
	}
	
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	
	fetchedUser, err := db.FindUserByName(h.DB, req.InputUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}
		log.Printf("user lookup failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	
	// PasswordGroup をパース（カンマ区切りの数字を[]intに変換）
	var numbers []int
	stringValues := strings.Split(fetchedUser.PasswordGroup, ",")
	for _, s := range stringValues {
		s = strings.TrimSpace(s)
		if num, err := strconv.Atoi(s); err == nil {
			numbers = append(numbers, num)
		}
	}
	
	// ユーザーのパスワード画像を取得
	list, name, err := db.Image_DB(h.DB, numbers)
	if err != nil {
		log.Printf("image retrieval failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status":   "next_step",
		"img_list": list,
		"img_name": name,
	})
}

// GetSignup は新規登録用の画像リストを返します。
func (h *Handler) GetSignup(c *gin.Context) {
	list, name, number, err := db.Random_image(h.DB)
	if err != nil {
		log.Printf("image generation failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "signup images",
		"images":  list,
		"image_names": name,
		"image_numbers": number,
	})
}

// PostSignup は新規登録を処理します。
// フロントエンドから { username, role, images, email } を受け取り、ユーザーを作成します。
func (h *Handler) PostSignup(c *gin.Context) {
	var req struct {
		Username string   `json:"username" binding:"required"`
		Role     string   `json:"role" binding:"required"` // "teacher" or "student"
		Images   []string `json:"images" binding:"required"`
		Email    string   `json:"email"`
	}
	
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	
	teacher := req.Role == "teacher"
	
	count := 3
	if len(req.Images) < count {
		c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient passwords"})
		return
	}
	
	// 画像ラベルをカンマ区切りで保存
	password := ""
	for i := 0; i < count; i++ {
		password += req.Images[i]
		if i < count-1 {
			password += ","
		}
	}
	
	// ユーザー作成（パスワード画像ラベルを PasswordGroup に保存）
	newUser, err := db.InsertUser(h.DB, req.Username, password, "", req.Email, teacher)
	if err != nil {
		log.Printf("user creation failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user creation failed"})
		return
	}
	
	// QRコード生成用のトークンを作成（簡易実装）
	qrCode := "QR:" + newUser.ID
	
	c.JSON(http.StatusOK, gin.H{
		"username":   newUser.Name,
		"id":         newUser.ID,
		"qr_code":    qrCode,
		"is_teacher": teacher,
	})
}

// PostLoginRegistrer は画像パスワード照合ハンドラーです。
func (h *Handler) PostLoginRegistrer(c *gin.Context) {
	var req struct {
		Username string   `json:"username" binding:"required"`
		Images   []string `json:"images" binding:"required"`
	}
	
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	
	fetchedUser, err := db.FindUserByName(h.DB, req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	
	// ユーザーのパスワード画像を取得して照合
	count := 3
	if len(req.Images) < count {
		c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient images"})
		return
	}
	
	// パスワード画像を連結
	password1 := ""
	for i := 0; i < count; i++ {
		password1 += req.Images[i]
	}
	
	// DBから取得したパスワードと照合
	if password1 == fetchedUser.Password {
		c.JSON(http.StatusOK, gin.H{
			"password": true,
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"password": false,
			"error":    "password mismatch",
		})
	}
}

// PostLoginQR はQRコードログインハンドラーです。
func (h *Handler) PostLoginQR(c *gin.Context) {
	var req struct {
		QRData string `json:"qr_data" binding:"required"`
	}
	
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	
	// 簡易実装: QRコードからユーザーIDを抽出
	// 実際の実装では復号化と照合が必要
	if req.QRData == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid qr data"})
		return
	}
	
	// ここでは簡易実装として、QRコードが有効と仮定
	c.JSON(http.StatusOK, gin.H{
		"status":   "success",
		"password": true,
	})
}

// serializeIntSlice はintのスライスをカンマ区切りの文字列に変換します。
func serializeIntSlice(slice []int) string {
	sb := strings.Builder{}
	for i, v := range slice {
		sb.WriteString(strconv.Itoa(v))
		if i < len(slice)-1 {
			sb.WriteString(",")
		}
	}
	return sb.String()
}
