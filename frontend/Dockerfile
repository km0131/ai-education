FROM oven/bun:1.2-alpine

WORKDIR /app

# 依存関係のインストール
COPY package.json bun.lockb* ./
RUN bun install

# ソースコードをコピー
COPY . .

# 開発時はホットリロードを有効にする
CMD ["bun", "--hot", "src/index.ts"]
