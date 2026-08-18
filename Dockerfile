FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source
COPY . .

# ----------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app ./

# Default port for OpenClaw
ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/server.js"]
