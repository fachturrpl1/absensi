# 📊 Database Schema Documentation

## Overview

Aplikasi Presensi menggunakan **PostgreSQL** melalui **Supabase** sebagai Backend-as-a-Service. Database dirancang untuk mendukung multi-organization dengan sistem role-based access control (RBAC), attendance tracking, dan schedule management.

## 🗂️ Database Tables

### 1. **organizations**
Menyimpan informasi organisasi/perusahaan.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `code` | VARCHAR | Kode unik organisasi | UNIQUE |
| `name` | VARCHAR | Nama organisasi | NOT NULL |
| `legal_name` | VARCHAR | Nama legal/resmi | |
| `tax_id` | VARCHAR | NPWP/Tax ID | |
| `industry` | VARCHAR | Jenis industri | |
| `size_category` | VARCHAR | Kategori ukuran (small, medium, large) | |
| `timezone` | VARCHAR | Timezone (default: Asia/Jakarta) | NOT NULL |
| `currency_code` | VARCHAR(3) | Kode mata uang (IDR, USD) | |
| `country_code` | VARCHAR(2) | Kode negara (ID, US) | |
| `address` | TEXT | Alamat lengkap | |
| `city` | VARCHAR | Kota | |
| `state_province` | VARCHAR | Provinsi | |
| `postal_code` | VARCHAR | Kode pos | |
| `phone` | VARCHAR | Nomor telepon | |
| `email` | VARCHAR | Email organisasi | |
| `website` | VARCHAR | Website URL | |
| `logo_url` | VARCHAR | URL logo (Supabase Storage) | |
| `is_active` | BOOLEAN | Status aktif | NOT NULL, DEFAULT true |
| `subscription_tier` | VARCHAR | Tier langganan (free, pro, enterprise) | |
| `time_format` | VARCHAR | Format waktu (12h, 24h) | DEFAULT '24h' |
| `subscription_expires_at` | TIMESTAMP | Tanggal kedaluwarsa subscription | |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Has many `organization_members`
- Has many `departments` (groups)
- Has many `positions`
- Has many `work_schedules`

---

### 2. **user_profiles** / **users**
Menyimpan data profil pengguna (extended dari Supabase Auth).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key (sama dengan auth.users.id) | NOT NULL, PK, FK |
| `employee_code` | VARCHAR | Kode karyawan unik | UNIQUE |
| `email` | VARCHAR | Email pengguna | NOT NULL, UNIQUE |
| `first_name` | VARCHAR | Nama depan | |
| `middle_name` | VARCHAR | Nama tengah | |
| `last_name` | VARCHAR | Nama belakang | |
| `display_name` | VARCHAR | Nama tampilan | |
| `phone` | VARCHAR | Nomor telepon rumah | |
| `mobile` | VARCHAR | Nomor HP | |
| `date_of_birth` | DATE | Tanggal lahir | |
| `gender` | ENUM | Jenis kelamin (male, female, other, prefer_not_to_say) | |
| `nationality` | VARCHAR | Kewarganegaraan | |
| `national_id` | VARCHAR | NIK/KTP | |
| `profile_photo_url` | VARCHAR | URL foto profil | |
| `emergency_contact` | JSONB | Kontak darurat {name, relationship, phone, email} | |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `role_id` | UUID | System role ID | FK to system_roles |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |
| `deleted_at` | TIMESTAMP | Soft delete timestamp | |

**Relationships:**
- Belongs to `system_roles` (via role_id)
- Has many `organization_members`
- Has many `user_roles`

---

### 3. **organization_members**
Junction table menghubungkan user dengan organization, menyimpan data employment.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `organization_id` | UUID | ID organisasi | NOT NULL, FK to organizations |
| `user_id` | UUID | ID user | NOT NULL, FK to user_profiles |
| `employee_id` | VARCHAR | ID karyawan internal | |
| `department_id` | UUID | ID departemen/grup | FK to departments |
| `position_id` | UUID | ID posisi/jabatan | FK to positions |
| `direct_manager_id` | UUID | ID atasan langsung | FK to organization_members |
| `hire_date` | DATE | Tanggal mulai kerja | NOT NULL |
| `probation_end_date` | DATE | Tanggal selesai probation | |
| `contract_type` | VARCHAR | Tipe kontrak (permanent, contract, internship) | |
| `employment_status` | VARCHAR | Status (active, on_leave, terminated) | |
| `termination_date` | DATE | Tanggal resign/PHK | |
| `work_location` | VARCHAR | Lokasi kerja | |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Belongs to `organizations`
- Belongs to `user_profiles` (via user_id)
- Belongs to `departments` (via department_id)
- Belongs to `positions` (via position_id)
- Self-referencing: Belongs to `organization_members` (manager)
- Has many `attendance_records`
- Has many `member_schedules`
- Has many `rfid_cards`

