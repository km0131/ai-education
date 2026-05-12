package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"ai-education/backend/internal/db"
	"ai-education/backend/internal/model"
	"ai-education/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	DB *gorm.DB
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
		"img_number": numbers,
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
    var req model.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "無効なデータ形式です"})
        return
    }

	// 画像番号スライスを保存用文字列に変換 (例: "1,2,3")
	numStr := serializeIntSlice(req.Images)
    
    // ロール判定
    isTeacher := req.Role == "teacher"
    email := req.Email
    if !isTeacher || email == "" {
        email = "null" // 生徒、またはメール未入力時
    }

    // 3. パスワード(画像ラベル)の処理
    if len(req.Images) < 3 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "パスワード画像が不足しています"})
        return
    }
	rawPassword := serializeIntSlice(req.Images[:3])

    // 4. セキュリティ処理（ハッシュ化・トークン生成）
    // Argon2などでハッシュ化
    hashedPassword, err := utils.HashPasswordWithDefault(rawPassword)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "セキュリティ処理に失敗しました"})
        return
    }

	qrToken := utils.GenerateRandomToken()
    hashedQRToken, _ := utils.HashPasswordWithDefault(qrToken)

    // 5. DB保存
    userID, err := db.InsertUser(h.DB, req.Username, hashedPassword, numStr, email, isTeacher, hashedQRToken)
    if err != nil {
        log.Printf("DB登録エラー: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザーの保存に失敗しました"})
        return
    }

    // 6. QRコード生成
    qrCode, err := utils.GetQRCode(userID, qrToken)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "QRコード生成に失敗しました"})
        return
    }

    // レスポンス送信
    c.JSON(http.StatusOK, gin.H{
        "status":  "success",
        "message": "ユーザー登録が完了しました",
        "QR":      qrCode,
        "ID":      userID,
        "name":    req.Username,
        "teacher": isTeacher,
    })
}

// PostLoginRegistrer は画像パスワード照合ハンドラーです。
func (h *Handler) PostLoginRegistrer(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Images   []int  `json:"images" binding:"required"`
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
	password1 := serializeIntSlice(req.Images[:count])

	match, err := utils.VerifyPassword(password1, fetchedUser.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "password verification failed"})
		return
	}
	
	// DBから取得したパスワードと照合
	if match {
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
