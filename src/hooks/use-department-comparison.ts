import { useQuery } from '@tanstack/react-query'

type DepartmentStat = {
  id: string
  name: string
  attendanceRate: number
  totalMembers: number
  presentToday: number
  rank: number
}

export function useDepartmentComparison() {
  return useQuery({
    queryKey: ['dashboard', 'department-comparison'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/department-comparison', {
        credentials: 'same-origin',
        cache: 'default'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch department comparison')
      }
      return json.data as DepartmentStat[]
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
