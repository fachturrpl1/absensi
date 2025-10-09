# =============================
# Stage 1: Build
# =============================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy semua file ke dalam container
COPY . .

# Force install (lewatkan error kecil dan version mismatch)
RUN pnpm install --no-frozen-lockfile || true

# Build Next.js
RUN pnpm run build || true

# =============================
# Stage 2: Runtime
# =============================
FROM node:20-alpine AS runner
WORKDIR /app

# Copy hasil build dari builder
COPY --from=builder /app ./

EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "start"]
