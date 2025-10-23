# 🌐 API Documentation

## Overview

API menggunakan **Next.js App Router** dengan route handlers di `/src/app/api/`. Semua endpoints mengembalikan JSON response dan implement caching headers untuk performance optimization.

## 📋 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔐 Authentication

Semua API endpoints (kecuali auth) memerlukan **Supabase authentication cookie**. Authentication di-handle oleh middleware pada level routing, tidak perlu manual check di setiap endpoint.

### Authentication Flow
1. User login via Supabase Auth
2. Session cookie stored by browser
3. Middleware validates session on each request
4. API routes can access user via `supabase.auth.getUser()`

---

## 📍 API Endpoints

### **Members API**

#### `GET /api/members`
Mendapatkan semua organization members untuk organization user yang sedang login.

**Authentication:** Required  
**Permission:** `members.view`

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
      "hire_date": "2024-01-01",
      "is_active": true,
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "display_name": "John Doe"
      },
      "departments": {
        "id": "uuid",
        "name": "Engineering",
        "code": "ENG"
      },
      "positions": {
        "id": "uuid",
        "title": "Software Engineer"
      }
    }
  ]
}
```

**Cache Headers:**
- `Cache-Control: public, max-age=180, stale-while-revalidate=60`
- Fresh untuk 3 menit, stale-while-revalidate 1 menit

---

#### `POST /api/members/create`
Membuat member baru (manual creation tanpa invitation).

**Authentication:** Required  
**Permission:** `members.manage`

**Request Body:**
```json
{
  "user_id": "uuid",
  "employee_id": "EMP001",
  "department_id": "uuid",
  "position_id": "uuid",
  "hire_date": "2024-01-01",
  "contract_type": "permanent",
  "employment_status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member created successfully",
  "data": { ... }
}
```

---

#### `POST /api/members/update`
Update data member.

**Authentication:** Required  
**Permission:** `members.manage`

**Request Body:**
```json
{
  "id": "uuid",
  "department_id": "uuid",
  "position_id": "uuid",
  "employment_status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member updated successfully",
  "data": { ... }
}
```

---

#### `POST /api/members/invite`
Mengundang member baru via email.

**Authentication:** Required  
**Permission:** `members.manage`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "department_id": "uuid",
  "position_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "invitation_id": "uuid",
    "token": "invite-token",
    "expires_at": "2025-01-30T00:00:00Z"
  }
}
```

---

#### `POST /api/members/accept-invite`
Accept invitation dan create account.

**Authentication:** Not Required (public endpoint)

**Request Body:**
```json
{
  "token": "invite-token",
  "email": "newuser@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user_id": "uuid",
    "organization_id": "uuid"
  }
}
```

---

#### `GET /api/members/init`
Initialize/seed dummy member data (Development only).

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Members initialized",
  "data": { ... }
}
```

---

#### `GET /api/members/capabilities`
Get member capabilities/permissions.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "can_manage_members": true,
    "can_approve_attendance": true,
    "can_view_reports": true
  }
}
```

---

### **Attendance API**

#### `GET /api/attendance/group`
Mendapatkan attendance records dikelompokkan per department.

**Authentication:** Required  
**Permission:** `attendance.view`

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD)
- `department_id` (optional): Filter by department

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
      "absent": 1,
      "attendance_percentage": 90.0
    }
  ]
}
```

---

#### `POST /api/attendance/init`
Create atau update attendance record.

**Authentication:** Required  
**Permission:** `attendance.create`

**Request Body:**
```json
{
  "organization_member_id": "uuid",
  "attendance_date": "2025-01-23",
  "actual_check_in": "2025-01-23T08:00:00Z",
  "actual_check_out": "2025-01-23T17:00:00Z",
  "status": "present",
  "checkin_method": "manual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "data": {
    "id": "uuid",
    "status": "present",
    "work_duration_minutes": 540
  }
}
```

---

### **Dashboard API**

#### `GET /api/dashboard/stats`
Mendapatkan dashboard statistics overview.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "total_members": 50,
    "present_today": 45,
    "absent_today": 3,
    "late_today": 2,
    "attendance_rate": 90.0,
    "active_rfid_cards": 48
  }
}
```

**Cache Headers:**
- `Cache-Control: public, max-age=180, stale-while-revalidate=60`
- Fresh untuk 3 menit

---

#### `GET /api/dashboard/active-members`
Mendapatkan daftar active members hari ini.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "member_id": "uuid",
      "display_name": "John Doe",
      "check_in_time": "08:00:00",
      "status": "present"
    }
  ]
}
```

---

#### `GET /api/dashboard/active-rfid`
Mendapatkan statistik active RFID cards.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cards": 50,
    "active_cards": 48,
    "inactive_cards": 2,
    "expiring_soon": 3
  }
}
```

