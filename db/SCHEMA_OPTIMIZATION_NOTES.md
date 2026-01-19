# Schema Organization Members - Optimasi untuk Halaman Member

## 📋 Perubahan Utama

### 1. **User ID menjadi NULLABLE**
**Sebelum:** `user_id UUID NOT NULL`  
**Sesudah:** `user_id UUID NULL`

**Alasan:** 
- Support import member tanpa email/user account
- Member bisa di-import hanya dengan biodata (NIK)
- Check constraint memastikan minimal salah satu: `user_id`, `employee_id`, atau `biodata_nik` harus ada

```sql
CONSTRAINT organization_members_user_or_biodata_check 
  CHECK (
    user_id IS NOT NULL OR 
    employee_id IS NOT NULL OR 
    biodata_nik IS NOT NULL
  )
```

### 2. **Unique Constraint untuk user_id diubah menjadi DEFERRABLE**
**Sebelum:** Constraint langsung enforce  
**Sesudah:** `DEFERRABLE INITIALLY DEFERRED`

**Alasan:**
- Allow multiple NULL values untuk `user_id` dalam unique constraint
- PostgreSQL unique constraint dengan DEFERRED memungkinkan NULL values

### 3. **Foreign Keys ON DELETE diubah menjadi SET NULL**
**Sebelum:** 
- `department_id`, `position_id`, `role_id` mungkin menggunakan CASCADE
- `biodata_nik` menggunakan SET NULL

**Sesudah:** 
- Semua optional foreign keys menggunakan `ON DELETE SET NULL`
- Hanya `organization_id` dan `user_id` yang tetap `CASCADE`

**Alasan:**
- Mencegah data loss jika department/position/role dihapus
- Member tetap bisa dipertahankan meskipun relasinya dihapus

### 4. **Index Optimization**

#### Index yang Ditambahkan:
- ✅ `idx_org_members_biodata_nik` - untuk query berdasarkan biodata_nik
- ✅ `idx_org_members_employee_id` - untuk query berdasarkan employee_id
- ✅ `idx_org_members_created_at` - untuk sorting newest/oldest
- ✅ Partial indexes dengan `WHERE IS NOT NULL` untuk kolom nullable

#### Index yang Dioptimasi:
- ✅ Composite index `idx_org_members_active` - untuk filter active members per organization
- ✅ Composite index `idx_org_members_user_org` - untuk lookup user di organization

**Alasan:**
- Partial indexes lebih efisien untuk kolom nullable
- Composite indexes sesuai dengan query pattern di halaman member

### 5. **Hire Date menjadi NULLABLE**
**Sebelum:** `hire_date DATE NOT NULL`  
**Sesudah:** `hire_date DATE NULL`

**Alasan:**
- Import member tidak selalu punya hire_date
- Field ini tidak ditampilkan di table, hanya di detail page

### 6. **Tambah Kolom Email Langsung di Tabel dengan Constraints**
**Sebelum:** Email hanya dari `user_profiles.email` via `user_id`  
**Sesudah:** `email CHARACTER VARYING(255) NULL` langsung di tabel dengan constraints

**Alasan:**
- ✅ Bisa import member dengan email tanpa perlu membuat user account
- ✅ Email tersedia langsung untuk query tanpa join ke `user_profiles`
- ✅ Lebih mudah untuk display dan export
- ✅ Jika `user_id` ada, email bisa sync dengan `user_profiles.email` atau bisa berbeda (denormalized)

**Constraints:**
- ✅ **Unique per Organization:** `UNIQUE (organization_id, email)` - Satu email hanya boleh digunakan sekali per organization
- ✅ **Email Format Validation:** CHECK constraint untuk validasi format email (jika email tidak NULL)
- ✅ **DEFERRABLE:** Unique constraint menggunakan `DEFERRABLE INITIALLY DEFERRED` untuk allow multiple NULL values

**Indexes:**
- ✅ `idx_org_members_email` - untuk search/filter by email
- ✅ `idx_org_members_email_org` - composite index untuk unique constraint dan query by organization + email

## 📊 Kolom yang Digunakan di Halaman Member

### ✅ **Kolom yang DITAMPILKAN di Table:**
1. **Members (nama)** → dari `user_profiles` via `user_id` atau `biodata` via `biodata_nik`
2. **Email** → dari `email` (kolom langsung di tabel) atau `user_profiles.email`
3. **NIK** → dari `biodata` via `biodata_nik`
4. **NISN** → dari `biodata` via `biodata_nik`
5. **Group** → dari `departments` via `department_id`
6. **Gender** → dari `biodata` via `biodata_nik`
7. **Religion** → dari `biodata` via `biodata_nik`
8. **Role** → dari `system_roles` via `role_id`
9. **Status** → dari `is_active`

### 📝 **Kolom untuk EXPORT:**
- Full Name → dari `user_profiles` atau `biodata`
- **Email** → dari `email` (kolom langsung) atau fallback ke `user_profiles.email`
- Phone → dari `user_profiles` atau `biodata.no_telepon`
- Department/Group → dari `departments`
- Role → dari `system_roles`
- Status → dari `is_active`

### 📄 **Kolom untuk DETAIL PAGE (tidak ditampilkan di table):**
- `hire_date`, `probation_end_date`, `contract_type`
- `employment_status`, `termination_date`, `work_location`
- `direct_manager_id`, `position_id`

## 🔗 Relasi yang Diperlukan

### Relasi Utama (Required untuk Table):
```sql
-- User profile (untuk nama, email, phone)
user_id → user_profiles(id)

-- Biodata (untuk NIK, NISN, gender, religion)
biodata_nik → biodata(nik)

-- Department/Group (untuk group name)
department_id → departments(id)

-- Role (untuk role name)
role_id → system_roles(id)

-- Organization (untuk filtering)
organization_id → organizations(id)
```

