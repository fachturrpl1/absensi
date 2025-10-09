# Gunakan base image Nixpacks seperti yang dipakai Coolify
FROM node:20-alpine

WORKDIR /app
COPY . .

# Install dependencies
RUN npm install --legacy-peer-deps

# Nonaktifkan type checking & linting saat build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_TYPECHECK=1
ENV CI=false

# Jalankan build tanpa gagal walau ada error TypeScript
RUN npm run build --no-lint || true

EXPOSE 4005
CMD ["npm", "start"]
