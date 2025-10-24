"use client"

import { useQuery } from '@tanstack/react-query'

export type InsightStats = {
  period: string
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  vipCustomers: number
}

// Use React Query instead of custom hook with realtime subscription
// This prevents duplicate API calls and leverages React Query's caching
export function useCustomerInsights() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats', {
        credentials: 'same-origin',
        cache: 'default'
      })
      const json = await res.json()
      if (!json?.success || !json.data) {
        throw new Error('Failed to fetch dashboard stats')
      }
      return json.data
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (data) => ({
      period: 'Today',
      totalCustomers: data.totalMembers || 0,
      newCustomers: data.totalActiveMembers || 0,
      returningCustomers: data.totalGroups || 0,
      vipCustomers: data.todayAttendance || 0,
    })
  })

  return data || {
    period: "Today",
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    vipCustomers: 0,
  }
}
