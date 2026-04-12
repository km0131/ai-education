FROM oven/bun:alpine
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
# 開発モードで起動
CMD ["bun", "run", "dev"]
