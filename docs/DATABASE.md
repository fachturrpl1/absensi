# Database Schema

## Overview

Database menggunakan **PostgreSQL** via **Supabase**. Dirancang untuk multi-tenancy dengan Row Level Security (RLS).

---

## Tabel Utama

### 1. organizations
Menyimpan data organisasi/perusahaan.

**Kolom Penting:**
- `id` (UUID, PK)
- `name` (VARCHAR) - Nama organisasi
- `code` (VARCHAR, UNIQUE) - Kode unik
- `timezone` (VARCHAR) - Default: Asia/Jakarta
- `time_format` ('12h'|'24h') - Format waktu
- `logo_url` (VARCHAR) - URL logo dari Supabase Storage
- `is_active` (BOOLEAN)

**Relasi:**
- Has many: organization_members, departments, positions, work_schedules

---

### 2. user_profiles (users)
Data profil user (extended dari auth.users).

**Kolom Penting:**
- `id` (UUID, PK, FK ke auth.users)
- `email` (VARCHAR, UNIQUE)
- `first_name`, `last_name`, `display_name`
- `employee_code` (VARCHAR, UNIQUE)
- `phone`, `mobile`
- `profile_photo_url` (VARCHAR)
- `emergency_contact` (JSONB) - {name, relationship, phone, email}
- `is_active` (BOOLEAN)

**Relasi:**
- Has many: organization_members

---

### 3. organization_members
Junction table user ↔ organization, menyimpan data employment.

**Kolom Penting:**
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `user_id` (UUID, FK)
- `employee_id` (VARCHAR) - ID karyawan internal
- `department_id` (UUID, FK) - Departemen
- `position_id` (UUID, FK) - Jabatan
- `direct_manager_id` (UUID, FK) - Atasan
- `hire_date` (DATE)
- `employment_status` (VARCHAR) - active, on_leave, terminated
- `is_active` (BOOLEAN)

**Relasi:**
- Belongs to: organizations, user_profiles, departments, positions
- Has many: attendance_records, member_schedules, rfid_cards

