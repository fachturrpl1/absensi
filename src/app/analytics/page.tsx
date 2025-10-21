"use client"

import { useEffect, useState } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

import { getDashboardStats, getTodayAttendanceDistribution } from "@/action/dashboard"
import { getMemberSummary } from "@/action/members"
import { createClient } from "@/utils/supabase/client"

import { KPICards } from "./_components/kpi-cards"
import { AttendanceStatusChart } from "./_components/attendance-status-chart"
import { MonthlyTrendChart } from "./_components/monthly-trend-chart"
import { DepartmentPerformanceChart } from "./_components/department-performance-chart"
import { StatsSummary } from "./_components/stats-summary"

type DashboardData = {
  totalMembers: number
  todayAttendance: number
  todayLate: number
  todayAbsent: number
  pendingApprovals: number
  totalGroups: number
  attendanceDistribution: Record<string, unknown> | null
}

// Sample data for trends and department performance
const SAMPLE_MONTHLY_DATA = [
  { date: "Oct 1", present: 142, late: 15, absent: 28 },
  { date: "Oct 2", present: 148, late: 12, absent: 25 },
  { date: "Oct 3", present: 145, late: 10, absent: 30 },
  { date: "Oct 4", present: 151, late: 10, absent: 24 },
  { date: "Oct 5", present: 155, late: 7, absent: 23 },
  { date: "Oct 8", present: 152, late: 9, absent: 24 },
  { date: "Oct 9", present: 149, late: 8, absent: 28 },
  { date: "Oct 10", present: 156, late: 7, absent: 22 },
  { date: "Oct 11", present: 158, late: 6, absent: 21 },
  { date: "Oct 12", present: 162, late: 5, absent: 18 },
]

const SAMPLE_DEPARTMENT_DATA = [
  { name: "Engineering", attendance: 94, target: 95 },
  { name: "Sales", attendance: 88, target: 90 },
  { name: "HR", attendance: 96, target: 95 },
  { name: "Finance", attendance: 91, target: 92 },
  { name: "Marketing", attendance: 85, target: 88 },
]

export default function AnalyticsPage() {
  const [_loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [attendanceDistribution, setAttendanceDistribution] = useState<
    Array<{ name: string; value: number; color: string }>
  >([])

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
        const [stats, dist] = await Promise.all([
          getDashboardStats(),
          getTodayAttendanceDistribution(),
        ])

        setDashboardData({
          totalMembers: stats.totalMembers ?? 0,
          todayAttendance: stats.todayAttendance ?? 0,
          todayLate: stats.todayLate ?? 0,
          todayAbsent: stats.todayAbsent ?? 0,
          pendingApprovals: stats.pendingApprovals ?? 0,
          totalGroups: stats.totalGroups ?? 0,
          attendanceDistribution: stats.memberDistribution ?? null,
        })

        if (dist.success && dist.data) {
          setAttendanceDistribution(dist.data)
        }
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
              <EmptyDescription>
                Join or create an organization to explore analytics.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </ContentLayout>
    )
  }

  const attendanceRate = dashboardData?.totalMembers
    ? Math.round((dashboardData.todayAttendance / dashboardData.totalMembers) * 100)
    : 0

  return (
    <ContentLayout title="Analytics">
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPICards
          totalMembers={dashboardData?.totalMembers ?? 0}
          todayAttendance={dashboardData?.todayAttendance ?? 0}
          todayLate={dashboardData?.todayLate ?? 0}
          todayAbsent={dashboardData?.todayAbsent ?? 0}
          attendanceRate={attendanceRate}
        />

        {/* Stats Summary */}
        <StatsSummary
          pendingApprovals={dashboardData?.pendingApprovals ?? 0}
          totalGroups={dashboardData?.totalGroups ?? 0}
          onTimeRate={92}
        />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AttendanceStatusChart data={attendanceDistribution} />
          <MonthlyTrendChart data={SAMPLE_MONTHLY_DATA} />
        </div>

        {/* Charts Row 2 */}
        <DepartmentPerformanceChart data={SAMPLE_DEPARTMENT_DATA} />
      </div>
    </ContentLayout>
  )
}
