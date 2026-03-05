import { AttendanceListItem } from '@/action/attendance'
import type { DateFilterState } from '@/components/attendance/dashboard/date-filter-bar'

export interface DashboardAttendanceRecord {
  id: string
  member_name: string
  department_name: string
  status: string
  actual_check_in: string | null
  actual_check_out: string | null
  work_duration_minutes: number | null
  attendance_date: string
  profile_photo_url: string | null
}

export async function fetchDashboardData(
  organizationId: number,
  dateRange: DateFilterState
): Promise<DashboardAttendanceRecord[]> {
  const params = new URLSearchParams({
    organizationId: String(organizationId),
    limit: '50',
    page: '1',
    dateFrom: dateRange.from.toISOString().slice(0, 10),
    dateTo: dateRange.to.toISOString().slice(0, 10),
  })

  const response = await fetch(`/api/home?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  })

  const result = await response.json()
  
  if (!result.success || !Array.isArray(result.data)) {
    return []
  }

  return result.data.map((item: AttendanceListItem): DashboardAttendanceRecord => ({
    id: item.id,
    member_name: item.member.name,
    department_name: item.member.department,
    status: item.status,
    actual_check_in: item.checkIn,
    actual_check_out: item.checkOut,
    work_duration_minutes: item.work_duration_minutes || 0,
    attendance_date: item.date,
    profile_photo_url: item.member.avatar || null,
  }))
}
