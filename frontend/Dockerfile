FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
# 開発モードで起動（ホットリロード有効）
CMD ["npm", "run", "dev"]