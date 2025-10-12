
# Presensi-New

Presensi-New adalah aplikasi manajemen kehadiran berbasis web (Next.js + React) yang menggunakan Supabase untuk autentikasi, database Postgres, dan storage. Aplikasi menyediakan modul untuk organisasi, anggota (members), jadwal kerja, absensi, role/permission, dan manajemen file (logo/foto profil).

## Ringkasan singkat

- Framework: Next.js (app router), React 19
- Backend-as-a-Service: Supabase (Auth, Postgres, Storage, Realtime)
- State management: Zustand
- Styling: TailwindCSS + shadcn/ui

## Fitur penting

- Autentikasi via Supabase Auth
- Manajemen organisasi, departemen, posisi, anggota
- Manajemen jadwal kerja dan rekaman kehadiran (attendance)
- Upload & serve logo/foto profil lewat Supabase Storage (bucket: `logo`)
- Realtime listener untuk tabel attendance (Realtime via Supabase)

## Environment variables (wajib)

Pastikan menambahkan variabel berikut di file `.env` (contoh `.env.local`):

- NEXT_PUBLIC_SUPABASE_URL — URL Supabase (mis. https://xyz.supabase.co)
- NEXT_PUBLIC_SUPABASE_ANON_KEY — ANON (public) key untuk klien

Catatan: bila Anda membuat utility server-side yang membutuhkan akses admin, Anda mungkin juga akan menggunakan SUPABASE_SERVICE_ROLE (jangan pernah letakkan ini di kode klien atau repo publik).

## Supabase: tabel & bucket yang dipakai

Kode saat ini mengakses tabel-tabel dan bucket berikut (pastikan sudah ada di project Supabase Anda):

- Tables (Postgres):
	- organizations
	- organization_members
	- users (Supabase Auth + user metadata)
	- departments
	- positions
	- system_roles
	- role_permissions
	- attendance_records
	- work_schedules
	- work_schedule_details
	- rfid_cards
	- members_schedule (atau member schedules — periksa nama di DB jika berbeda)

- Storage buckets:
	- `logo` — menyimpan logo / foto organisasi (folder `organization/` digunakan oleh utilitas)

Jika Anda memakai kebijakan RLS (recommended), pastikan policy SELECT/INSERT/UPDATE/DELETE yang diperlukan telah dibuat, khususnya untuk storage bucket `logo`.

## Menjalankan aplikasi secara lokal

1. Install dependensi

```bash
pnpm install
# atau: npm install
```

2. Siapkan environment

- Buat file `.env.local` (atau `.env`) dan isi variabel yang diperlukan (lihat bagian Environment variables).

3. Jalankan development server

```bash
pnpm dev
# atau
npm run dev
```

4. Akses di http://localhost:3000

Jika Anda mau mengakses server dari jaringan lokal (mis. untuk testing di device lain), jalankan `pnpm dev:network` atau gunakan `--hostname 0.0.0.0` sesuai `package.json` script.

## Menghubungkan database / mengekspor skema

Saya tidak memiliki akses langsung ke database Anda dari sini. Untuk mendokumentasikan atau memindahkan skema, lakukan salah satu dari langkah berikut di workspace Supabase Anda:

1. Supabase Studio -> Settings -> Database -> New backup / SQL -> Export schema
2. Gunakan CLI supabase

```bash
# login (daftar kalau perlu)
supabase login

# export schema ke file
supabase db dump --schema-only > supabase_schema.sql
```

Simpan hasil export di repo (mis. `db/schema.sql`) atau bagikan file itu ketika Anda ingin saya bantu integrasikan/membuat migration scripts.

## Catatan penting & troubleshooting cepat

- Middleware aplikasi memakai `@supabase/ssr` untuk membuat server client yang membaca cookie session — pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` tersedia pada environment saat running dev/build.
- Jika Anda melihat error terkait cookie Supabase (malformed cookie), utilitas `src/utils/cookie-helper.ts` menyediakan fungsi untuk membersihkan cookie auth yang rusak.
- Storage: utilitas `src/lib/supabase-storage-debug.ts` membantu mengecek bucket `logo` dan permission.
- Realtime: halaman attendance mendaftarkan channel realtime pada tabel `attendance_records`.

## Pengujian singkat (smoke test)

- Pastikan env terpasang, jalankan `pnpm dev` dan buka `http://localhost:3000`.
- Masuk (signup/login) menggunakan Supabase Auth. Jika sign up berhasil, middleware akan mengarahkan user baru ke onboarding jika belum terdaftar di `organization_members`.

## Jika Anda mau saya bantu lebih lanjut

- Saya bisa:
	- Membuat skrip migrasi SQL berdasarkan struktur code jika Anda kirimkan skema DB saat ini.
	- Menambahkan contoh `.env.example` jika Anda mau saya buat (kami tidak punya file `.env.example` di repo sekarang).
	- Menulis checklist RLS/storage policy minimal untuk bucket `logo`.

Silakan beri tahu yang Anda inginkan selanjutnya — saya bisa menambahkan `.env.example`, cek policy bucket Anda (jika Anda berikan export), atau menuliskan migration SQL.
