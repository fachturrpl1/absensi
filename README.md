
# Presensi-New

Presensi-New adalah aplikasi manajemen kehadiran berbasis web yang dibangun dengan Next.js, React, dan Supabase. Aplikasi ini menyediakan fitur manajemen user, organisasi, jadwal, serta sistem foto profil yang terintegrasi dan otomatis.

## 🚀 Fitur Utama

- **Manajemen User & Organisasi**: CRUD user, organisasi, departemen, posisi, dan role.
- **Sistem Foto Profil Otomatis**: Upload, refresh, dan auto-cleanup foto profil user (lihat `Docs/PHOTO_PROFILE_SYSTEM.md`).
- **Sidebar Dinamis**: Sidebar responsif dengan menu yang dapat dikonfigurasi di `src/lib/menu-list.ts`.
- **Dashboard & Statistik**: Visualisasi data kehadiran dengan chart (lihat komponen di `src/components/`).
- **Autentikasi & Otorisasi**: Menggunakan Supabase Auth dan middleware Next.js.
- **Theme Switcher**: Dukungan dark/light mode.
- **Auto Refresh Data**: Data user dan foto profil otomatis sinkron dengan database.

## 🗂️ Struktur Folder

```
├── Docs/                # Dokumentasi fitur & setup
├── public/              # File statis (ikon, gambar)
├── src/
│   ├── action/          # Server actions (user, attendance, dsb)
│   ├── app/             # Struktur routing Next.js
│   ├── components/      # Komponen UI & admin panel
│   ├── hooks/           # Custom React hooks
│   ├── interface/       # TypeScript interfaces
│   ├── lib/             # Helper & utilitas (menu, utils)
│   ├── store/           # Zustand store (state management)
│   └── utils/           # Helper Supabase & cookie
├── package.json         # Dependensi & script
├── tsconfig.json        # Konfigurasi TypeScript
└── ...
```

## 📦 Dependensi Utama

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [shadcn/ui](https://ui.shadcn.com/) (komponen UI)
- [Lucide React](https://lucide.dev/)
- [Recharts](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📖 Dokumentasi Fitur

- [Sistem Foto Profil](Docs/PHOTO_PROFILE_SYSTEM.md)
- [Setup Foto Profil di Navbar](Docs/PROFILE_PHOTO_SETUP.md)

## 🛠️ Cara Menjalankan

1. Install dependensi:
	```bash
	pnpm install
	# atau
	npm install
	```
2. Copy file `.env.example` ke `.env` dan sesuaikan konfigurasi Supabase.
3. Jalankan development server:
	```bash
	pnpm dev
	# atau
	npm run dev
	```
4. Buka [http://localhost:3000](http://localhost:3000)

---
Untuk detail lebih lanjut, cek dokumentasi di folder `Docs/`.
