# Organization Cache Isolation Fix

## Masalah
Saat user pindah dari Organization 1 ke Organization 2, data dari Organization 1 masih muncul karena React Query cache tidak di-invalidate dan query keys tidak include `organizationId`.

## Solusi Implementasi

### 1. **Update `useAuthCacheClear` Hook**
**File**: `src/hooks/use-auth-cache-clear.ts`

**Perubahan**:
- ✅ Track `organizationId` dengan `useRef` untuk detect perubahan
- ✅ Saat organization berubah, invalidate semua queries organization-specific
- ✅ Clear permissions yang bersifat organization-specific
- ✅ Log perubahan organization untuk debugging

**Queries yang di-invalidate**:
- `members`
- `groups`
- `positions`
- `dashboard`
- `attendance`
- `workSchedules`
- `memberSchedules`
- `departmentMembers`
- `analytics`
- `member-recent-attendance`

### 2. **Update Query Keys dengan organizationId**

#### **Members** (`src/hooks/use-members.ts`)
```typescript
// SEBELUM:
queryKey: ["members"]

// SESUDAH:
queryKey: ["members", organizationId]
enabled: !!organizationId
```

#### **Groups** (`src/hooks/use-groups.ts`)
```typescript
// SEBELUM:
queryKey: ["groups"]

// SESUDAH:
queryKey: ["groups", organizationId]
enabled: !!organizationId
```

#### **Positions** (`src/hooks/use-positions.ts`)
```typescript
// SEBELUM:
queryKey: ["positions"]

// SESUDAH:
queryKey: ["positions", organizationId]
enabled: !!organizationId
```

#### **Today Summary** (`src/hooks/use-today-summary.ts`)
```typescript
// SEBELUM:
queryKey: ['dashboard', 'today-summary']

// SESUDAH:
queryKey: ['dashboard', 'today-summary', organizationId]
enabled: !!organizationId
```

#### **Monthly Trend** (`src/hooks/use-monthly-trend.ts`)
```typescript
// SEBELUM:
queryKey: ['dashboard', 'monthly-trend']

// SESUDAH:
queryKey: ['dashboard', 'monthly-trend', organizationId]
enabled: !!organizationId
```

#### **Analytics** (`src/hooks/use-analytics.ts`)
```typescript
// SEBELUM:
queryKey: ['analytics']

// SESUDAH:
queryKey: ['analytics', organizationId]
enabled: !!organizationId
```

## Cara Kerja

### Skenario 1: User Login/Logout
```
User Login → useAuthCacheClear detects user change → queryClient.clear() → ALL cache cleared
```

### Skenario 2: User Pindah Organization
```
User switches org (Org 1 → Org 2) 
→ useAuthCacheClear detects organizationId change
→ invalidateQueries() untuk semua organization-specific queries
→ setPermissions([]) clear permissions lama
→ React Query auto-refetch dengan organizationId baru
→ Data Org 2 muncul, data Org 1 hilang
```

## Benefits

1. ✅ **Cache Isolation**: Setiap organization punya cache terpisah
2. ✅ **No Data Leakage**: Data organization lama tidak muncul saat pindah
3. ✅ **Automatic Refresh**: React Query auto-refetch saat organization berubah
4. ✅ **Performance**: Cache tetap berfungsi dalam 1 organization
5. ✅ **Security**: Permissions di-clear saat organization berubah

## Testing

### Manual Test:
1. Login ke aplikasi
2. Buka Organization 1, lihat members/data
3. Switch ke Organization 2
4. **Expected**: Data Organization 1 TIDAK muncul, hanya data Organization 2
5. Console log akan menampilkan: `[Auth Cache Clear] Organization changed, invalidating organization-specific cache`

### Verification Points:
- ✅ Members list berubah sesuai organization
- ✅ Groups/Departments berubah
- ✅ Positions berubah
- ✅ Dashboard stats berubah
- ✅ Attendance records berubah
- ✅ Analytics data berubah
- ✅ No console errors
- ✅ Log menunjukkan organization change detected

## Related Files Modified

1. `src/hooks/use-auth-cache-clear.ts` - Main cache invalidation logic
2. `src/hooks/use-members.ts` - Add organizationId to queryKey
3. `src/hooks/use-groups.ts` - Add organizationId to queryKey
4. `src/hooks/use-positions.ts` - Add organizationId to queryKey
5. `src/hooks/use-today-summary.ts` - Add organizationId to queryKey
6. `src/hooks/use-monthly-trend.ts` - Add organizationId to queryKey
7. `src/hooks/use-analytics.ts` - Add organizationId to queryKey

## Notes

- Hooks yang sudah punya `organizationId` di queryKey (seperti `use-dashboard-stats`, `use-recent-activity`, `use-work-schedules`, `use-member-schedules`) tidak perlu diubah
- `useOrganizationData` menggunakan `user?.id` di queryKey karena organization tied to user
- `useSession` dan `useUserProfile` tidak perlu organizationId karena user-specific, bukan organization-specific

## Monitoring

Check browser console untuk log:
- `[Auth Cache Clear] Organization changed, invalidating organization-specific cache`
- `[React Query] Fetching members via API for org: {organizationId}`
- `[React Query] Fetching groups via API for org: {organizationId}`

Jika organization change tidak terdeteksi, pastikan:
1. `useAuthCacheClear` dipanggil di root layout/component
2. `useOrganizationId` return value berubah saat switch organization
3. React Query DevTools menunjukkan queries di-invalidate
