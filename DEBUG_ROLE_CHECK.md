# Debug: Role Check untuk Menu "Manage Types"

## Masalah
Menu "Manage Types" tidak muncul meskipun sudah update role di database.

## Solusi yang Sudah Diterapkan

### 1. **Update Login Action** (`src/action/users.ts`)
- ✅ Menambahkan query untuk mendapatkan organization role dari `organization_members`
- ✅ Menambahkan `orgRole` ke return value login action
- ✅ Role code akan di-extract dari `system_roles` (e.g., 'ADMIN_ORG', 'SUPER_ADMIN')

### 2. **Update Login Form** (`src/components/login-form.tsx`)
- ✅ Menambahkan `setRole()` saat login berhasil
- ✅ Role dari `organization_members` akan disimpan ke `useUserStore`

## Cara Testing

### **Step 1: Logout dan Login Ulang**
⚠️ **PENTING**: Perubahan hanya akan terlihat setelah logout dan login ulang!

```bash
1. Logout dari aplikasi
2. Login kembali dengan ahmad.husni@example.com
3. Role akan di-load dari database dan disimpan ke store
```

### **Step 2: Cek Role di Browser Console**
Setelah login, buka browser console (F12) dan jalankan:

```javascript
// Import store (jika perlu)
const { useAuthStore } = await import('./src/store/user-store.ts');

// Cek role saat ini
console.log('Current Role:', useAuthStore.getState().role);
console.log('Permissions:', useAuthStore.getState().permissions);
console.log('User:', useAuthStore.getState().user);
```

### **Step 3: Cek di Database**
Pastikan role sudah benar di database:

```sql
-- Query untuk cek role user
SELECT 
  up.email,
  up.display_name,
  om.id as member_id,
  om.is_active,
  sr.code as role_code,
  sr.name as role_name
FROM user_profiles up
JOIN organization_members om ON om.user_id = up.id
JOIN system_roles sr ON sr.id = om.role_id
WHERE up.email = 'ahmad.husni@example.com';
```

**Expected Result:**
- `role_code` harus = `'ADMIN_ORG'` atau `'SUPER_ADMIN'`
- `is_active` harus = `true`

### **Step 4: Cek Menu Sidebar**
Setelah login ulang:
1. Buka sidebar
2. Klik menu "Leaves"
3. **Jika role = ADMIN_ORG atau SUPER_ADMIN** → Menu "Manage Types" akan muncul ✅
4. **Jika role = USER atau lainnya** → Menu "Manage Types" tidak muncul ❌

## Role Codes di Sistem

| Role Code | Role Name | Akses Manage Types |
|-----------|-----------|-------------------|
| `SUPER_ADMIN` | Super Admin | ✅ Yes |
| `ADMIN_ORG` | Admin Organization | ✅ Yes |
| `MANAGER` | Manager | ❌ No |
| `USER` | User/Employee | ❌ No |

## Troubleshooting

### ❌ Menu masih tidak muncul setelah login ulang

**Kemungkinan Penyebab:**

1. **Role di database belum diupdate**
   ```sql
   -- Update role menjadi ADMIN_ORG
   UPDATE organization_members
   SET role_id = (SELECT id FROM system_roles WHERE code = 'ADMIN_ORG')
   WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'ahmad.husni@example.com');
   ```

2. **Member tidak aktif**
   ```sql
   -- Pastikan member aktif
   UPDATE organization_members
   SET is_active = true
   WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'ahmad.husni@example.com');
   ```

3. **Cache browser**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R atau Cmd+Shift+R)
   - Atau gunakan Incognito/Private mode

4. **Store tidak terupdate**
   - Buka browser console
   - Jalankan: `localStorage.clear()` dan `sessionStorage.clear()`
   - Logout dan login ulang

### ❌ Error saat login

Cek browser console untuk error message. Kemungkinan:
- Database connection error
- Query error di `organization_members`
- Role tidak ditemukan

## Kode yang Relevan

### Permission Check di Sidebar (`app-sidebar-new.tsx`)
```typescript
const { role, permissions } = useUserStore();
const isAdmin = role === 'ADMIN_ORG' || role === 'SUPER_ADMIN';
const canManageLeaveTypes = permissions?.includes('leaves:type:manage') || isAdmin;

// Menu hanya muncul jika canManageLeaveTypes = true
```

### Filter Submenu
```typescript
item.subItems?.filter(subItem => {
  // Filter out admin-only items if user is not admin
  if (subItem.requiresAdmin && !canManageLeaveTypes) {
    return false;
  }
  return true;
})
```

## Testing Checklist

- [ ] Database: Role = ADMIN_ORG atau SUPER_ADMIN
- [ ] Database: is_active = true
- [ ] Logout dari aplikasi
- [ ] Clear browser cache (optional)
- [ ] Login ulang dengan ahmad.husni@example.com
- [ ] Buka browser console, cek `useAuthStore.getState().role`
- [ ] Role harus = 'ADMIN_ORG' atau 'SUPER_ADMIN'
- [ ] Buka sidebar menu "Leaves"
- [ ] Menu "Manage Types" harus muncul
- [ ] Klik "Manage Types" → Redirect ke `/leaves/types`

## Kontak Support

Jika masih ada masalah setelah mengikuti semua langkah di atas, silakan:
1. Screenshot browser console (F12)
2. Screenshot hasil query database
3. Screenshot sidebar menu
4. Hubungi developer team

---

**Last Updated**: 2025-11-18  
**Version**: 1.0.0
