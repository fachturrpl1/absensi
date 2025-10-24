import { useQuery } from '@tanstack/react-query'

type MonthlyStats = {
  currentMonth: number
  previousMonth: number
  percentChange: number
}

type MemberDistribution = {
  status: Array<{ name: string; value: number; color: string }>
  employment: Array<{ name: string; value: number; color: string }>
}

type AttendanceGroup = {
  group: string
  present_plus_late: number
  not_in_others: number
  percent_present: number
  late_count: number
  overall: number
}

type DashboardStats = {
  totalActiveMembers: number
  totalMembers: number
  todayAttendance: number
  todayLate: number
  todayAbsent: number
  todayExcused: number
  pendingApprovals: number
  totalGroups: number
  memberDistribution: MemberDistribution | null
  monthlyAttendance: MonthlyStats
  monthlyLate: MonthlyStats
  activeMembers: MonthlyStats
  activeRfid: MonthlyStats
  attendanceGroups: any[]
  groupComparison: any[]
}

// CONSOLIDATED HOOK - Fetches all dashboard stats in one request
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      console.log('[React Query] Fetching consolidated dashboard stats')
      const res = await fetch('/api/dashboard/stats', { 
        credentials: 'same-origin',
        // Leverage HTTP caching
        cache: 'default'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch dashboard stats')
      }
      return json.data as DashboardStats
    },
    staleTime: 1000 * 60 * 3, // 3 minutes - matches server cache
    gcTime: 1000 * 60 * 10, // 10 minutes in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  })
}

// Legacy individual hooks - now use the consolidated hook internally
export function useMonthlyAttendance() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.monthlyAttendance, ...rest }
}

export function useMonthlyLate() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.monthlyLate, ...rest }
}

export function useActiveMembers() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.activeMembers, ...rest }
}

export function useActiveRfid() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.activeRfid, ...rest }
}

export function useMemberDistribution() {
  const { data, ...rest } = useDashboardStats()
  return { data: data?.memberDistribution, ...rest }
}

export function useAttendanceGroups(organizationId: string | null) {
  const { data, ...rest } = useDashboardStats()
  
  return {
    ...rest,
    data: data?.attendanceGroups ? data.attendanceGroups.map((g: any) => {
      const present_plus_late = (g.present || 0) + (g.late || 0)
      const not_in_others = (g.absent || 0) + (g.excused || 0) + (g.others || 0)
      const total = g.total || present_plus_late + not_in_others
      const percent_present = total > 0 ? present_plus_late / total : 0
      const late_count = g.late || 0
      const overall = present_plus_late + not_in_others
      return {
        group: g.group,
        present_plus_late,
        not_in_others,
        percent_present,
        late_count,
        overall,
      }
    }) : []
  }
}