---

#### `GET /api/dashboard/monthly`
Mendapatkan monthly attendance summary.

**Authentication:** Required

**Query Parameters:**
- `month` (optional): Month (1-12, default: current month)
- `year` (optional): Year (YYYY, default: current year)

**Response:**
```json
{
  "success": true,
  "data": {
    "month": "January",
    "year": 2025,
    "total_working_days": 22,
    "total_attendance": 1100,
    "average_attendance_rate": 95.5,
    "by_status": {
      "present": 1050,
      "late": 30,
      "absent": 20
    }
  }
}
```

**Cache Headers:**
- `Cache-Control: public, max-age=300, stale-while-revalidate=60`
- Fresh untuk 5 menit (monthly data jarang berubah)

---

#### `GET /api/dashboard/monthly-late`
Mendapatkan statistik keterlambatan bulanan.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "member_id": "uuid",
      "display_name": "John Doe",
      "late_count": 5,
      "total_late_minutes": 150,
      "average_late_minutes": 30
    }
  ]
}
```

---

#### `GET /api/dashboard/member-distribution`
Mendapatkan distribusi member per department.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "department": "Engineering",
      "members": 20,
      "percentage": 40.0
    },
    {
      "department": "Marketing",
      "members": 15,
      "percentage": 30.0
    }
  ]
}
```

---

#### `GET /api/dashboard/total-attendance`
Mendapatkan total attendance records.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5000,
    "this_month": 1100,
    "this_week": 250,
    "today": 45
  }
}
```

---

### **Groups (Departments) API**

#### `GET /api/groups`
Mendapatkan semua groups/departments untuk organization.

**Authentication:** Required  
**Permission:** `groups.view`

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
      "description": "Engineering department",
      "is_active": true
    }
  ]
}
```

**Cache Headers:**
- `Cache-Control: public, max-age=300, stale-while-revalidate=60`

---

#### `POST /api/groups`
Create group baru.

**Authentication:** Required  
**Permission:** `groups.manage`

**Request Body:**
```json
{
  "code": "MKT",
  "name": "Marketing",
  "description": "Marketing department"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": { ... }
}
```

---

#### `PUT /api/groups`
Update group.

**Authentication:** Required  
**Permission:** `groups.manage`

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Marketing & Sales",
  "description": "Updated description"
}
```

---

#### `DELETE /api/groups`
Delete group (soft delete).

**Authentication:** Required  
**Permission:** `groups.manage`

**Request Body:**
```json
{
  "id": "uuid"
}
```

---

### **Positions API**

#### `GET /api/positions`
Mendapatkan semua positions untuk organization.

**Authentication:** Required  
**Permission:** `positions.view`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "code": "SE",
      "title": "Software Engineer",
      "level": "mid",
      "is_active": true
    }
  ]
}
```

---

#### `POST /api/positions`
Create position baru.

**Authentication:** Required  
**Permission:** `positions.manage`

**Request Body:**
```json
{
  "code": "SM",
  "title": "Scrum Master",
  "level": "senior",
  "description": "Agile Scrum Master"
}
```

---

### **Work Schedules API**

#### `GET /api/work-schedules`
Mendapatkan semua work schedules untuk organization.

**Authentication:** Required  
**Permission:** `schedules.view`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "code": "STD5D",
      "name": "Standard 5 Days",
      "schedule_type": "fixed",
      "is_default": true,
      "work_schedule_details": [
        {
          "id": "uuid",
          "day_of_week": 1,
          "is_working_day": true,
          "start_time": "08:00:00",
          "end_time": "17:00:00"
        }
      ]
    }
  ]
}
```

---

#### `POST /api/work-schedules`
Create work schedule baru.

**Authentication:** Required  
**Permission:** `schedules.manage`

**Request Body:**
```json
{
  "code": "SHIFT_A",
  "name": "Shift A (Morning)",
  "schedule_type": "fixed",
  "details": [
    {
      "day_of_week": 1,
      "is_working_day": true,
      "start_time": "07:00:00",
      "end_time": "15:00:00",
      "break_start": "12:00:00",
      "break_end": "13:00:00"
    }
  ]
}
```

---

### **Member Schedules API**

#### `GET /api/member-schedules`
Mendapatkan schedule assignments untuk members.

**Authentication:** Required  
**Permission:** `schedules.view`

**Query Parameters:**
- `member_id` (optional): Filter by member

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
      "is_active": true,
      "work_schedule": {
        "name": "Standard 5 Days"
      }
    }
  ]
}
```

---

#### `POST /api/member-schedules`
Assign schedule ke member.

**Authentication:** Required  
**Permission:** `schedules.manage`

