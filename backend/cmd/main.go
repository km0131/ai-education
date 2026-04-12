package main // ← 必ず1行目！

import (
	"log"
	"time"

	_ "ai-education/backend/docs" // 1. swag initで生成されるdocsをインポート

	"ai-education/backend/internal/db"
	"ai-education/backend/internal/handler"
	"ai-education/backend/internal/model"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @Summary      疎通確認
// @Description  サーバーの生存確認用
// @Tags         system
// @Accept       json
// @Produce      json
// @Success      200 {object} map[string]string
// @Router       /ping [get]
func PingHandler(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Hello from Go Backend!"})
}

func main() {

	db.InitDB()
	db.DB.AutoMigrate(&model.User{}, &model.Certification{}, &model.Course{}, &model.Enrollment{},
		&model.AiExplanation{}, &model.AiPhotograph{}, &model.AiModel{})

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
		MaxAge:       12 * time.Hour,
	}))

	// セッションストアの設定
	// TODO: 環境変数からセッションキーを取得する
	store := cookie.NewStore([]byte("secret")) // 秘密鍵は環境変数から取得することを推奨
	r.Use(sessions.Sessions("mysession", store))

	// ハンドラーの初期化
	handler := handler.Handler{
		DB:    db.DB,
		Store: store,
	}

	// HTMLテンプレートのロード
	r.LoadHTMLGlob("frontend/*.html")
	// 静的ファイルの提供
	r.Static("/static", "./image")

	// ルーティング
	r.GET("/", handler.GetLogin)
	r.POST("/", handler.PostLogin)
	r.GET("/signup", handler.GetSignup)
	r.POST("/signup", handler.PostSignup)

	v1 := r.Group("/api/v1")
	{
		// main関数の中のインライン定義ではなく、上で定義した関数を使う
		v1.GET("/ping", PingHandler)
	}

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Println("Server listening on :8080")

	r.Run(":8080")
}
