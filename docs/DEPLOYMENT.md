# Deployment Guide

## Pre-Deployment Checklist

- [ ] Build berhasil lokal (`pnpm build`)
- [ ] Linting passed (`pnpm lint`)
- [ ] TypeScript no errors (`tsc --noEmit`)
- [ ] Database migrations applied
- [ ] Environment variables ready
- [ ] No secrets di code

---

## Deploy ke Vercel (Recommended)

### Setup Awal

1. **Push ke GitHub**
```bash
git push origin main
```

2. **Import di Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import repository
   - Configure project

3. **Set Environment Variables**

Di Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. **Deploy**
   - Vercel auto-deploy saat push ke `main`

---

### Auto Deployment

```
Push ke branch → Auto deploy:
├── main → Production
├── develop → Preview
└── feature/* → Preview per PR
```

---

### Custom Domain

1. **Add Domain**
   - Vercel Dashboard → Domains
   - Add domain (contoh: `app.presensi.com`)

2. **Setup DNS**
   - Type: `CNAME`
   - Name: `app`
   - Value: `cname.vercel-dns.com`

3. **SSL Certificate**
   - Auto-provisioned (5-10 menit)

---

## Deploy dengan Docker

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "start"]
```

---

### Build & Run

```bash
# Build image
docker build -t presensi:latest .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  presensi:latest
```

---

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

## Deploy ke Cloud

### Google Cloud Run

```bash
# Build & push
gcloud builds submit --tag gcr.io/PROJECT_ID/presensi

# Deploy
gcloud run deploy presensi \
  --image gcr.io/PROJECT_ID/presensi \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated

# Set env vars
gcloud run services update presensi \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=xxx,NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

### AWS ECS

1. Push image ke ECR
2. Create ECS Task Definition
3. Set environment variables
4. Configure ALB

---

### DigitalOcean App Platform

1. Connect repo (GitHub/GitLab)
2. Configure:
   - Build: `pnpm build`
   - Run: `pnpm start`
3. Set environment variables
4. Deploy (auto on push)

---

## Environment Configs

### Production
```env
NEXT_PUBLIC_APP_URL=https://app.presensi.com
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key
NODE_ENV=production
```

### Staging
```env
NEXT_PUBLIC_APP_URL=https://staging.presensi.com
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-key
NODE_ENV=production
```

---

## Post-Deployment

### Health Check
```bash
curl https://your-domain.com/
# Expected: Status 200
```

### Monitor Logs

**Vercel:**
```bash
vercel logs --follow
```

**Docker:**
```bash
docker logs -f presensi
```

### Test Features
- [ ] Login flow
- [ ] Create attendance
- [ ] Data syncing
- [ ] Performance check

---

## Monitoring

### Vercel Analytics
Enable di Dashboard → Analytics:
- Page views
- Performance metrics
- Error tracking

### Uptime Monitoring
Gunakan:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://pingdom.com)

Setup:
- Add domain URL
- Check interval: 5 menit
- Alert via email/Slack

---

## Security

### Checklist
- [ ] HTTPS only
- [ ] Environment variables di secrets
- [ ] RLS enabled di database
- [ ] Rotate keys periodically
- [ ] Regular backups

### Rate Limiting (Planned)
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})
```

---

## Rollback

### Vercel
1. Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Via CLI:**
```bash
vercel rollback [deployment-url]
```

### Docker
```bash
# Tag previous version
docker tag presensi:latest presensi:previous

# Rollback
docker stop presensi-container
docker run -d presensi:previous
```

---

## CI/CD dengan GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install
        run: pnpm install --frozen-lockfile
      
      - name: Test
        run: pnpm test
      
      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Troubleshooting

### Build Failed

**Out of memory:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

**Module not found:**
```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

### Runtime Errors

**Supabase connection failed:**
- Check environment variables
- Verify Supabase project status
- Check network/firewall

**500 Error:**
- Check server logs
- Verify all env vars
- Check database connection

---

**Last Updated:** 2025-10-23