**Indexes:**
- `organization_id, user_id` (unique composite)
- `user_id`
- `department_id`
- `position_id`

---

### 4. **departments** (Groups)
Menyimpan data departemen/divisi/grup dalam organisasi.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `organization_id` | UUID | ID organisasi | NOT NULL, FK to organizations |
| `parent_department_id` | UUID | ID departemen parent (hierarchical) | FK to departments |
| `code` | VARCHAR | Kode departemen | UNIQUE per organization |
| `name` | VARCHAR | Nama departemen | NOT NULL |
| `description` | TEXT | Deskripsi | |
| `head_member_id` | UUID | ID kepala departemen | FK to organization_members |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Belongs to `organizations`
- Self-referencing: Belongs to `departments` (parent)
- Has many `organization_members`
- Has many `departments` (children)

---

### 5. **positions**
Menyimpan data posisi/jabatan dalam organisasi.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `organization_id` | UUID | ID organisasi | NOT NULL, FK to organizations |
| `code` | VARCHAR | Kode posisi | UNIQUE per organization |
| `title` | VARCHAR | Nama posisi/jabatan | NOT NULL |
| `description` | TEXT | Deskripsi job description | |
| `level` | VARCHAR | Level jabatan (entry, mid, senior, lead, manager) | |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Belongs to `organizations`
- Has many `organization_members`

---

### 6. **work_schedules**
Menyimpan template jadwal kerja (shift patterns).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `organization_id` | UUID | ID organisasi | NOT NULL, FK to organizations |
| `code` | VARCHAR | Kode jadwal | UNIQUE |
| `name` | VARCHAR | Nama jadwal (e.g., "5 Days Week", "Shift A") | NOT NULL |
| `description` | TEXT | Deskripsi jadwal | |
| `schedule_type` | VARCHAR | Tipe jadwal (fixed, rotating, flexible) | NOT NULL |
| `is_default` | BOOLEAN | Jadwal default untuk organization | DEFAULT false |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Belongs to `organizations`
- Has many `work_schedule_details`
- Has many `member_schedules`

---

### 7. **work_schedule_details**
Detail jadwal per hari dalam seminggu.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `work_schedule_id` | INTEGER | ID work schedule | NOT NULL, FK to work_schedules |
| `day_of_week` | INTEGER | Hari (0=Sunday, 1=Monday, ..., 6=Saturday) | NOT NULL, 0-6 |
| `is_working_day` | BOOLEAN | Apakah hari kerja | DEFAULT true |
| `start_time` | TIME | Jam mulai kerja (HH:MM:SS) | |
| `end_time` | TIME | Jam selesai kerja (HH:MM:SS) | |
| `break_start` | TIME | Jam mulai istirahat | |
| `break_end` | TIME | Jam selesai istirahat | |
| `break_duration_minutes` | INTEGER | Durasi istirahat (menit) | |
| `flexible_hours` | BOOLEAN | Jam kerja fleksibel | DEFAULT false |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Belongs to `work_schedules`

**Indexes:**
- `work_schedule_id, day_of_week` (unique composite)

---

### 8. **member_schedules**
Menetapkan jadwal kerja ke member tertentu dengan periode efektif.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `organization_member_id` | UUID | ID member | NOT NULL, FK to organization_members |
| `work_schedule_id` | UUID | ID work schedule | NOT NULL, FK to work_schedules |
| `shift_id` | UUID | ID shift (jika rotating shift) | |
| `effective_date` | DATE | Tanggal mulai berlaku | NOT NULL |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Belongs to `organization_members`
- Belongs to `work_schedules`

**Business Rules:**
- Satu member bisa punya multiple schedules dengan effective_date berbeda
- Active schedule dipilih berdasarkan effective_date terdekat <= hari ini

---

