package handler

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"ai-education/backend/internal/db"
	"ai-education/backend/internal/model"
	"ai-education/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"gorm.io/gorm"
)

const sessionKey = "image_numbers"

// LoginPageData はログイン画面に渡すデータ構造です。
type LoginPageData struct {
	ErrorMessage string
}

// Handler は全てのハンドラーが共有する依存関係を保持します。
type Handler struct {
	DB      *gorm.DB
	Store   sessions.Store
}

// GetLogin はログインページを表示します。
func (h *Handler) GetLogin(c *gin.Context) {
	c.HTML(http.StatusOK, "login.html", gin.H{
		"title": "ログイン画面",
	})
}

// PostLogin はログインフォームの送信を処理します。
func (h *Handler) PostLogin(c *gin.Context) {
	username := c.PostForm("inputUsername")
	
	fetcheduser, err := db.FindUserByName(h.DB, username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fmt.Println("指定されたユーザー名が見つかりませんでした。")
			c.HTML(http.StatusOK, "login.html", LoginPageData{
				ErrorMessage: "入力されたユーザー名は存在しません。再度確認してください。",
			})
			return
		}
		log.Fatal("指定IDリストのデータ取得に失敗しました: %w", err)
	}

	stringValues := strings.Split(fetcheduser.PasswordGroup, ",")
	var number []int
	for _, s := range stringValues {
		i, err := strconv.Atoi(strings.TrimSpace(s))
		if err != nil {
			fmt.Printf("数値への変換に失敗: %v
", err)
			continue
		}
		number = append(number, i)
	}

	fmt.Println("スライス化された値:", number)
	list, name, err := db.Image_DB(h.DB, number)
	if err != nil {
		log.Fatal("画像リストのDB検索でエラーが出ました。:", err)
	}

	c.HTML(http.StatusOK, "login_p.html", gin.H{
		"img":      list,
		"img_name": name,
	})
}

// GetSignup は新規登録ページを表示します。
func (h *Handler) GetSignup(c *gin.Context) {
	list, name, number, err := db.Random_image(h.DB)
	if err != nil {
		log.Fatal("画像リストの生成中にエラーが発生しました:", err)
	}

	fmt.Println(list)
	fmt.Println(name)
	fmt.Println(number)

	session, _ := h.Store.Get(c.Request, "mysession")
	session.Values[sessionKey] = number
	session.Save(c.Request, c.Writer)

	c.HTML(http.StatusOK, "signup.html", gin.H{
		"title":    "新規登録画面",
		"img":      list,
		"img_name": name,
	})
}

// PostSignup は新規登録フォームの送信を処理します。
func (h *Handler) PostSignup(c *gin.Context) {
	session, _ := h.Store.Get(c.Request, "mysession")
	number := session.Values[sessionKey]

	if number == nil {
		log.Println("セッションキーが見つかりません。シリアライズをスキップします。")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "セッションデータが見つかりません"})
		return
	}

	intnumber, ok := number.([]int)
	if !ok {
		log.Printf("ユーザー番号の型が期待通りではありません: 実際の型 %T", intnumber)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "セッションデータの型が不正です"})
		return
	}

	num := serializeIntSlice(intnumber)
	username := c.PostForm("inputUsername")
	email := c.PostForm("email")
	teacher := true
	password := c.PostFormArray("selected_images[]")

	if email == "" {
		email = "null"
		teacher = false
	}

	count := 3 // r_memo.goではハードコードされていたため、ここでも仮に3とする
	password_1 := ""
	for i := 0; i < count; i++ {
		password_1 += password[i]
	}

	hashPassword_1, err := utils.HashPassword(password_1, utils.DefaultParams)
	if err != nil {
		log.Fatal(err)
	}

	DB_name, err := db.InsertUser(h.DB, username, hashPassword_1, num, email, teacher)
	if err != nil {
		log.Fatal(err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "ユーザー登録リクエストを受信しました",
		"user":         DB_name.Name,
		"email":        DB_name.Email,
		"teacher":      DB_name.Teacher,
		"password":     password,
		"password_1":   password_1,
		"number":       number,
		"hashPassword": hashPassword_1,
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
