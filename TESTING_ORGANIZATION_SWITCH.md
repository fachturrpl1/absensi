# Testing Guide: Organization Switching Cache Fix

## Pre-requisites
1. Aplikasi sudah running: `npm run dev`
2. User memiliki akses ke minimal 2 organizations
3. Browser DevTools terbuka (Console + Network tabs)

## Test Steps

### 1. Initial Setup
```bash
# Clear cache dan restart
rm -rf .next .turbo
npm run dev
```

### 2. Login dan Verify Organization 1
1. **Login** ke aplikasi
2. **Buka Organization 1** (dari dropdown/switcher)
3. **Catat data yang muncul**:
   - [ ] Members list (jumlah dan nama)
   - [ ] Groups/Departments
   - [ ] Positions
   - [ ] Dashboard stats (total members, attendance rate)
   - [ ] Recent activity
   - [ ] Today's summary

4. **Check Browser Console**:
   ```
   ✅ Should see: "[React Query] Fetching members via API for org: 1"
   ✅ Should see: "[React Query] Fetching groups via API for org: 1"
   ```

### 3. Switch to Organization 2 (CRITICAL TEST)
1. **Switch ke Organization 2** (via dropdown/switcher)
2. **Immediately check console**:
   ```
   ✅ Expected: "[Auth Cache Clear] Organization changed, invalidating organization-specific cache"
   ✅ Expected: "from: 1, to: 2"
   ```

3. **Verify cache invalidation**:
   ```
   ✅ Should see: queryClient.invalidateQueries untuk:
      - members
      - groups
      - positions
      - dashboard
      - attendance
      - analytics
   ```

4. **Verify data refresh**:
   ```
   ✅ Should see: "[React Query] Fetching members via API for org: 2"
   ✅ Should see: "[React Query] Fetching groups via API for org: 2"
   ```

### 4. Verify No Data Leakage (CRITICAL)
**Compare Organization 1 vs Organization 2 data**:

| Data Type | Org 1 | Org 2 | ✅ Pass? |
|-----------|-------|-------|----------|
| Members count | X members | Y members | Different? |
| Members names | List A | List B | Different? |
| Groups | Groups A | Groups B | Different? |
| Positions | Positions A | Positions B | Different? |
| Dashboard stats | Stats A | Stats B | Different? |
| Recent activity | Activity A | Activity B | Different? |

**❌ FAIL if**:
- Organization 1 members muncul di Organization 2
- Organization 1 stats masih terlihat
- Any old data persists

**✅ PASS if**:
- Semua data berbeda
- No data from Org 1 in Org 2
- Fresh data loaded dari API

### 5. React Query DevTools Check (Optional)
Jika React Query DevTools installed:

1. **Open DevTools**
2. **Before switch**: Check query keys
   ```
   ["members", 1]
   ["groups", 1]
   ["positions", 1]
   ["dashboard", "today-summary", 1]
   ```

3. **After switch to Org 2**: Check query keys
   ```
   ["members", 2]  ← NEW
   ["groups", 2]   ← NEW
   ["positions", 2] ← NEW
   ["dashboard", "today-summary", 2] ← NEW
   ```

4. **Verify**: Old queries dengan organizationId=1 should be **stale/inactive**

### 6. Network Tab Verification
Check Network tab untuk verify API calls:

**After switch to Org 2**:
```
✅ GET /api/members (should happen)
✅ GET /api/groups (should happen)
✅ GET /api/positions (should happen)
✅ GET /api/dashboard/today-summary (should happen)
✅ GET /api/dashboard/stats (should happen)
```

**Response verification**:
- Check response data matches Organization 2
- No cached Organization 1 data returned

### 7. Multiple Switches Test
1. Switch: Org 1 → Org 2 → Org 1 → Org 2
2. **Each switch should**:
   - Trigger cache invalidation log
   - Load correct organization data
   - No stale data from previous org

### 8. Performance Check
**Expected behavior**:
- First load: Fetches from API (slow)
- Within same org: Uses cache (fast)
- Switch org: Invalidates and refetches (medium)
- Return to previous org: May use cache if not expired (fast)

## Expected Console Logs

### Normal Flow:
```
[Auth Cache Clear] Organization changed, invalidating organization-specific cache { from: 1, to: 2 }
[React Query] Fetching members via API for org: 2
[React Query] Fetching groups via API for org: 2
[React Query] Fetching positions via API for org: 2
```

### ❌ BAD Logs (should NOT appear):
```
❌ [Error] Failed to fetch members
❌ [WARN] Failed to set cookie (di production)
❌ No organization change log when switching
```

## Common Issues & Solutions

### Issue 1: Organization change not detected
**Symptoms**: No cache invalidation log when switching
**Fix**: 
- Check `useAuthCacheClear` dipanggil di root layout
- Verify `useOrganizationId` returns different value

### Issue 2: Stale data still appears
**Symptoms**: Organization 1 data muncul di Organization 2
**Fix**:
- Clear browser cache
- Check query keys include organizationId
- Verify `enabled: !!organizationId` ada

### Issue 3: Too many API calls
**Symptoms**: Same API called multiple times
**Fix**:
- Check staleTime configuration
- Verify no duplicate hook calls
- Check refetchOnMount/refetchOnWindowFocus settings

## Success Criteria

✅ **All tests pass if**:
1. Organization change detected dan logged
2. Cache invalidation terjadi untuk semua org-specific queries
3. No data leakage antara organizations
4. Fresh data loaded setiap organization switch
5. No console errors
6. Performance acceptable (cache works within org)
7. Permissions cleared saat organization berubah

## Rollback Plan

Jika ada masalah:
```bash
git restore src/hooks/use-auth-cache-clear.ts
git restore src/hooks/use-members.ts
git restore src/hooks/use-groups.ts
git restore src/hooks/use-positions.ts
git restore src/hooks/use-today-summary.ts
git restore src/hooks/use-monthly-trend.ts
git restore src/hooks/use-analytics.ts
rm -rf .next .turbo
npm run dev
```

## Reporting Issues

Jika test gagal, report dengan:
1. Screenshot console logs
2. Network tab screenshot
3. Data yang terlihat (redact sensitive info)
4. Browser dan version
5. Steps to reproduce

---
**Created**: 2025-11-15  
**Related**: ORGANIZATION_CACHE_FIX.md  
**Status**: Ready for Testing