### 9. **attendance_records**
Menyimpan data kehadiran/absensi harian.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `organization_member_id` | UUID | ID member | NOT NULL, FK to organization_members |
| `attendance_date` | DATE | Tanggal absensi | NOT NULL |
| `schedule_shift_id` | UUID | ID shift yang dijadwalkan | FK to work_schedule_details |
| `scheduled_start` | TIMESTAMP | Jam masuk terjadwal | |
| `scheduled_end` | TIMESTAMP | Jam pulang terjadwal | |
| `actual_check_in` | TIMESTAMP | Waktu check-in aktual | |
| `actual_check_out` | TIMESTAMP | Waktu check-out aktual | |
| `checkin_device` | VARCHAR | Device check-in (web, mobile, rfid) | |
| `checkout_device` | VARCHAR | Device check-out | |
| `checkin_method` | VARCHAR | Metode check-in (manual, auto, rfid) | |
| `checkout_method` | VARCHAR | Metode check-out | |
| `checkin_location` | VARCHAR | Lokasi check-in (koordinat/address) | |
| `checkout_location` | VARCHAR | Lokasi check-out | |
| `check_in_photo_url` | VARCHAR | URL foto check-in | |
| `check_out_photo_url` | VARCHAR | URL foto check-out | |
| `work_duration_minutes` | INTEGER | Durasi kerja (menit) | |
| `break_duration_minutes` | INTEGER | Durasi istirahat (menit) | |
| `overtime_minutes` | INTEGER | Durasi lembur (menit) | |
| `late_minutes` | INTEGER | Durasi terlambat (menit) | |
| `early_leave_minutes` | INTEGER | Durasi pulang awal (menit) | |
| `status` | ENUM | Status (present, absent, late, excused) | NOT NULL |
| `validated_status` | ENUM | Status validasi (approved, rejected, pending) | |
| `validated_by` | UUID | User yang validasi | FK to user_profiles |
| `validated_at` | TIMESTAMP | Waktu validasi | |
| `validated_note` | TEXT | Catatan validasi | |
| `application_id` | UUID | ID aplikasi cuti/izin terkait | |
| `raw_data` | JSONB | Data mentah dari device | |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `notes` | TEXT | Catatan tambahan | |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Belongs to `organization_members`
- Belongs to `work_schedule_details` (via schedule_shift_id)
- Belongs to `user_profiles` (validator via validated_by)

**Indexes:**
- `organization_member_id, attendance_date` (unique composite)
- `attendance_date`
- `status`
- `created_at`

**Business Rules:**
- Satu member hanya boleh punya satu attendance per hari
- Status dihitung otomatis berdasarkan jadwal dan actual time
- late_minutes = MAX(0, actual_check_in - scheduled_start)

---

### 10. **rfid_cards**
Menyimpan data kartu RFID untuk attendance.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `organization_member_id` | UUID | ID member | NOT NULL, FK to organization_members |
| `card_number` | VARCHAR | Nomor kartu RFID | NOT NULL, UNIQUE |
| `card_type` | VARCHAR | Tipe kartu (rfid, nfc, barcode) | |
| `issue_date` | DATE | Tanggal penerbitan | |
| `expiry_date` | DATE | Tanggal kadaluwarsa | |
| `is_active` | BOOLEAN | Status aktif | DEFAULT true |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Relationships:**
- Belongs to `organization_members`

---

### 11. **system_roles**
Menyimpan role sistem untuk RBAC.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `code` | VARCHAR | Kode role (admin, manager, employee) | NOT NULL, UNIQUE |
| `name` | VARCHAR | Nama role | NOT NULL |
| `description` | TEXT | Deskripsi role | |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Tanggal diupdate | |

**Default Roles:**
- `super_admin` - Full system access
- `org_admin` - Organization administrator
- `manager` - Department/team manager
- `employee` - Regular employee
- `viewer` - Read-only access

**Relationships:**
- Has many `user_roles`
- Has many `role_permissions`

---

### 12. **permissions**
Menyimpan izin akses granular.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `code` | VARCHAR | Kode permission | NOT NULL, UNIQUE |
| `module` | VARCHAR | Modul (attendance, members, schedule, etc) | NOT NULL |
| `name` | VARCHAR | Nama permission | NOT NULL |
| `description` | TEXT | Deskripsi | |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |

**Sample Permissions:**
- `attendance.view` - Lihat attendance
- `attendance.create` - Buat attendance
- `attendance.update` - Update attendance
- `attendance.delete` - Hapus attendance
- `members.view` - Lihat members
- `members.manage` - Kelola members
- `schedule.view` - Lihat schedule
- `schedule.manage` - Kelola schedule
- `reports.view` - Lihat reports
- `settings.manage` - Kelola settings

**Relationships:**
- Has many `role_permissions`

---

