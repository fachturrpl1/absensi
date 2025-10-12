"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"

export type InsightStats = {
  period: string
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  vipCustomers: number
}

export function useCustomerInsights() {
  const supabase = useRef(createClient())
  const [stats, setStats] = useState<InsightStats>({
    period: "Last 24 hours",
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    vipCustomers: 0,
  })

  useEffect(() => {
    let mounted = true

    async function fetchFromApi() {
      try {
        const res = await fetch('/api/dashboard/stats')
        const json = await res.json()
        if (!mounted) return
        if (json?.success && json.data) {
          // Map server fields to UI fields
          setStats({
            period: 'Today',
            totalCustomers: json.data.totalMembers || 0,
            newCustomers: json.data.totalActiveMembers || 0, // will remap in UI later
            returningCustomers: json.data.totalGroups || 0,
            vipCustomers: json.data.todayAttendance || 0,
          })
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats from API', err)
      }
    }

    fetchFromApi()

    // Subscribe to changes on attendance_records, organization_members, departments
    const channel = supabase.current.channel('public:dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => fetchFromApi())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_members' }, () => fetchFromApi())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => fetchFromApi())
      .subscribe()

    return () => {
      mounted = false
      try { supabase.current.removeChannel(channel) } catch (e) { }
    }
  }, [])

  return stats
}
