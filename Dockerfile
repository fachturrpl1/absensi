# =====================
# 1️⃣ Build stage
# =====================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files dan install deps
COPY package*.json ./
RUN npm install

# Copy semua file dan build Next.js
COPY . .
RUN npm run build


# =====================
# 2️⃣ Runtime stage
# =====================
FROM node:20-alpine AS runner
WORKDIR /app

# install jq (opsional, kalau masih mau pakai versi jq)
RUN apk add --no-cache jq

ENV NODE_ENV=production
COPY --from=builder /app ./

# Ganti script start-only (tanpa build ulang)
RUN echo '{"scripts": {"start-only": "next start"}}' > package.json.tmp && \
    jq -s '.[0] * .[1]' package.json package.json.tmp > package.json.new && \
    mv package.json.new package.json && rm package.json.tmp

EXPOSE 4005
ENV PORT=4005

CMD ["npm", "run", "start-only"]