### 13. **role_permissions**
Junction table menghubungkan roles dengan permissions.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `role_id` | INTEGER | ID role | NOT NULL, FK to system_roles |
| `permission_id` | UUID | ID permission | NOT NULL, FK to permissions |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |

**Relationships:**
- Belongs to `system_roles`
- Belongs to `permissions`

**Indexes:**
- `role_id, permission_id` (unique composite)

---

### 14. **user_roles**
Junction table menghubungkan user dengan roles (many-to-many).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `user_id` | UUID | ID user | NOT NULL, FK to user_profiles |
| `role_id` | UUID | ID role | NOT NULL, FK to system_roles |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |

**Primary Key:** Composite (`user_id`, `role_id`)

**Relationships:**
- Belongs to `user_profiles`
- Belongs to `system_roles`

---

### 15. **member_invitations**
Menyimpan undangan member ke organisasi (untuk onboarding flow).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, PK |
| `organization_id` | UUID | ID organisasi | NOT NULL, FK to organizations |
| `email` | VARCHAR | Email yang diundang | NOT NULL |
| `invited_by` | UUID | User yang mengundang | FK to user_profiles |
| `token` | VARCHAR | Invitation token | NOT NULL, UNIQUE |
| `status` | ENUM | Status (pending, accepted, expired, cancelled) | DEFAULT 'pending' |
| `expires_at` | TIMESTAMP | Waktu kedaluwarsa | NOT NULL |
| `accepted_at` | TIMESTAMP | Waktu diterima | |
| `created_at` | TIMESTAMP | Tanggal dibuat | DEFAULT NOW() |

**Relationships:**
- Belongs to `organizations`
- Belongs to `user_profiles` (inviter)

---

## 🔗 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌────────────────┐                 ┌───────────────┐
│  departments   │◄───────────┐    │   positions   │
└────────┬───────┘            │    └───────┬───────┘
         │                    │            │
         │                    │            │
         │    ┌───────────────┴────────────┴──────────┐
         │    │                                        │
         │    ▼                                        ▼
         │ ┌────────────────────────────────────────────────┐
         └─┤           organization_members                 │
           └──────────┬─────────────┬──────────────────────┘
                      │             │
          ┌───────────┴──┐      ┌───┴──────────────┐
          │              │      │                  │
          ▼              ▼      ▼                  ▼
    ┌────────────┐  ┌─────────────────┐    ┌──────────────┐
    │ rfid_cards │  │ member_schedules│    │  attendance  │
    └────────────┘  └────────┬────────┘    │   _records   │
                             │              └──────────────┘
                             ▼
                    ┌──────────────────┐
                    │ work_schedules   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │work_schedule_details │
                    └──────────────────────┘

┌──────────────┐
│   users      │
│(auth.users + │
│user_profiles)│
└──────┬───────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌────────────┐  ┌─────────────┐  ┌──────────────┐
│user_roles  │  │system_roles │  │ permissions  │
└─────┬──────┘  └──────┬──────┘  └──────┬───────┘
      │                │                 │
      └────────────────┼─────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ role_permissions │
              └──────────────────┘
```

---

## 🎯 Key Features & Design Patterns

### 1. **Multi-Tenancy**
- Semua data di-scope per `organization_id`
- Row Level Security (RLS) di Supabase memastikan data isolation
- User bisa belong to multiple organizations via `organization_members`

### 2. **Soft Delete**
- Gunakan `is_active` flag dan `deleted_at` timestamp
- Data tidak benar-benar dihapus untuk audit trail
- Filtering di query: `WHERE is_active = true AND deleted_at IS NULL`

### 3. **Audit Trail**
- Semua tabel punya `created_at` dan `updated_at`
- Attendance punya `validated_by`, `validated_at` untuk approval
- `raw_data` JSONB column untuk store original device data

### 4. **Hierarchical Data**
- Departments support parent-child relationship via `parent_department_id`
- Organization members punya `direct_manager_id` untuk org chart

### 5. **Flexible Scheduling**
- Work schedules separated from actual attendance
- Support fixed, rotating, dan flexible schedules
- Member schedules dengan effective_date untuk schedule changes

### 6. **RBAC (Role-Based Access Control)**
- Granular permissions per module and action
- Roles bisa punya multiple permissions
- Users bisa punya multiple roles

---

## 🔐 Row Level Security (RLS) Policies

Semua tabel harus implement RLS policies di Supabase:

### Organizations
```sql
-- Users can only view organizations they are members of
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

