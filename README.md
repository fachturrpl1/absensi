# 📱 Presensi - Smart Attendance Management System

> Modern web-based attendance management application built with Next.js, React, and Supabase

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4)](https://tailwindcss.com/)

---

## 🚀 Overview

**Presensi** adalah aplikasi manajemen kehadiran (attendance) berbasis web yang dirancang untuk membantu organisasi/perusahaan mengelola kehadiran karyawan dengan mudah dan efisien. Aplikasi ini mendukung multi-organization, role-based access control, real-time updates, dan analisis attendance.

### ✨ Key Features

- 🏢 **Multi-Organization Support** - Satu instance untuk banyak organisasi
- 👥 **Member Management** - Kelola data karyawan dengan lengkap
- 📅 **Flexible Scheduling** - Jadwal kerja fleksibel (fixed, rotating, flexible)
- ⏰ **Attendance Tracking** - Catat kehadiran via web, mobile, atau RFID
- 📊 **Analytics & Reports** - Dashboard dan laporan lengkap
- 🔐 **Role-Based Access Control** - Granular permissions per role
- 🌍 **Multi-timezone Support** - Mendukung berbagai timezone
- ⚡ **Real-time Updates** - Live attendance updates via Supabase Realtime
- 🎨 **Modern UI** - Beautiful interface dengan shadcn/ui
- 📱 **Responsive Design** - Works di desktop, tablet, dan mobile

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **UI Library:** React 19
- **Styling:** TailwindCSS 4
- **Components:** shadcn/ui (Radix UI)
- **State Management:** React Query v5 + Zustand
- **Form Handling:** React Hook Form + Zod
- **Charts:** Recharts

### Backend
- **BaaS:** Supabase
  - PostgreSQL Database
  - Authentication (JWT)
  - Storage (file uploads)
  - Realtime (WebSocket)
- **API:** Next.js Route Handlers

### DevOps
- **Package Manager:** pnpm
- **Linting:** ESLint 9
- **Testing:** Vitest
- **Deployment:** Vercel (recommended)

---

## 📚 Documentation

Dokumentasi lengkap tersedia di folder `/docs`:

- **[📖 Database Schema](./docs/DATABASE.md)** - Struktur database lengkap dengan ERD, tables, relationships, dan query patterns
- **[🌐 API Documentation](./docs/API.md)** - Semua API endpoints dengan request/response examples
- **[🏗️ Architecture](./docs/ARCHITECTURE.md)** - System architecture, design patterns, dan data flow
- **[💻 Development Guide](./docs/DEVELOPMENT.md)** - Setup local development, coding standards, dan best practices
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** - Cara deploy ke Vercel, Docker, atau cloud providers

---

## 🚦 Quick Start

### Prerequisites

- Node.js >= 18.x
- pnpm >= 8.x
- Supabase account & project

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/presensi.git
cd presensi

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# 4. Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy `Project URL` and `anon public` key

---

## 📁 Project Structure

```
presensi/
├── src/
│   ├── app/                   # Next.js pages & API routes
│   │   ├── api/               # API endpoints
│   │   ├── attendance/        # Attendance pages
│   │   ├── members/           # Members management
│   │   └── ...
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   ├── action/                # Server actions
│   ├── lib/                   # Utilities
│   ├── interface/             # TypeScript interfaces
│   └── middleware.ts          # Auth middleware
├── docs/                      # Documentation
├── public/                    # Static assets
└── ...
```

See [Architecture Documentation](./docs/ARCHITECTURE.md) for detailed structure.

---

## 🎯 Key Features Detail

### 1. Organization Management
- Multi-tenant architecture
- Organization settings (timezone, currency, time format)
- Logo upload
- Subscription tiers

### 2. Member Management
- Complete employee profiles
- Department & position assignment
- Employment status tracking
- RFID card integration
- Invitation system

### 3. Attendance Tracking
- Manual check-in/out via web
- Mobile app support (planned)
- RFID reader integration (planned)
- Geolocation tracking
- Photo capture for verification
- Status calculation (present, late, absent, excused)

### 4. Schedule Management
- Flexible work schedules
- Fixed, rotating, and flexible shifts
- Per-member schedule assignment
- Effective date management

### 5. Analytics & Reports
- Dashboard with key metrics
- Attendance trends
- Department-wise statistics
- Late analysis
- Exportable reports (planned)

### 6. Role-Based Access Control
- Granular permissions
- Multiple roles per user
- Module-level access control
- Organization-scoped data

---

## 🧑‍💻 Development

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm dev:network      # Start with network access (0.0.0.0)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
```

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes**
   - Follow [Development Guide](./docs/DEVELOPMENT.md)
   - Follow coding standards
   - Write tests

3. **Commit changes**
   ```bash
   git commit -m "feat: add your feature"
   ```

4. **Push & create PR**
   ```bash
   git push origin feature/your-feature
   ```

### Coding Standards

- Use TypeScript for type safety
- Follow ESLint rules
- Use conventional commits
- Write meaningful comments
- Test your changes

See [Development Guide](./docs/DEVELOPMENT.md) for detailed guidelines.

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import repository
   - Add environment variables
   - Deploy

3. **Configure custom domain** (optional)
   - Add domain in Vercel dashboard
   - Update DNS records

### Deploy with Docker

```bash
# Build image
docker build -t presensi:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  presensi:latest
```

See [Deployment Guide](./docs/DEPLOYMENT.md) for all deployment options.

---

## 📊 Performance

- **60-74% reduction** in API requests through React Query caching
- Server-side rendering for better SEO
- Code splitting for faster page loads
- Image optimization with Next.js Image
- CDN-ready (Vercel Edge)

---

## 🔐 Security

- JWT-based authentication via Supabase
- Row Level Security (RLS) policies
- Environment variables for secrets
- HTTPS-only in production
- Input validation with Zod
- SQL injection prevention (parameterized queries)

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

See [Development Guide](./docs/DEVELOPMENT.md) for coding standards.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [TanStack Query](https://tanstack.com/query) - Data fetching & caching
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS

---

## 📧 Contact & Support

- **Documentation:** [/docs](./docs)
- **Issues:** [GitHub Issues](https://github.com/your-org/presensi/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/presensi/discussions)

---

## 🗺️ Roadmap

### v1.1 (Q1 2025)
- [ ] Mobile app (React Native)
- [ ] RFID reader integration
- [ ] Advanced reporting
- [ ] Export to PDF/Excel
- [ ] Email notifications

### v1.2 (Q2 2025)
- [ ] Leave management
- [ ] Overtime calculation
- [ ] Payroll integration
- [ ] Multi-language support
- [ ] Dark mode improvements

### v2.0 (Q3 2025)
- [ ] Face recognition
- [ ] Biometric integration
- [ ] Advanced analytics with AI
- [ ] Mobile SDK for third-party apps
- [ ] API webhooks

---

## 📈 Statistics

- **Lines of Code:** ~15,000
- **Components:** 50+
- **API Endpoints:** 25+
- **Database Tables:** 15+
- **Test Coverage:** TBD

---

**Made with ❤️ by Your Team**

**Last Updated:** 2025-10-23  
**Version:** 1.0.0
