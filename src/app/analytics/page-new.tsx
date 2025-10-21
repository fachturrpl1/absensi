"use client"

import { useEffect, useState } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

import { getDashboardStats } from "@/action/dashboard"
import { getMemberSummary } from "@/action/members"
import { createClient } from "@/utils/supabase/client"

import { StatCards } from "./_components/stat-cards"
import { AttendanceTrends } from "./_components/attendance-trends"
import { DepartmentPerformance } from "./_components/department-performance"
import { StatusDistribution } from "./_components/status-distribution"
import { HourlyCheckin } from "./_components/hourly-checkin"
import { RecentActivity } from "./_components/recent-activity"

type DashboardData = {
  totalMembers: number
  todayAttendance: number
  todayLate: number
  pendingApprovals: number
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-lg lg:col-span-2" />
        <Skeleton className="h-80 rounded-lg" />
      </div>

      {/* Bottom */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  useEffect(() => {
    async function initializeOrg() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()

        if (!data.user) {
          setOrganizationId(null)
          setLoading(false)
          return
        }

        const summary = await getMemberSummary()
        setOrganizationId(summary.organizationId)
      } catch (error) {
        console.error("Failed to initialize organization:", error)
        setLoading(false)
      }
    }

    initializeOrg()
  }, [])

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    async function fetchDashboard() {
      try {
        setLoading(true)
        const stats = await getDashboardStats()

        setDashboardData({
          totalMembers: stats.totalMembers ?? 0,
          todayAttendance: stats.todayAttendance ?? 0,
          todayLate: stats.todayLate ?? 0,
          pendingApprovals: stats.pendingApprovals ?? 0,
        })
      } catch (error) {
        console.error("Failed to fetch dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [organizationId])

  if (organizationId === null) {
    return (
      <ContentLayout title="Analytics">
        <div className="mt-24 flex justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No organization detected</EmptyTitle>
              <EmptyDescription>Join or create an organization to explore analytics.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </ContentLayout>
    )
  }

  if (loading) {
    return (
      <ContentLayout title="Analytics">
        <LoadingSkeleton />
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title="Analytics">
      <div className="space-y-6">
        {/* Stat Cards */}
        <StatCards
          totalMembers={dashboardData?.totalMembers ?? 183}
          presentToday={dashboardData?.todayAttendance ?? 145}
          lateArrivals={dashboardData?.todayLate ?? 15}
          absenceCount={18}
        />

        {/* Main Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AttendanceTrends />
          </div>
          <div>
            <StatusDistribution />
          </div>
        </div>

        {/* Secondary Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <DepartmentPerformance />
          <HourlyCheckin />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </ContentLayout>
  )
}
