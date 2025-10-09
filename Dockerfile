# Gunakan base image Node.js
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package file dan install dependencies
COPY package*.json pnpm*.yaml* ./
RUN npm install -g pnpm && pnpm install

# Copy semua file project
COPY . .

# Build Next.js
RUN pnpm run build

# ========================================
# Stage runtime (lebih ringan)
# ========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Copy hasil build dan node_modules dari builder
COPY --from=builder /app ./

# Jalankan Next.js
EXPOSE 4005
ENV PORT=4005
CMD ["pnpm", "start"]
