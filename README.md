# Presensi - Smart Attendance Management

Aplikasi manajemen kehadiran berbasis web untuk organisasi/perusahaan dengan fitur lengkap dan modern.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

---

## Fitur Utama

- 🏢 **Multi-Organization** - Satu instance untuk banyak organisasi
- 👥 **Manajemen Karyawan** - Data lengkap dengan departemen & jabatan
- 📅 **Jadwal Fleksibel** - Fixed, rotating, dan flexible schedule
- ⏰ **Tracking Kehadiran** - Web, mobile, RFID (planned)
- 📊 **Analytics** - Dashboard dan laporan lengkap
- 🔐 **RBAC** - Role-based access control
- 🌍 **Multi-timezone** - Support berbagai zona waktu
- ⚡ **Real-time** - Live updates via Supabase
- 🎨 **Modern UI** - shadcn/ui components
- 📱 **Responsive** - Desktop, tablet, mobile

---

## Tech Stack

**Frontend:** Next.js 15, React 19, TypeScript 5, TailwindCSS 4, shadcn/ui

**Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)

**State:** React Query v5, Zustand

**Form:** React Hook Form + Zod

---

## Quick Start

```bash
# Clone repo
git clone https://github.com/your-org/presensi.git
cd presensi

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# Run development
pnpm dev
```

Open http://localhost:3000

---

## Environment Variables

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Dapatkan credentials di [Supabase Dashboard](https://app.supabase.com) → Settings → API

---

## Struktur Project

```
src/
├── app/              # Pages & API routes
│   ├── api/         # API endpoints
│   ├── attendance/  # Attendance pages
│   ├── members/     # Members pages
│   └── ...
├── components/      # React components
├── hooks/           # Custom hooks
├── action/          # Server actions (DB ops)
├── lib/             # Utilities
└── interface/       # TypeScript types
```

---

## Dokumentasi

📚 **Dokumentasi lengkap tersedia di `/docs`:**

- **[Database Schema](./docs/DATABASE.md)** - Struktur database, ERD, query patterns
- **[API Reference](./docs/API.md)** - Semua endpoints dengan examples
- **[Architecture](./docs/ARCHITECTURE.md)** - System design & patterns
- **[Development Guide](./docs/DEVELOPMENT.md)** - Setup & workflow development
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy ke Vercel, Docker, cloud

---

## Scripts

```bash
pnpm dev              # Development server
pnpm dev:network      # Dev dengan network access
pnpm build            # Build production
pnpm start            # Start production
pnpm lint             # Run ESLint
pnpm test             # Run tests
```

---

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/nama-feature
   ```

2. **Develop & test**
   - Ikuti [Development Guide](./docs/DEVELOPMENT.md)
   - Test lokal

3. **Commit & push**
   ```bash
   git commit -m "feat: add feature"
   git push origin feature/nama-feature
   ```

4. **Create Pull Request**

---

## Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Set environment variables
4. Deploy

Auto-deploy:
- `main` → Production
- `develop` → Preview
- PR → Preview URL

### Docker

```bash
docker build -t presensi .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  presensi
```

Lihat [Deployment Guide](./docs/DEPLOYMENT.md) untuk detail.

---

## Contributing

Contributions welcome! Ikuti guidelines:

1. Fork repository
2. Create feature branch
3. Commit dengan format: `feat:`, `fix:`, `docs:`
4. Push & create PR
5. Review & merge

---

## Database Schema

15 tabel utama:
- organizations
- user_profiles
- organization_members
- departments
- positions
- work_schedules
- work_schedule_details
- member_schedules
- attendance_records
- rfid_cards
- system_roles
- permissions
- role_permissions
- user_roles

Lihat [Database Documentation](./docs/DATABASE.md) untuk detail lengkap.

---

## API Endpoints

31+ endpoints tersedia:
- `/api/members` - Members CRUD
- `/api/attendance` - Attendance tracking
- `/api/dashboard` - Dashboard stats
- `/api/groups` - Departments
- `/api/positions` - Positions
- `/api/work-schedules` - Schedules

Lihat [API Documentation](./docs/API.md) untuk detail.

---

## Performance

- **60-74% pengurangan API calls** melalui React Query caching
- Server-side rendering untuk SEO
- Code splitting otomatis
- Image optimization
- CDN-ready

---

## Security

- JWT authentication via Supabase
- Row Level Security (RLS)
- Environment variables untuk secrets
- HTTPS only
- Input validation (Zod)
- Parameterized queries
---

## Support

- **Dokumentasi:** [/docs](./docs)
- **Issues:** [GitHub Issues](https://github.com/your-org/presensi/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/presensi/discussions)

---

## License

MIT License - lihat [LICENSE](LICENSE) file.

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [Radix UI](https://www.radix-ui.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

**Last Updated:** 2025-10-23 | **Version:** 1.0.0
