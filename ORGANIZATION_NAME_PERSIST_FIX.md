# Organization Name Persistence Fix

## ❌ Masalah

Ketika user berpindah dari **Akun 1 (Organization 1)** ke **Akun 2 (Organization 2)**:

```
1. Login dengan Akun 1 → Organisasi: SMK 58 Malang
2. Dashboard menampilkan: "Dashboard — SMK 58 Malang"
3. Logout dari Akun 1
4. Login dengan Akun 2 → Organisasi: SMA Negeri 1 Jakarta
5. ❌ BUG: Dashboard masih menampilkan "Dashboard — SMK 58 Malang"
```

**Nama organisasi dari akun sebelumnya masih tertinggal/nyangkut di dashboard!**

## 🔍 Root Cause Analysis

### 1. **React Query Cache Tidak Ter-invalidate**
**File**: `src/hooks/use-auth-cache-clear.ts`

Saat organization berubah, hook ini meng-invalidate banyak queries:
```typescript
queryClient.invalidateQueries({ queryKey: ['members'] })
queryClient.invalidateQueries({ queryKey: ['groups'] })
queryClient.invalidateQueries({ queryKey: ['positions'] })
// ... dll
```

❌ **TAPI TIDAK meng-invalidate**: `['organization', 'full-data', user?.id]`

Query ini digunakan oleh `useOrganizationData()` untuk fetch nama organisasi yang ditampilkan di dashboard!

### 2. **Browser HTTP Cache**
**File**: `src/app/api/organization/info/route.ts`

API endpoint ini mengembalikan header cache:
```typescript
headers: {
  'Cache-Control': 'private, max-age=3600, s-maxage=3600', // 1 jam cache!
}
```

Browser akan cache response ini selama 1 jam, bahkan setelah logout!

### 3. **Flow Masalah**
```
User 1 login → API call /api/organization/info → Response cached di browser (1 jam)
                                                 → Response cached di React Query
User 1 logout → Service worker cache cleared ✅
              → localStorage cleared ✅
              → React Query cache cleared ✅ (via queryClient.clear())
              → ❌ TAPI browser HTTP cache tetap ada!
              
User 2 login → useOrganizationName() hook fetch data
            → React Query query ['organization', 'full-data', user2.id]
            → Fetch /api/organization/info
            → ❌ Browser return cached response (org 1 data!)
            → Dashboard shows User 1's organization name ❌
```

## 🛠️ Solusi Implementasi

### Fix 1: Invalidate Organization Query di Cache Clear Hook

**File**: `src/hooks/use-auth-cache-clear.ts`

**Sebelum**:
```typescript
// Invalidate all queries that should be organization-specific
queryClient.invalidateQueries({ queryKey: ['members'] })
queryClient.invalidateQueries({ queryKey: ['groups'] })
// ... other queries but NO ['organization']
```

**Sesudah**:
```typescript
// Invalidate all queries that should be organization-specific
queryClient.invalidateQueries({ queryKey: ['organization'] }) // ✅ CRITICAL FIX!
queryClient.invalidateQueries({ queryKey: ['members'] })
queryClient.invalidateQueries({ queryKey: ['groups'] })
// ... other queries
```

**Impact**: Query `['organization', 'full-data', user?.id]` akan di-invalidate dan re-fetch data yang benar!

### Fix 2: Hapus Browser HTTP Cache dari API Endpoint

**File**: `src/app/api/organization/info/route.ts`

**Sebelum**:
```typescript
headers: {
  'Cache-Control': 'private, max-age=3600, s-maxage=3600', // 1 hour cache
}
```

**Sesudah**:
```typescript
headers: {
  // ✅ CRITICAL: No browser cache to prevent stale organization data
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
}
```

**Penjelasan Headers**:
- `no-cache`: Browser harus validasi dengan server sebelum menggunakan cached response
- `no-store`: Browser tidak boleh simpan response di cache
- `must-revalidate`: Expired cache tidak boleh digunakan
- `Pragma: no-cache`: Backward compatibility dengan HTTP/1.0
- `Expires: 0`: Immediately expired

**Impact**: Browser tidak akan cache response API, selalu fetch fresh data!

### Fix 3: Service Worker Cache (Already Handled)

**File**: `src/utils/logout-handler.ts`

Service worker cache sudah di-clear dengan baik saat logout:
```typescript
// Clear Service Worker Cache API
if ('caches' in window) {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
}
```

✅ **Tidak perlu perubahan**, sudah benar!

## 📋 Ringkasan Perubahan

| Masalah | File | Perubahan | Status |
|---------|------|-----------|--------|
| React Query cache tidak invalidate organization query | `use-auth-cache-clear.ts` | Tambah `queryClient.invalidateQueries({ queryKey: ['organization'] })` | ✅ Fixed |
| Browser HTTP cache 1 jam | `api/organization/info/route.ts` | Ubah header ke `no-cache, no-store, must-revalidate` | ✅ Fixed |
| Service worker cache | `logout-handler.ts` | Sudah di-clear dengan benar | ✅ Already OK |

## 🎯 Cara Kerja Fix

### Flow Setelah Fix:
```
User 1 login → API call /api/organization/info 
            → Response: "Cache-Control: no-cache, no-store"
            → React Query cache data
            
User 1 logout → queryClient.clear() ✅
              → Browser HTTP cache: TIDAK ADA (no-store) ✅
              → Service worker cache cleared ✅
              → localStorage cleared ✅
              
User 2 login → useOrganizationName() hook fetch data
            → React Query query ['organization', 'full-data', user2.id]
            → Fetch /api/organization/info (no browser cache!)
            → Server return User 2's organization
            → Dashboard shows User 2's organization name ✅ CORRECT!
```

