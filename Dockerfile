FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ⛔ Matikan ESLint dan TypeScript check pas build
ENV NEXT_DISABLE_ESLINT=true
ENV NEXT_DISABLE_TYPECHECK=true
ENV CI=false

# Build Next.js
RUN npm run build

# -----------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app ./

EXPOSE 4005
CMD ["npm", "run", "start"]
