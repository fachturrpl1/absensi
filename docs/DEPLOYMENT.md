# 🚀 Deployment Guide

## Overview

Aplikasi Presensi dapat di-deploy ke berbagai platform. Guide ini fokus pada deployment ke **Vercel** (recommended) dan alternatif lainnya.

---

## 🎯 Deployment Targets

### Recommended: Vercel
- **Pros:** Zero-config, automatic CI/CD, edge functions, free tier
- **Cons:** Vendor lock-in
- **Best for:** Production, staging, preview deployments

### Alternative Options:
- **Docker + Cloud Run/AWS ECS/Azure Container Apps**
- **VPS (DigitalOcean, Linode, Hetzner)**
- **Kubernetes**

---

## 📦 Pre-deployment Checklist

### 1. Environment Variables

Ensure semua environment variables sudah diset:

```env
# Production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 2. Build Test

Test build locally sebelum deploy:

```bash
pnpm build
pnpm start
```

Pastikan tidak ada error dan app berjalan di `http://localhost:3000`.

### 3. Linting & Type Checking

```bash
pnpm lint
tsc --noEmit
```

Fix semua errors sebelum deploy.

### 4. Database Migrations

Ensure database schema sudah up-to-date:

```bash
# Check migrations status
supabase db remote status

# Apply pending migrations
supabase db push
```

### 5. Security Check

- [ ] No hardcoded secrets in code
- [ ] `.env.local` not committed to git
- [ ] RLS policies enabled on all tables
- [ ] CORS configured properly
- [ ] Rate limiting implemented

---

## 🌐 Deployment to Vercel

### Initial Setup

#### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

#### 2. Connect to Vercel

**Option A: Via CLI**
```bash
vercel login
vercel link
```

**Option B: Via Web Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Select `presensi` repo

#### 3. Configure Environment Variables

**Via CLI:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

**Via Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add each variable for Production, Preview, Development

#### 4. Deploy

**Automatic (Recommended):**
- Push to `main` branch → Auto deploy to production
- Push to `develop` branch → Auto deploy to preview
- Create PR → Auto deploy to preview URL

**Manual:**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

### Vercel Configuration

Create `vercel.json` (optional, for advanced config):

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["sin1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=60, stale-while-revalidate=30" }
      ]
    }
  ]
}
```

---

### Environment-specific Configs

#### Production
```env
NEXT_PUBLIC_APP_URL=https://app.presensi.com
NEXT_PUBLIC_SUPABASE_URL=https://prod-xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key
NODE_ENV=production
```

#### Staging
```env
NEXT_PUBLIC_APP_URL=https://staging.presensi.com
NEXT_PUBLIC_SUPABASE_URL=https://staging-xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-key
NODE_ENV=production
```

#### Preview (PR Deploys)
- Same as staging
- Unique URL per PR: `https://presensi-git-feature-branch.vercel.app`

---

### Custom Domain

#### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `app.presensi.com`)
3. Get DNS records from Vercel

#### 2. Configure DNS

Add records at your DNS provider (Cloudflare, Namecheap, etc):

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

#### 3. SSL Certificate

- Automatically provisioned by Vercel
- Usually ready in 5-10 minutes

---

## 🐳 Deployment with Docker

### Dockerfile

Create `Dockerfile` at project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
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
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    restart: unless-stopped
```

### Build & Run

```bash
# Build image
docker build -t presensi:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  presensi:latest

# Or use docker-compose
docker-compose up -d
```

---

## ☁️ Cloud Deployment Options

### Google Cloud Run

1. **Build & Push Image**
```bash
# Build for Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/presensi

# Deploy
gcloud run deploy presensi \
  --image gcr.io/PROJECT_ID/presensi \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated
```

2. **Set Environment Variables**
```bash
gcloud run services update presensi \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=your-url,NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

---

### AWS (ECS/Fargate)

1. **Push to ECR**
```bash
# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.ap-southeast-1.amazonaws.com

# Tag & push
docker tag presensi:latest YOUR_ACCOUNT.dkr.ecr.ap-southeast-1.amazonaws.com/presensi:latest
docker push YOUR_ACCOUNT.dkr.ecr.ap-southeast-1.amazonaws.com/presensi:latest
```

2. **Create ECS Task Definition**
- Use AWS Console or Terraform
- Set environment variables
- Configure ALB for load balancing

---

### DigitalOcean App Platform

1. **Connect Repo**
- Link GitHub/GitLab repo
- Select branch

2. **Configure Build**
- Build command: `pnpm build`
- Run command: `pnpm start`

