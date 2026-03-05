'use client'

import { useOrgStore } from '@/store/org-store'
import { useHydration } from '@/hooks/useHydration'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DashboardSkeleton } from '@/components/root/dashboard/dashboard-skeleton'
import { useDashboardData } from '@/hooks/use-dashboard-data'

// IMPORT 6 COMPONENTS
import { DashboardHeader } from '@/components/root/dashboard/header'
import { StatsCards } from '@/components/root/dashboard/stats-cards'
import { ChartsArea } from '@/components/root/dashboard/charts/area'
import { ChartsPie } from '@/components/root/dashboard/charts/donut'
import { RecentActivity } from '@/components/root/dashboard/tables/recent-activity'
import { LiveTable } from '@/components/root/dashboard/tables/live-table'

export default function DashboardPage() {
  const orgStore = useOrgStore()
  const queryClient = useQueryClient()
  const { isHydrated, organizationId: hydratedOrgId } = useHydration()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const safeOrgName = orgStore.organizationName || 'Organization'
  const orgId = hydratedOrgId ?? orgStore.organizationId
  const {
    stats, chartData, statusData, dateRange, maxAttendance,
    isLoading, setDateRange
  } = useDashboardData(orgId, isHydrated)

  // Effects
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (orgStore.organizationId && isClient) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }, [orgStore.organizationId, queryClient, isClient])

  const getFilterLabel = () => {
    const labels: Record<string, string> = {
      'today': 'Today', 'last7': 'Last 7 Days', 'last30': 'Last 30 Days',
      'thisYear': 'This Year', 'lastYear': 'Last Year'
    }
    return labels[dateRange.preset as keyof typeof labels] || 'Custom Range'
  }

  // LOADING
  if (!isHydrated || !isClient || isLoading) {
    return <DashboardSkeleton />
  }

  // MAIN WRAPPER LAYOUT
  return (
    <div className="ml-5 mt-5 space-y-6">
      <DashboardHeader 
        dateRange={dateRange}
        setDateRange={setDateRange}
        getFilterLabel={getFilterLabel}
        orgName={safeOrgName}
        currentTime={currentTime}
        isClient={isClient}
      />
      
      <StatsCards stats={stats} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ChartsArea 
          chartData={chartData}
          dateRange={dateRange}
          maxAttendance={maxAttendance}
          getFilterLabel={getFilterLabel}
        />
        <ChartsPie statusData={statusData} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <LiveTable />
      </div>
    </div>
  )
}
