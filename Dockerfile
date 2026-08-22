FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app ./

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "app.js"]