3. **Set Environment Variables**
- Add all required env vars in dashboard

4. **Deploy**
- Auto-deploys on git push

---

## 🔧 Post-Deployment Tasks

### 1. Health Check

```bash
# Check if app is running
curl https://your-domain.com/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2025-01-23T10:00:00Z"
}
```

### 2. Monitor Logs

**Vercel:**
```bash
vercel logs --follow
```

**Docker:**
```bash
docker logs -f presensi
```

### 3. Database Connection

Ensure app can connect to Supabase:
- Test login flow
- Create test attendance record
- Verify data syncing

### 4. Performance Check

- Use Lighthouse for performance audit
- Check Core Web Vitals
- Monitor response times

---

## 📊 Monitoring & Alerting

### Vercel Analytics

Enable in Vercel Dashboard → Analytics:
- Page views
- Performance metrics
- Error tracking

### Sentry (Error Tracking)

1. **Install Sentry**
```bash
pnpm add @sentry/nextjs
```

2. **Configure**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

3. **Capture Errors**
```typescript
try {
  await fetchData()
} catch (error) {
  Sentry.captureException(error)
  throw error
}
```

---

### Uptime Monitoring

**Recommended services:**
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com)
- [Better Uptime](https://betteruptime.com)

**Setup:**
1. Add your domain URL
2. Set check interval (1-5 minutes)
3. Configure alerts (email, Slack, SMS)

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Alternative to Vercel auto-deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        run: pnpm test
      
      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🛡️ Security Best Practices

### 1. Environment Variables

- [ ] Never commit `.env.local` to git
- [ ] Use different keys for staging/production
- [ ] Rotate keys periodically
- [ ] Use secrets management (Vercel, AWS Secrets Manager)

### 2. Database Security

- [ ] Enable RLS on all tables
- [ ] Use least-privilege service role keys
- [ ] Enable audit logging in Supabase
- [ ] Regular backups enabled

### 3. HTTPS Only

- [ ] Enforce HTTPS (Vercel does this automatically)
- [ ] Set secure cookies
- [ ] Use HSTS headers

### 4. Rate Limiting

Implement rate limiting (planned):

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

export async function middleware(req: NextRequest) {
  const ip = req.ip ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
  
  return NextResponse.next()
}
```

---

## 🚨 Rollback Strategy

### Vercel

**Quick rollback:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Via CLI:**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Docker

```bash
# Keep previous version tagged
docker tag presensi:latest presensi:previous

# Rollback
docker stop presensi-container
docker run -d --name presensi-container presensi:previous
```

---

## 📈 Performance Optimization

### 1. Enable Caching

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=30',
          },
        ],
      },
    ]
  },
}
```

### 2. Image Optimization

- Use `next/image` for all images
- Set proper width/height
- Use WebP format
- Lazy load images

### 3. Code Splitting

- Use dynamic imports for heavy components
- Route-based splitting (automatic)
- Tree-shaking enabled (default)

### 4. CDN Configuration

Vercel automatically uses global CDN. For custom setup:
- CloudFlare CDN
- AWS CloudFront
- Fastly

---

## 🧪 Testing Deployed App

### Smoke Tests

```bash
# Health check
curl https://your-domain.com/api/health

# Auth flow
curl https://your-domain.com/api/members \
  -H "Cookie: your-session-cookie"

# Verify static assets
curl -I https://your-domain.com/_next/static/...
```

### Load Testing

Use tools like:
- [k6](https://k6.io)
- [Apache JMeter](https://jmeter.apache.org)
- [Artillery](https://www.artillery.io)

```bash
# Example k6 test
k6 run load-test.js
```

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Build successful locally
- [ ] Linting passed
- [ ] TypeScript errors fixed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security review completed

### During Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Verify all features working
- [ ] Check performance metrics
- [ ] Monitor error logs

### Post-Deployment
- [ ] Verify production is live
- [ ] Test critical user flows
- [ ] Check analytics setup
- [ ] Set up alerts
- [ ] Document deployment
- [ ] Notify team

---

## 🆘 Troubleshooting

### Build Failures

**Error: Out of memory**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
pnpm build
```

### Runtime Errors

**Error: Supabase connection failed**
- Check environment variables
- Verify Supabase project is active
- Check network/firewall rules

**Error: 500 Internal Server Error**
- Check server logs
- Verify all env vars are set
- Check database connection

---

## 📞 Support

**Vercel Support:**
- [Vercel Docs](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)

**Supabase Support:**
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

---

**Last Updated:** 2025-10-23  
**Version:** 1.0