### Organization Members
```sql
-- Users can only view members in their organization
CREATE POLICY "Users can view organization members"
ON organization_members FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

### Attendance Records
```sql
-- Users can only view attendance in their organization
CREATE POLICY "Users can view attendance records"
ON attendance_records FOR SELECT
USING (
  organization_member_id IN (
    SELECT id 
    FROM organization_members 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can only insert their own attendance
CREATE POLICY "Users can create own attendance"
ON attendance_records FOR INSERT
WITH CHECK (
  organization_member_id IN (
    SELECT id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

---

## 📈 Indexes untuk Performance

### High-Priority Indexes
```sql
-- organization_members lookups
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE UNIQUE INDEX idx_org_members_org_user ON organization_members(organization_id, user_id);

-- attendance queries (most frequent)
CREATE INDEX idx_attendance_member_id ON attendance_records(organization_member_id);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_member_date ON attendance_records(organization_member_id, attendance_date);

-- schedule lookups
CREATE INDEX idx_member_schedules_member ON member_schedules(organization_member_id);
CREATE INDEX idx_member_schedules_effective ON member_schedules(effective_date);

-- department and position lookups
CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_positions_org ON positions(organization_id);

-- RFID card lookups
CREATE UNIQUE INDEX idx_rfid_card_number ON rfid_cards(card_number);
CREATE INDEX idx_rfid_member ON rfid_cards(organization_member_id);
```

---

## 🔄 Common Query Patterns

### 1. Get User's Organization
```sql
SELECT om.organization_id, o.*
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = 'user-uuid'
AND om.is_active = true
AND o.is_active = true;
```

### 2. Get Organization Members with Details
```sql
SELECT 
  om.*,
  u.email, u.first_name, u.last_name,
  d.name as department_name,
  p.title as position_title
FROM organization_members om
JOIN user_profiles u ON u.id = om.user_id
LEFT JOIN departments d ON d.id = om.department_id
LEFT JOIN positions p ON p.id = om.position_id
WHERE om.organization_id = 'org-uuid'
AND om.is_active = true
ORDER BY u.first_name, u.last_name;
```

### 3. Get Monthly Attendance Summary
```sql
SELECT 
  om.id as member_id,
  u.display_name,
  COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
  COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count
FROM organization_members om
JOIN user_profiles u ON u.id = om.user_id
LEFT JOIN attendance_records ar ON ar.organization_member_id = om.id
  AND ar.attendance_date >= '2025-01-01'
  AND ar.attendance_date < '2025-02-01'
WHERE om.organization_id = 'org-uuid'
GROUP BY om.id, u.display_name
ORDER BY u.display_name;
```

### 4. Get Active Schedule for Member
```sql
SELECT ws.*
FROM member_schedules ms
JOIN work_schedules ws ON ws.id = ms.work_schedule_id
WHERE ms.organization_member_id = 'member-uuid'
AND ms.effective_date <= CURRENT_DATE
AND ms.is_active = true
ORDER BY ms.effective_date DESC
LIMIT 1;
```

---

## 🚀 Database Migrations

Untuk membuat migration baru di Supabase:

```bash
# Create new migration file
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database (DEV ONLY!)
supabase db reset
```

### Migration Naming Convention
- `YYYYMMDDHHMMSS_descriptive_name.sql`
- Example: `20250123120000_add_rfid_cards_table.sql`

---

## 📝 Notes & Best Practices

### 1. **UUID vs Auto-increment ID**
- Gunakan UUID untuk security (tidak predictable)
- Better untuk distributed systems
- Supabase default: `uuid_generate_v4()`

### 2. **Timestamp Handling**
- Simpan sebagai `TIMESTAMPTZ` (with timezone)
- Server always use UTC internally
- Convert to organization timezone saat display

### 3. **JSONB Columns**
- Gunakan untuk flexible/dynamic data
- `emergency_contact`, `raw_data`, dll
- Indexable dengan GIN indexes

### 4. **Enum vs VARCHAR**
- Gunakan ENUM untuk fixed values yang jarang berubah
- Gunakan VARCHAR untuk values yang mungkin bertambah

### 5. **Foreign Key Constraints**
- ALWAYS use ON DELETE CASCADE atau SET NULL
- Plan for referential integrity
- Consider impact on soft-deletes

---

## 🔍 Troubleshooting

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Missing Indexes
```sql
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY tablename, attname;
```

### Check Slow Queries
```sql
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

**Last Updated:** 2025-10-23  
**Version:** 1.0
