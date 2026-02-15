FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# 開発モードで起動（ホットリロード有効）
CMD ["npm", "run", "dev"]