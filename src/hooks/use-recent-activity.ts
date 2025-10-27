import { useQuery } from '@tanstack/react-query'
import { useOrganizationId } from './use-organization-id'

type ActivityItem = {
  id: string
  memberName: string
  status: 'present' | 'late' | 'absent'
  checkInTime: string
  lateMinutes?: number
  department?: string
}

export function useRecentActivity(limit: number = 15) {
  const { data: organizationId } = useOrganizationId()

  return useQuery({
    queryKey: ['dashboard', 'recent-activity', organizationId, limit],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/recent-activity?limit=${limit}`, {
        credentials: 'same-origin',
        cache: 'no-store'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch recent activity')
      }
      return json.data as ActivityItem[]
    },
    enabled: !!organizationId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // Auto-refresh every 60 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true
  })
}
