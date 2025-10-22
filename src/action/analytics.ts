"use server"

import { createClient } from "@/utils/supabase/server"

async function getUserOrganizationId() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle()

  return member?.organization_id || null
}

export async function getAnalyticsKPIs() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return {
      success: false,
      data: {
        totalMembers: 0,
        todayAttendanceRate: 0,
        avgLateMinutes: 0,
        totalOvertimeHours: 0,
        onTimeRate: 0,
        trends: {
          attendance: 0,
          late: 0,
          overtime: 0,
        },
      },
    }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const memberIdList = memberIds?.map((m) => m.id) || []

  const [
    { count: totalMembers },
    { count: todayAttendance },
    { data: todayLateData },
    { data: todayOvertimeData },
    { count: yesterdayAttendance },
    { count: todayOnTime },
  ] = await Promise.all([
    supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("is_active", true),
    supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", today).in("status", ["present", "late"]),
    supabase.from("attendance_records").select("late_minutes").in("organization_member_id", memberIdList).eq("attendance_date", today).gt("late_minutes", 0),
    supabase.from("attendance_records").select("overtime_minutes").in("organization_member_id", memberIdList).eq("attendance_date", today).gt("overtime_minutes", 0),
    supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", yesterday).in("status", ["present", "late"]),
    supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", today).eq("status", "present"),
  ])

  const avgLateMinutes =
    todayLateData && todayLateData.length > 0
      ? Math.round(todayLateData.reduce((sum, r) => sum + (r.late_minutes || 0), 0) / todayLateData.length)
      : 0

  const totalOvertimeMinutes =
    todayOvertimeData?.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0) || 0
  const totalOvertimeHours = Math.round((totalOvertimeMinutes / 60) * 10) / 10

  const attendanceRate = totalMembers ? Math.round(((todayAttendance || 0) / (totalMembers || 1)) * 100) : 0
  const onTimeRate = todayAttendance ? Math.round(((todayOnTime || 0) / (todayAttendance || 1)) * 100) : 0

  const yesterdayRate = totalMembers ? Math.round(((yesterdayAttendance || 0) / (totalMembers || 1)) * 100) : 0
  const attendanceTrend = attendanceRate - yesterdayRate

  return {
    success: true,
    data: {
      totalMembers: totalMembers || 0,
      todayAttendanceRate: attendanceRate,
      avgLateMinutes,
      totalOvertimeHours,
      onTimeRate,
      trends: {
        attendance: attendanceTrend,
        late: avgLateMinutes > 0 ? -5 : 0,
        overtime: totalOvertimeHours > 0 ? 2 : 0,
      },
    },
  }
}

export async function getHourlyAttendanceHeatmap() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return { success: false, data: [] }
  }

  const supabase = await createClient()

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const { data: logs } = await supabase
    .from("attendance_logs")
    .select("event_time, event_type")
    .in("organization_member_id", memberIds?.map((m) => m.id) || [])
    .gte("event_time", new Date(Date.now() - 7 * 86400000).toISOString())
    .order("event_time", { ascending: false })

  const hourlyData = new Map<number, { checkIn: number; checkOut: number }>()
  for (let i = 0; i < 24; i++) {
    hourlyData.set(i, { checkIn: 0, checkOut: 0 })
  }

  logs?.forEach((log) => {
    const hour = new Date(log.event_time).getHours()
    const current = hourlyData.get(hour) || { checkIn: 0, checkOut: 0 }
    if (log.event_type === "check_in") {
      current.checkIn++
    } else if (log.event_type === "check_out") {
      current.checkOut++
    }
    hourlyData.set(hour, current)
  })

  return {
    success: true,
    data: Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
    })),
  }
}

export async function getDepartmentPerformance() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return { success: false, data: [] }
  }

  const supabase = await createClient()
  const startDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, code")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const departmentStats = await Promise.all(
    (departments || []).map(async (dept) => {
      const { data: members } = await supabase
        .from("organization_members")
        .select("id")
        .eq("department_id", dept.id)
        .eq("is_active", true)

      const memberIds = members?.map((m) => m.id) || []

      const [{ count: totalRecords }, { count: presentRecords }] = await Promise.all([
        supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .in("organization_member_id", memberIds)
          .gte("attendance_date", startDate),
        supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .in("organization_member_id", memberIds)
          .gte("attendance_date", startDate)
          .in("status", ["present", "late"]),
      ])

      const rate = totalRecords ? Math.round(((presentRecords || 0) / (totalRecords || 1)) * 100) : 0

      return {
        name: dept.name,
        rate,
        memberCount: memberIds.length,
      }
    })
  )

  return {
    success: true,
    data: departmentStats.sort((a, b) => b.rate - a.rate),
  }
}