**Index Penting:**
```sql
CREATE UNIQUE INDEX idx_org_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

---

### 4. departments (Groups)
Data departemen/divisi.

**Kolom Penting:**
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `parent_department_id` (UUID, FK) - Support hierarchy
- `code` (VARCHAR)
- `name` (VARCHAR)
- `head_member_id` (UUID, FK) - Kepala departemen

---

### 5. positions
Data posisi/jabatan.

**Kolom Penting:**
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `code` (VARCHAR)
- `title` (VARCHAR) - Nama jabatan
- `level` (VARCHAR) - entry, mid, senior, lead, manager

---

### 6. work_schedules
Template jadwal kerja.

**Kolom Penting:**
- `id` (UUID, PK)
- `organization_id` (UUID, FK)
- `name` (VARCHAR) - Contoh: "5 Hari Kerja", "Shift A"
- `schedule_type` (VARCHAR) - fixed, rotating, flexible
- `is_default` (BOOLEAN)

**Relasi:**
- Has many: work_schedule_details, member_schedules

---

### 7. work_schedule_details
Detail jadwal per hari dalam seminggu.

**Kolom Penting:**
- `id` (UUID, PK)
- `work_schedule_id` (INTEGER, FK)
- `day_of_week` (INTEGER) - 0=Minggu, 1=Senin, ..., 6=Sabtu
- `is_working_day` (BOOLEAN)
- `start_time`, `end_time` (TIME)
- `break_start`, `break_end` (TIME)
- `flexible_hours` (BOOLEAN)

**Index:**
```sql
CREATE UNIQUE INDEX idx_schedule_details ON work_schedule_details(work_schedule_id, day_of_week);
```

---

### 8. member_schedules
Assignment jadwal ke member tertentu.

**Kolom Penting:**
- `id` (UUID, PK)
- `organization_member_id` (UUID, FK)
- `work_schedule_id` (UUID, FK)
- `effective_date` (DATE) - Tanggal mulai berlaku

**Business Rule:**
- Member bisa punya multiple schedules dengan effective_date berbeda
- Active schedule: effective_date terdekat <= hari ini

---

### 9. attendance_records
Data kehadiran harian.

**Kolom Penting:**
- `id` (UUID, PK)
- `organization_member_id` (UUID, FK)
- `attendance_date` (DATE)
- `scheduled_start`, `scheduled_end` (TIMESTAMP)
- `actual_check_in`, `actual_check_out` (TIMESTAMP)
- `status` (ENUM) - present, absent, late, excused
- `work_duration_minutes` (INTEGER)
- `late_minutes` (INTEGER)
- `checkin_method` (VARCHAR) - manual, rfid, mobile
- `notes` (TEXT)

**Index Penting:**
```sql
CREATE UNIQUE INDEX idx_attendance_member_date ON attendance_records(organization_member_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
```

**Business Rule:**
- Satu member = satu attendance per hari
- `late_minutes` = MAX(0, actual_check_in - scheduled_start)

---

### 10. rfid_cards
Data kartu RFID/NFC.

**Kolom Penting:**
- `id` (UUID, PK)
- `organization_member_id` (UUID, FK)
- `card_number` (VARCHAR, UNIQUE)
- `card_type` (VARCHAR) - rfid, nfc, barcode
- `is_active` (BOOLEAN)

---

### 11. system_roles
Role untuk RBAC.

**Kolom Penting:**
- `id` (UUID, PK)
- `code` (VARCHAR, UNIQUE) - admin, manager, employee
- `name` (VARCHAR)

**Default Roles:**
- `super_admin` - Full access
- `org_admin` - Admin organisasi
- `manager` - Manager departemen
- `employee` - Karyawan biasa

---

### 12. permissions
Izin akses granular.

**Format:** `module.action`

**Contoh:**
- `attendance.view` - Lihat attendance
- `attendance.create` - Buat attendance
- `members.manage` - Kelola members
- `reports.view` - Lihat reports

---

### 13. role_permissions
Junction table roles ↔ permissions.

**Kolom:**
- `id` (UUID, PK)
- `role_id` (INTEGER, FK)
- `permission_id` (UUID, FK)

---

### 14. user_roles
Junction table users ↔ roles (many-to-many).

**Primary Key:** Composite (user_id, role_id)

---

## ERD Relationship

```
organizations
  ├── departments
  ├── positions
  ├── work_schedules
  │     └── work_schedule_details
  └── organization_members
        ├── user_profiles
        ├── attendance_records
        ├── member_schedules
        └── rfid_cards

user_profiles
  └── user_roles
        └── system_roles
              └── role_permissions
                    └── permissions
```

---

## Row Level Security (RLS)

### Policy Pattern
```sql
-- User hanya bisa lihat data dari organisasinya
CREATE POLICY "view_own_org" ON table_name FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

**Apply ke semua tabel yang punya `organization_id`.**

---

## Query Patterns

### 1. Get User's Organization
```sql
SELECT o.* 
FROM organizations o
JOIN organization_members om ON om.organization_id = o.id
WHERE om.user_id = 'user-uuid' AND om.is_active = true;
```

### 2. Get Members dengan Join
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
WHERE om.organization_id = 'org-uuid' AND om.is_active = true;
```

### 3. Monthly Attendance Summary
```sql
SELECT 
  om.id,
  u.display_name,
  COUNT(*) FILTER (WHERE ar.status = 'present') as present_count,
  COUNT(*) FILTER (WHERE ar.status = 'late') as late_count,
  COUNT(*) FILTER (WHERE ar.status = 'absent') as absent_count
FROM organization_members om
JOIN user_profiles u ON u.id = om.user_id
LEFT JOIN attendance_records ar ON ar.organization_member_id = om.id
  AND ar.attendance_date >= '2025-01-01'
  AND ar.attendance_date < '2025-02-01'
WHERE om.organization_id = 'org-uuid'
GROUP BY om.id, u.display_name;
```

### 4. Get Active Schedule
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

## Performance Tips

### Index Strategy
- Index pada FK columns
- Index pada sering di-filter columns (organization_id, user_id, date)
- Unique index pada composite keys
- Index pada status/enum columns yang sering di-filter

### Query Optimization
- Gunakan `EXPLAIN ANALYZE` untuk cek query plan
- Hindari N+1 queries - pakai JOIN
- Gunakan prepared statements (Supabase client handle ini)
- Limit result dengan pagination

---

## Troubleshooting

### Check Table Sizes
```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

### Check Slow Queries
```sql
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

**Last Updated:** 2025-10-23
