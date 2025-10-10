# =====================
# 1️⃣ BUILD STAGE
# =====================
FROM node:20-alpine AS builder
WORKDIR /app

# Salin file dependency & install
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Salin semua source code
COPY . .

# Build Next.js (skip lint biar gak gagal)
RUN npm run build --no-lint


# =====================
# 2️⃣ RUNTIME STAGE
# =====================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Salin hasil build
COPY --from=builder /app ./

# Tambahkan script “start-only” agar bisa run tanpa rebuild
RUN node -e "\
  const fs=require('fs'); \
  const pkg=JSON.parse(fs.readFileSync('package.json')); \
  pkg.scripts=pkg.scripts||{}; \
  pkg.scripts['start-only']='next start'; \
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
"

# Tentukan port default
ENV PORT=4005
EXPOSE 4005

# Jalankan app
CMD ["npm", "run", "start-only"]