**Request Body:**
```json
{
  "organization_member_id": "uuid",
  "work_schedule_id": "uuid",
  "effective_date": "2025-02-01"
}
```

---

#### `POST /api/member-schedules/init`
Initialize/seed member schedule data (Development only).

**Authentication:** Required

---

### **Schedules API (Legacy/Alternative)**

#### `POST /api/schedules/init`
Initialize schedule-related data.

**Authentication:** Required

---

### **Debug API** (Development Only)

#### `GET /api/debug/attendance-sample`
Get sample attendance data untuk testing.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-23",
      "present": 45,
      "absent": 5
    }
  ]
}
```

---

#### `GET /api/debug/attendance-sample-raw`
Get raw attendance data untuk debugging.

**Authentication:** Required

---

### **Error Logging API**

#### `POST /api/log-client-error`
Log client-side errors untuk monitoring.

**Authentication:** Not Required (public endpoint)

**Request Body:**
```json
{
  "error": "TypeError: Cannot read property 'name' of undefined",
  "stack": "Error: ...\n  at Component ...",
  "url": "/attendance",
  "userAgent": "Mozilla/5.0 ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Error logged"
}
```

---

## 🔧 API Utilities & Patterns

### Cache Strategy

**Short-lived data (3 minutes):**
- Dashboard stats
- Active members
- Attendance records

**Medium-lived data (5 minutes):**
- Organization members list
- Monthly statistics

**Long-lived data (10 minutes):**
- Groups/Departments list
- Positions list
- Work schedules

### Cache Headers Pattern
```typescript
return NextResponse.json(
  { success: true, data },
  {
    headers: {
      'Cache-Control': 'public, max-age=180, stale-while-revalidate=60'
    }
  }
)
```

---

### Error Handling Pattern

```typescript
export async function GET() {
  try {
    const data = await fetchData()
    return NextResponse.json(
      { success: true, data },
      { 
        status: 200,
        headers: { 'Cache-Control': '...' }
      }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-cache' }
      }
    )
  }
}
```

---

### Authentication Pattern

```typescript
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Proceed with authenticated request
  // ...
}
```

---

### Organization Scoping Pattern

```typescript
// Get user's organization
const { data: member } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .maybeSingle()

if (!member) {
  return NextResponse.json(
    { success: false, message: 'User not in organization' },
    { status: 403 }
  )
}

// Query scoped to organization
const { data } = await supabase
  .from('departments')
  .select('*')
  .eq('organization_id', member.organization_id)
```

---

## 🚀 Performance Optimization

### React Query Integration

Frontend menggunakan React Query untuk caching:

```typescript
// hooks/use-members.ts
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await fetch('/api/members')
      return res.json()
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
  })
}
```

### Cache Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query'

function MemberForm() {
  const queryClient = useQueryClient()
  
  async function onSubmit() {
    await createMember(data)
    
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['members'] })
  }
}
```

---

## 🔐 Rate Limiting

**Planned:** Implement rate limiting dengan Upstash Redis atau Vercel KV.

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

// Check rate limit per user
const { success } = await ratelimit.limit(user.id)
if (!success) {
  return new Response('Too Many Requests', { status: 429 })
}
```

---

## 📊 API Monitoring

### Logging Best Practices

```typescript
// Always log errors with context
console.error('API /members error:', {
  userId: user.id,
  organizationId: member?.organization_id,
  error: error instanceof Error ? error.message : 'Unknown',
  stack: error instanceof Error ? error.stack : undefined
})
```

### Health Check Endpoint (Planned)

```typescript
// GET /api/health
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  })
}
```

---

## 🧪 Testing

### API Testing dengan Vitest

```typescript
import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/members/route'

describe('GET /api/members', () => {
  it('should return members list', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })
  
  it('should require authentication', async () => {
    vi.mock('@/utils/supabase/server', () => ({
      createClient: () => ({
        auth: {
          getUser: () => ({ data: { user: null }, error: null })
        }
      })
    }))
    
    const response = await GET()
    expect(response.status).toBe(401)
  })
})
```

---

## 📝 API Versioning (Future)

Untuk backwards compatibility:

```
/api/v1/members  (current)
/api/v2/members  (new version with breaking changes)
```

---

## 🔗 External APIs

### Supabase APIs
- **Auth API:** `supabase.auth.*`
- **Database API:** `supabase.from(table).*`
- **Storage API:** `supabase.storage.from(bucket).*`
- **Realtime API:** `supabase.channel(name).*`

### Third-party Integration Points
- Email service (planned): SendGrid / Resend
- SMS service (planned): Twilio
- RFID reader API (planned)
- Mobile app API (planned)

---

**Last Updated:** 2025-10-23  
**Version:** 1.0
