import { useQuery } from '@tanstack/react-query'

type ActivityItem = {
  id: string
  memberName: string
  status: 'present' | 'late' | 'absent'
  checkInTime: string
  lateMinutes?: number
  department?: string
}

export function useRecentActivity(limit: number = 15) {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/recent-activity?limit=${limit}`, {
        credentials: 'same-origin',
        cache: 'default'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch recent activity')
      }
      return json.data as ActivityItem[]
    },
    staleTime: 1000 * 30, // 30 seconds - very fresh for live feed
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60, // Auto-refetch every 1 minute for live updates
  })
}
