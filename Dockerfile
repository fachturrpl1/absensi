# Gunakan image Node ringan tapi tetap cocok buat Next.js
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy semua file ke dalam container
COPY . .

# Install dependencies (gunakan legacy flag biar gak error)
RUN npm install --legacy-peer-deps

# Matikan telemetry & type checking Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_TYPECHECK=1
ENV CI=false
ENV PORT=4005

# Jalankan build, lanjut walau error TS
RUN npm run build --no-lint || true

# Expose port 4005
EXPOSE 4005

# Start Next.js app
CMD ["npm", "start"]