### Jika Organization Berubah (Same User):
```
User di Org 1 → Data cached di React Query

User switch ke Org 2 → useAuthCacheClear() detects org change
                     → queryClient.invalidateQueries(['organization']) ✅
                     → React Query re-fetch data
                     → Fetch /api/organization/info (no browser cache!)
                     → Dashboard shows Org 2 name ✅ CORRECT!
```

## 🧪 Testing Checklist

### Test 1: User Account Switching (CRITICAL)
1. ✅ Login Akun 1 (user1@mail.com) → Org: SMK 58 Malang
2. ✅ Verifikasi dashboard menampilkan: "Dashboard — SMK 58 Malang"
3. ✅ Logout dari Akun 1
4. ✅ **Check DevTools**: 
   - Network tab: Pastikan tidak ada cached request
   - Application tab: localStorage & sessionStorage kosong
5. ✅ Login Akun 2 (user2@mail.com) → Org: SMA Negeri 1 Jakarta
6. ✅ **Verify**: Dashboard menampilkan "Dashboard — SMA Negeri 1 Jakarta"
7. ✅ **Check Network tab**: `/api/organization/info` fetch fresh data
8. ✅ **Check Response Headers**: `Cache-Control: no-cache, no-store`

### Test 2: Browser Cache Verification
1. Login Akun 1
2. Open DevTools → Network tab
3. Find request `/api/organization/info`
4. Check Response Headers:
   - ✅ `Cache-Control: private, no-cache, no-store, must-revalidate`
   - ✅ `Pragma: no-cache`
   - ✅ `Expires: 0`
5. Reload page multiple times
6. **Verify**: Setiap reload ada network request baru (tidak dari cache)

### Test 3: React Query Cache Invalidation
1. Open React Query DevTools (if available)
2. Login dan lihat query `['organization', 'full-data', userId]`
3. Switch organization atau logout/login
4. **Verify**: Query status menjadi `invalidated` → `fetching` → `success`

### Test 4: Quick Switch Test
```
Akun 1 (Org A) → Logout → Akun 2 (Org B) → Logout → Akun 1 (Org A)
```
Setiap kali login, pastikan nama organisasi yang muncul BENAR sesuai akun.

## 💡 Why This Happens

Ini adalah **race condition** antara multiple caching layers:
1. **React Query Cache** (in-memory) ✅ Cleared on logout
2. **Browser HTTP Cache** (disk/memory) ❌ NOT cleared, 1 hour TTL
3. **Service Worker Cache** (disk) ✅ Cleared on logout
4. **localStorage** (disk) ✅ Cleared on logout

Ketika logout, React Query cache di-clear, tapi **browser HTTP cache tetap ada**. Saat login dengan user baru, React Query fetch data, tapi browser return **cached response dari user lama**.

## 🎉 Benefits

1. ✅ **No Data Leakage**: Nama organisasi selalu sesuai dengan user yang login
2. ✅ **Fresh Data**: Setiap fetch selalu dapat data terbaru dari server
3. ✅ **Better UX**: Tidak ada confusion nama organisasi salah
4. ✅ **Security**: Organization data tidak di-cache di browser
5. ✅ **Consistent Behavior**: Organization switching dan user switching work correctly

## ⚠️ Trade-offs & Considerations

### Performance Impact (Minimal)
- **Before**: Organization info cached 1 jam di browser
- **After**: Setiap request fetch dari server
- **Impact**: 
  - Organization info jarang berubah dan ukuran response kecil (~200 bytes)
  - React Query tetap cache di memory (5 menit staleTime)
  - Trade-off acceptable untuk correctness

### Cache Strategy
```
❌ Browser HTTP Cache (removed) - Causes stale data issue
✅ React Query Cache (kept) - Works correctly, invalidated on user/org change
✅ Service Worker Cache (cleared on logout) - No impact on API data
```

### Alternative Solutions (NOT Used)
1. ❌ **Add timestamp to API URL**: Complex, breaks React Query key stability
2. ❌ **Use POST instead of GET**: Semantically incorrect, breaks browser caching properly
3. ✅ **Remove browser cache via headers**: Simple, effective, correct ✅ USED

## 📂 Files Modified

```
✅ src/hooks/use-auth-cache-clear.ts
   - Added organization query invalidation

✅ src/app/api/organization/info/route.ts
   - Changed Cache-Control headers to prevent browser caching
   
✅ ORGANIZATION_NAME_PERSIST_FIX.md (NEW)
   - Comprehensive documentation of the fix
```

## 🔗 Related Fixes

Ini melengkapi fix sebelumnya:
- **ORGANIZATION_CACHE_FIX.md**: Handles organization switching (same user)
- **USER_SWITCHING_FIX.md**: Handles user account switching (logout/login)
- **THIS FIX**: Handles organization name persistence in browser cache

Sekarang cache isolation lengkap:
- ✅ Between organizations (same user)
- ✅ Between users (different accounts)
- ✅ Browser cache cleared for critical data

---

**Status**: ✅ FIXED & READY FOR TESTING  
**Priority**: 🔴 HIGH - User-visible bug, data leakage  
**Impact**: Organization name display, user account switching  
**Breaking Changes**: None - Only improves cache behavior  
**TypeScript**: ✅ Type-safe, no errors
