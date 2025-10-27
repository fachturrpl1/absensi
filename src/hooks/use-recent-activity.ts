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
        cache: 'default'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch recent activity')
      }
      return json.data as ActivityItem[]
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  })
}
