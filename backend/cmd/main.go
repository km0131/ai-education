package main // ← 必ず1行目！

import (
	"log"
	"path/filepath"
	"time"

	_ "ai-education/backend/docs" // 1. swag initで生成されるdocsをインポート

	"ai-education/backend/internal/db"
	"ai-education/backend/internal/handler"

	"github.com/gin-contrib/cors"
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
	db.Migrate() 
	

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
		MaxAge:       12 * time.Hour,
	}))

	// ハンドラーの初期化
	h := handler.Handler{
		DB: db.DB,
	}

	r.GET("/images/certification/:filename", func(c *gin.Context) {
		filename := c.Param("filename")

		// セキュリティ対策：パスからファイル名部分だけを取り出す
		// これにより "../../" などの攻撃を防ぐ
		safeFilename := filepath.Base(filename)

		// プロジェクトルートを基準にした相対パスにするのが一般的
		basePath := "./images/certification/" 
		fullPath := filepath.Join(basePath, safeFilename)

		// 指定したパスがディレクトリでないか、実在するかを確認して返す
		c.File(fullPath)
	})

	v0 := r.Group("/api/v0")
	{
		// ルーティング
		v0.POST("/", h.PostLogin)
		v0.GET("/signup", h.GetSignup)
		v0.POST("/signup", h.PostSignup)
		v0.POST("/login_registrer", h.PostLoginRegistrer)
		v0.POST("/login_qr", h.PostLoginQR)
	}

	v1 := r.Group("/api/v1")
	{
		// main関数の中のインライン定義ではなく、上で定義した関数を使う
		v1.GET("/ping", PingHandler)
	}

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Println("Server listening on :8080")

	r.Run(":8080")
}
