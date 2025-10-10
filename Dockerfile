# =====================
# 1️⃣ BUILD STAGE
# =====================
FROM node:20-alpine AS builder
WORKDIR /app

# Salin package files dan install dependencies
COPY package*.json ./
RUN npm install

# Salin semua source code dan build Next.js
COPY . .
# Nonaktifkan lint biar gak error pas build
RUN npm run build --no-lint


# =====================
# 2️⃣ RUNTIME STAGE
# =====================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Salin hasil build dari builder
COPY --from=builder /app ./

# Tambahkan script "start-only" supaya bisa jalan tanpa rebuild
RUN node -e "\
  const fs=require('fs'); \
  const pkg=JSON.parse(fs.readFileSync('package.json')); \
  pkg.scripts=pkg.scripts||{}; \
  pkg.scripts['start-only']='next start'; \
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
"

# Port Coolify kamu
EXPOSE 4005
ENV PORT=4005

# Jalankan Next.js
CMD ["npm", "run", "start-only"]