### Relasi Optional (untuk Detail Page):
```sql
-- Position (untuk jabatan)
position_id → positions(id)

-- Manager (untuk reporting)
direct_manager_id → organization_members(id)
```

## 🚀 Query Optimization

### Query yang Dioptimasi:

#### 1. **Fetch Members untuk Table:**
```sql
SELECT 
  om.*,  -- Termasuk kolom email langsung
  biodata.*,
  user_profiles(id, email, first_name, middle_name, last_name, display_name),
  departments(id, name, code, organization_id),
  system_roles(id, code, name, description)
FROM organization_members om
WHERE om.organization_id = $1 
  AND om.is_active = true
ORDER BY om.created_at ASC;
```

**Note:** Email bisa diambil dari `om.email` (kolom langsung) atau fallback ke `user_profiles.email`

**Index yang digunakan:**
- `idx_org_members_active` (composite: organization_id + is_active)

#### 2. **Lookup Member by User:**
```sql
SELECT * 
FROM organization_members
WHERE user_id = $1 AND organization_id = $2;
```

**Index yang digunakan:**
- `idx_org_members_user_org` (composite: user_id + organization_id)

#### 3. **Lookup Member by Biodata:**
```sql
SELECT * 
FROM organization_members
WHERE biodata_nik = $1;
```

**Index yang digunakan:**
- `idx_org_members_biodata_nik` (partial: WHERE biodata_nik IS NOT NULL)

## ⚠️ Breaking Changes

### 1. **User ID bisa NULL**
- **Impact:** Query yang assume `user_id` selalu ada perlu di-update
- **Solution:** Gunakan `LEFT JOIN` atau check NULL sebelum akses user data
- **Example:**
  ```typescript
  // Sebelum (akan error jika user_id null)
  const name = member.user.first_name;
  
  // Sesudah (safe dengan optional chaining)
  const name = member.user?.first_name || member.biodata?.nama || "No Name";
  ```

### 2. **Hire Date bisa NULL**
- **Impact:** Code yang assume `hire_date` selalu ada perlu di-update
- **Solution:** Handle NULL values atau set default value

### 3. **Unique Constraint untuk user_id**
- **Impact:** Multiple NULL values sekarang allowed untuk `user_id`
- **Solution:** Tidak perlu perubahan, ini perbaikan

## 📝 Migration Notes

### Step 1: Backup Data
```sql
CREATE TABLE organization_members_backup AS 
SELECT * FROM organization_members;
```

### Step 2: Drop Existing Constraints
```sql
-- Drop existing unique constraint jika ada
ALTER TABLE organization_members 
DROP CONSTRAINT IF EXISTS organization_members_organization_id_user_id_key;
```

### Step 3: Alter Table
```sql
-- Make user_id nullable
ALTER TABLE organization_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Make hire_date nullable
ALTER TABLE organization_members 
ALTER COLUMN hire_date DROP NOT NULL;

-- Add email column
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS email CHARACTER VARYING(255) NULL;

-- Add check constraint
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_user_or_biodata_check 
CHECK (
  user_id IS NOT NULL OR 
  employee_id IS NOT NULL OR 
  biodata_nik IS NOT NULL
);
```

### Step 4: Recreate Unique Constraint with DEFERRED
```sql
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_id_user_id_key 
UNIQUE (organization_id, user_id) 
DEFERRABLE INITIALLY DEFERRED;
```

### Step 5: Create New Indexes
```sql
-- Run semua CREATE INDEX dari schema file, termasuk:
CREATE INDEX IF NOT EXISTS idx_org_members_email 
  ON public.organization_members 
  USING btree (email) 
  TABLESPACE pg_default
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_members_email_org 
  ON public.organization_members 
  USING btree (organization_id, email) 
  TABLESPACE pg_default
  WHERE email IS NOT NULL;
```

### Step 6: Add Email Constraints
```sql
-- Add unique constraint untuk email per organization
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_id_email_key 
UNIQUE (organization_id, email) 
DEFERRABLE INITIALLY DEFERRED;

-- Add email format validation
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_email_format_check 
CHECK (
  email IS NULL OR 
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);
```

### Step 7: Migrate Existing Email Data (Optional)
```sql
-- Copy email dari user_profiles ke kolom email jika user_id ada
UPDATE organization_members om
SET email = up.email
FROM user_profiles up
WHERE om.user_id = up.id 
  AND om.email IS NULL 
  AND up.email IS NOT NULL;
```

## ✅ Testing Checklist

- [ ] Import member dengan email (user_id ada)
- [ ] Import member tanpa email (user_id NULL, biodata_nik ada)
- [ ] Query members untuk table (semua relasi load dengan benar)
- [ ] Filter by organization (menggunakan index)
- [ ] Filter by active status (menggunakan index)
- [ ] Sort by newest/oldest (menggunakan index)
- [ ] Export members (semua field exportable)
- [ ] Delete member (cascade bekerja dengan benar)
- [ ] Update member (trigger updated_at bekerja)

## 🎯 Benefits

1. ✅ **Support Import Tanpa Email** - Member bisa di-import hanya dengan biodata
2. ✅ **Query Performance** - Indexes dioptimasi untuk query pattern halaman member
3. ✅ **Data Integrity** - Check constraint memastikan minimal ada identifier
4. ✅ **Flexibility** - Foreign keys bisa NULL tanpa kehilangan data
5. ✅ **Maintainability** - Schema lebih jelas dan terdokumentasi

