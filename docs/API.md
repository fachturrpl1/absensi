# API Documentation

## Overview

API menggunakan **Next.js Route Handlers** di `/src/app/api/`. Semua response format JSON.

**Base URL:** `/api`

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication

Semua endpoint (kecuali auth) memerlukan **Supabase session cookie**. Middleware handle auth check secara otomatis.

---

## Members API

### GET `/api/members`
List semua members dalam organisasi.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "user_id": "uuid",
      "employee_id": "EMP001",
      "department_id": "uuid",
      "position_id": "uuid",
      "user": {
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "departments": { "name": "Engineering" },
      "positions": { "title": "Software Engineer" }
    }
  ]
}
```

**Cache:** 3 menit

---

### POST `/api/members/create`
Buat member baru.

**Body:**
```json
{
  "user_id": "uuid",
  "employee_id": "EMP001",
  "department_id": "uuid",
  "position_id": "uuid",
  "hire_date": "2024-01-01"
}
```

---

### POST `/api/members/update`
Update data member.

**Body:**
```json
{
  "id": "uuid",
  "department_id": "uuid",
  "position_id": "uuid",
  "employment_status": "active"
}
```

---

### POST `/api/members/invite`
Undang member via email.

**Body:**
```json
{
  "email": "newuser@example.com",
  "department_id": "uuid",
  "position_id": "uuid"
}
```

---

## Attendance API

### GET `/api/attendance/group`
Attendance summary per department.

**Query Params:**
- `date` (optional): YYYY-MM-DD
- `department_id` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "department_id": "uuid",
      "department_name": "Engineering",
      "total_members": 10,
      "present": 8,
      "late": 1,
      "absent": 1
    }
  ]
}
```

---

### POST `/api/attendance/init`
Buat/update attendance record.

**Body:**
```json
{
  "organization_member_id": "uuid",
  "attendance_date": "2025-01-23",
  "actual_check_in": "2025-01-23T08:00:00Z",
  "actual_check_out": "2025-01-23T17:00:00Z",
  "status": "present"
}
```

---

## Dashboard API

### GET `/api/dashboard/stats`
Dashboard statistics overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_members": 50,
    "present_today": 45,
    "absent_today": 3,
    "late_today": 2,
    "attendance_rate": 90.0
  }
}
```

**Cache:** 3 menit

---

### GET `/api/dashboard/monthly`
Monthly attendance summary.

**Query Params:**
- `month` (optional): 1-12
- `year` (optional): YYYY

**Response:**
```json
{
  "success": true,
  "data": {
    "month": "January",
    "year": 2025,
    "total_working_days": 22,
    "average_attendance_rate": 95.5,
    "by_status": {
      "present": 1050,
      "late": 30,
      "absent": 20
    }
  }
}
```

**Cache:** 5 menit

---

### GET `/api/dashboard/monthly-late`
Statistik keterlambatan bulanan.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "member_id": "uuid",
      "display_name": "John Doe",
      "late_count": 5,
      "total_late_minutes": 150
    }
  ]
}
```

---

### GET `/api/dashboard/member-distribution`
Distribusi member per department.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "department": "Engineering",
      "members": 20,
      "percentage": 40.0
    }
  ]
}
```

---

## Groups (Departments) API

### GET `/api/groups`
List semua groups/departments.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "code": "ENG",
      "name": "Engineering",
      "is_active": true
    }
  ]
}
```

**Cache:** 5 menit

---

### POST `/api/groups`
Buat group baru.

**Body:**
```json
{
  "code": "MKT",
  "name": "Marketing",
  "description": "Marketing department"
}
```

---

### PUT `/api/groups`
Update group.

**Body:**
```json
{
  "id": "uuid",
  "name": "Marketing & Sales"
}
```

---

### DELETE `/api/groups`
Hapus group (soft delete).

**Body:**
```json
{
  "id": "uuid"
}
```

---

## Positions API

### GET `/api/positions`
List semua positions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "SE",
      "title": "Software Engineer",
      "level": "mid"
    }
  ]
}
```

---

### POST `/api/positions`
Buat position baru.

**Body:**
```json
{
  "code": "SM",
  "title": "Scrum Master",
  "level": "senior"
}
```

---

## Work Schedules API

### GET `/api/work-schedules`
List semua work schedules.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "STD5D",
      "name": "Standard 5 Days",
      "schedule_type": "fixed",
      "work_schedule_details": [
        {
          "day_of_week": 1,
          "start_time": "08:00:00",
          "end_time": "17:00:00"
        }
      ]
    }
  ]
}
```

---

### POST `/api/work-schedules`
Buat work schedule baru.

**Body:**
```json
{
  "code": "SHIFT_A",
  "name": "Shift A",
  "schedule_type": "fixed",
  "details": [
    {
      "day_of_week": 1,
      "start_time": "07:00:00",
      "end_time": "15:00:00"
    }
  ]
}
```

---

## Member Schedules API

### GET `/api/member-schedules`
List schedule assignments.

**Query Params:**
- `member_id` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_member_id": "uuid",
      "work_schedule_id": "uuid",
      "effective_date": "2025-01-01",
      "work_schedule": {
        "name": "Standard 5 Days"
      }
    }
  ]
}
```

---

### POST `/api/member-schedules`
Assign schedule ke member.

**Body:**
```json
{
  "organization_member_id": "uuid",
  "work_schedule_id": "uuid",
  "effective_date": "2025-02-01"
}
```

---

## Cache Strategy

**Cache Headers Pattern:**
```typescript
headers: {
  'Cache-Control': 'public, max-age=180, stale-while-revalidate=60'
}
```

**Durasi:**
- Dashboard stats: 3 menit
- Members list: 3 menit
- Monthly data: 5 menit
- Groups/Positions: 5 menit

---

## Error Handling

### Pattern
```typescript
try {
  const data = await fetchData()
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('API Error:', error)
  return NextResponse.json(
    { success: false, message: 'Failed' },
    { status: 500 }
  )
}
```

---

## Authentication Pattern

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json(
    { success: false, message: 'Unauthorized' },
    { status: 401 }
  )
}
```

---

## Organization Scoping

```typescript
// Get organization_id dari user
const { data: member } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .single()

// Query scoped ke organization
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('organization_id', member.organization_id)
```

---

**Last Updated:** 2025-10-23