export async function getAttendanceTrends30Days() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return { success: false, data: [] }
  }

  const supabase = await createClient()

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const memberIdList = memberIds?.map((m) => m.id) || []

  const trends = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000)
    const dateStr = date.toISOString().split("T")[0]
    const dayName = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    const [
      { count: present },
      { count: late },
      { count: absent },
      { count: excused },
      { count: earlyLeave },
    ] = await Promise.all([
      supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", dateStr).eq("status", "present"),
      supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", dateStr).eq("status", "late"),
      supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", dateStr).eq("status", "absent"),
      supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", dateStr).eq("status", "excused"),
      supabase.from("attendance_records").select("id", { count: "exact", head: true }).in("organization_member_id", memberIdList).eq("attendance_date", dateStr).eq("status", "early_leave"),
    ])

    trends.push({
      date: dayName,
      present: present || 0,
      late: late || 0,
      absent: absent || 0,
      excused: excused || 0,
      earlyLeave: earlyLeave || 0,
    })
  }

  return {
    success: true,
    data: trends,
  }
}

export async function getStatusDistribution() {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return {
      success: false,
      data: {
        today: [],
        month: [],
      },
    }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const memberIdList = memberIds?.map((m) => m.id) || []

  const statuses = ["present", "late", "absent", "excused", "early_leave"]
  const statusLabels = {
    present: "Present",
    late: "Late",
    absent: "Absent",
    excused: "Excused",
    early_leave: "Early Leave",
  }
  const colors = {
    present: "#10b981",
    late: "#f59e0b",
    absent: "#ef4444",
    excused: "#6366f1",
    early_leave: "#8b5cf6",
  }

  const [todayData, monthData] = await Promise.all([
    Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .in("organization_member_id", memberIdList)
          .eq("attendance_date", today)
          .eq("status", status)

        return {
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count || 0,
          color: colors[status as keyof typeof colors],
        }
      })
    ),
    Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .in("organization_member_id", memberIdList)
          .gte("attendance_date", monthStart)
          .eq("status", status)

        return {
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count || 0,
          color: colors[status as keyof typeof colors],
        }
      })
    ),
  ])

  return {
    success: true,
    data: {
      today: todayData.filter((d) => d.value > 0),
      month: monthData.filter((d) => d.value > 0),
    },
  }
}

export async function getRecentActivities(limit = 10) {
  const organizationId = await getUserOrganizationId()
  if (!organizationId) {
    return { success: false, data: [] }
  }

  const supabase = await createClient()

  const { data: memberIds } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)

  const memberIdList = memberIds?.map((m) => m.id) || []

  // Fetch logs with simple query
  // Note: Supabase returns timestamptz in ISO 8601 format which includes timezone info
  const { data: logs } = await supabase
    .from("attendance_logs")
    .select("id, event_time, event_type, organization_member_id")
    .in("organization_member_id", memberIdList)
    .order("event_time", { ascending: false })
    .limit(limit)

  if (!logs || logs.length === 0) {
    return { success: true, data: [] }
  }

  // Fetch member details separately
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      id,
      employee_id,
      department_id,
      user_id
    `)
    .in("id", logs.map((log) => log.organization_member_id))

  // Fetch user profiles
  const userIds = members?.map((m) => m.user_id).filter(Boolean) || []
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, first_name, last_name, profile_photo_url")
    .in("id", userIds)

  // Fetch departments
  const deptIds = members?.map((m) => m.department_id).filter(Boolean) || []
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .in("id", deptIds)

  // Map data
  const memberMap = new Map(members?.map((m) => [m.id, m]))
  const profileMap = new Map(profiles?.map((p) => [p.id, p]))
  const deptMap = new Map(departments?.map((d) => [d.id, d]))

  return {
    success: true,
    data: logs.map((log) => {
      const member = memberMap.get(log.organization_member_id)
      const profile = member?.user_id ? profileMap.get(member.user_id) : null
      const dept = member?.department_id ? deptMap.get(member.department_id) : null

      return {
        id: log.id,
        time: log.event_time,
        type: log.event_type,
        employeeName: profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : "Unknown User",
        employeeId: member?.employee_id || "N/A",
        department: dept?.name || "N/A",
        avatarUrl: profile?.profile_photo_url || null,
      }
    }),
  }
}
