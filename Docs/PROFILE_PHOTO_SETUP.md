# Profile Photo Display Setup

Panduan untuk menampilkan foto profil user dari database di menu navbar.

## Perubahan yang Dilakukan

### 1. Update User Store (`src/store/user-store.ts`)
- Menggunakan interface `IUser` dari `@/interface` yang lebih lengkap
- Mengganti interface User sederhana dengan IUser yang memiliki field `profile_photo_url`

### 2. Update Interface User (`src/interface/index.ts`)
- Menambahkan field `email: string` yang wajib ada di interface IUser
- Field `profile_photo_url?: string` sudah ada

### 3. Update Login Action (`src/action/users.ts`)
- Mengembalikan data user lengkap termasuk semua field profile
- Menggunakan spread operator `...profile` untuk menyertakan `profile_photo_url`

### 4. Custom Hook untuk Profile (`src/hooks/use-profile.ts`)
- `useProfileRefresh()`: Hook untuk refresh data user dari database
- `useProfilePhotoUrl()`: Hook untuk memproses URL foto profil dengan benar
- Menangani berbagai format URL (relative path, Supabase URL, external URL)

### 5. Update UserNav Component (`src/components/admin-panel/user-nav.tsx`)
- Menggunakan hook `useProfileRefresh` dan `useProfilePhotoUrl`
- Menambahkan tombol refresh manual untuk sinkronisasi data
- Error handling yang lebih baik untuk gambar yang gagal dimuat
- Debug logging untuk troubleshooting

### 6. Update Account Form (`src/components/form/account-form.tsx`)
- Menggunakan hook refresh untuk update data setelah upload foto
- Sinkronisasi langsung dengan auth store tanpa reload halaman
- Update navbar secara real-time setelah upload foto berhasil

## Fitur yang Tersedia

### 1. Auto Refresh
- Data profile user akan ter-refresh otomatis saat komponen UserNav dimuat
- Memastikan data selalu sinkron dengan database

### 2. Manual Refresh
- Tombol refresh di dropdown profile untuk manual sync
- Berguna ketika user baru saja update foto di tab lain

### 3. Fallback Avatar
- Menampilkan inisial nama jika foto tidak tersedia
- Avatar fallback dengan styling yang menarik

### 4. URL Processing
- Otomatis memproses berbagai format URL foto:
  - Full HTTP/HTTPS URL
  - Supabase storage URL
  - Relative path dari API

## Cara Kerja

### 1. Login Flow
```typescript
// Action login mengembalikan data user lengkap
return {
  success: true,
  user: {
    id: user.id,
    email: user.email,
    ...profile, // Termasuk profile_photo_url
  },
  roles,
  permissions,
}
```

### 2. Profile Photo URL Processing
```typescript
// Hook useProfilePhotoUrl memproses URL
const profilePhotoUrl = useProfilePhotoUrl(user?.profile_photo_url)

// Hasil: URL yang siap digunakan atau undefined
```

### 3. Upload & Sync Flow
```typescript
// Setelah upload berhasil
if (result.success) {
  // 1. Update auth store immediately
  setUser({ ...currentUser, profile_photo_url: result.url })
  
  // 2. Refresh from server
  await refreshProfile()
}
```

## Environment Variables yang Diperlukan

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_API_URL=your_api_base_url  # Optional
```

## Troubleshooting

### 1. Foto tidak muncul
- Cek console log untuk error messages
- Pastikan `profile_photo_url` ada di database
- Verify URL format dan accessibility

### 2. Foto tidak update setelah upload
- Cek apakah hook `useProfileRefresh` dipanggil
- Pastikan auth store ter-update
- Gunakan tombol refresh manual jika diperlukan

### 3. Debug Mode
- Console log akan menampilkan:
  - User data lengkap
  - URL foto yang diproses
  - Status load/error gambar

## Best Practices

1. **Selalu gunakan hook `useProfileRefresh`** saat ada perubahan data profile
2. **Update auth store secara langsung** untuk responsiveness
3. **Fallback ke inisial** jika foto tidak tersedia
4. **Handle error loading** dengan graceful degradation
5. **Log untuk debugging** tapi remove di production

## File yang Dimodifikasi

- `src/store/user-store.ts`
- `src/interface/index.ts`
- `src/action/users.ts`
- `src/components/admin-panel/user-nav.tsx`
- `src/components/form/account-form.tsx`
- `src/hooks/use-profile.ts` (baru)

Semua perubahan sudah terintegrasi dan foto profil user dari database sekarang akan ditampilkan di menu navbar dekat setting tema.