import { useQuery } from '@tanstack/react-query'

type TodaySummaryData = {
  totalMembers: number
  checkedIn: number
  onTime: number
  late: number
  absent: number
  attendanceRate: number
}

export function useTodaySummary() {
  return useQuery({
    queryKey: ['dashboard', 'today-summary'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/today-summary', {
        credentials: 'same-origin',
        cache: 'default'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch today summary')
      }
      return json.data as TodaySummaryData
    },
    staleTime: 1000 * 60, // 1 minute - more frequent updates for live data
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user comes back
    refetchInterval: 1000 * 60 * 2, // Auto-refetch every 2 minutes
  })
}
