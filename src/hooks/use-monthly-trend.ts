import { useQuery } from '@tanstack/react-query'

type MonthlyTrendData = {
  month: string
  attendance: number
  late: number
}

export function useMonthlyTrend() {
  return useQuery({
    queryKey: ['dashboard', 'monthly-trend'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/monthly-trend', {
        credentials: 'same-origin',
        cache: 'default'
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error('Failed to fetch monthly trend data')
      }
      return json.data as MonthlyTrendData[]
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
