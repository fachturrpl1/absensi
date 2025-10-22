"use client"

import { useEffect, useState } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { createClient } from "@/utils/supabase/client"
import { getMemberSummary } from "@/action/members"
import {
  getAnalyticsKPIs,
  getHourlyAttendanceHeatmap,
  getDepartmentPerformance,
  getAttendanceTrends30Days,
  getStatusDistribution,
  getRecentActivities,
} from "@/action/analytics"

import { Card } from "@/components/ui/card"
import { ModernKPICards } from "./_components/modern-kpi-cards"
import { HourlyHeatmap } from "./_components/hourly-heatmap"
import { DepartmentPerformanceGrid } from "./_components/department-performance-grid"
import { TrendsAreaChart } from "./_components/trends-area-chart"
import { StatusPieChart } from "./_components/status-pie-chart"
import { ActivityFeed } from "./_components/activity-feed"
import { InsightsCards } from "./_components/insights-cards"

interface AnalyticsData {
  kpis: any
  hourlyData: any[]
  departmentData: any[]
  trendsData: any[]
  statusData: { today: any[]; month: any[] }
  activities: any[]
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    async function initializeOrg() {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
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

    async function fetchAnalytics() {
      try {
        setLoading(true)
        const [kpis, hourly, dept, trends, status, activities] = await Promise.all([
          getAnalyticsKPIs(),
          getHourlyAttendanceHeatmap(),
          getDepartmentPerformance(),
          getAttendanceTrends30Days(),
          getStatusDistribution(),
          getRecentActivities(10),
        ])

        setData({
          kpis: kpis.data,
          hourlyData: hourly.data || [],
          departmentData: dept.data || [],
          trendsData: trends.data || [],
          statusData: status.data || { today: [], month: [] },
          activities: activities.data || [],
        })
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [organizationId])

  const generateInsights = () => {
    if (!data?.kpis) return []

    const insights = []

    if (data.kpis.todayAttendanceRate >= 90) {
      insights.push({
        type: "success" as const,
        title: "Excellent Attendance",
        description: "Today's attendance rate exceeds 90%. Keep up the great work!",
        value: `${data.kpis.todayAttendanceRate}%`,
      })
    } else if (data.kpis.todayAttendanceRate < 75) {
      insights.push({
        type: "warning" as const,
        title: "Low Attendance",
        description: "Today's attendance is below target. Consider follow-up actions.",
        value: `${data.kpis.todayAttendanceRate}%`,
      })
    }

    if (data.kpis.avgLateMinutes > 0) {
      insights.push({
        type: "info" as const,
        title: "Late Arrivals",
        description: `Average late time is ${data.kpis.avgLateMinutes} minutes today`,
        value: `${data.kpis.avgLateMinutes}min`,
      })
    }

    if (data.kpis.totalOvertimeHours > 0) {
      insights.push({
        type: "info" as const,
        title: "Overtime Activity",
        description: "Significant overtime hours recorded today",
        value: `${data.kpis.totalOvertimeHours}h`,
      })
    }

    if (data.kpis.onTimeRate >= 95) {
      insights.push({
        type: "positive" as const,
        title: "High Punctuality",
        description: "Over 95% of attendees arrived on time",
        value: `${data.kpis.onTimeRate}%`,
      })
    }

    if (data.departmentData.length > 0) {
      const topDept = data.departmentData[0]
      if (topDept.rate >= 90) {
        insights.push({
          type: "success" as const,
          title: "Top Department",
          description: `${topDept.name} leads with ${topDept.rate}% attendance`,
        })
      }
    }

    if (data.kpis.trends.attendance > 5) {
      insights.push({
        type: "positive" as const,
        title: "Attendance Rising",
        description: "Attendance trend is improving compared to yesterday",
        value: `+${data.kpis.trends.attendance}%`,
      })
    } else if (data.kpis.trends.attendance < -5) {
      insights.push({
        type: "negative" as const,
        title: "Attendance Declining",
        description: "Attendance dropped compared to yesterday",
        value: `${data.kpis.trends.attendance}%`,
      })
    }

    if (insights.length === 0) {
      insights.push({
        type: "info" as const,
        title: "Steady Performance",
        description: "Attendance metrics are stable and within normal range",
      })
    }

    return insights.slice(0, 4)
  }

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

  return (
    <ContentLayout title="Analytics">
      <div className="space-y-8">
        {/* Enhanced Header */}
        <Card className="p-8">
          <div className="flex flex-col gap-2 items-center text-center">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-base">
              Real-time insights and attendance metrics
            </p>
          </div>
        </Card>

        <ModernKPICards data={data?.kpis || null} loading={loading} />

        <InsightsCards data={generateInsights()} loading={loading} />

        {/* Charts Grid with better spacing */}
        <div className="grid gap-6 xl:grid-cols-2">
          <HourlyHeatmap data={data?.hourlyData || []} loading={loading} />
          <DepartmentPerformanceGrid data={data?.departmentData || []} loading={loading} />
        </div>

        {/* Trends and Status Section */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TrendsAreaChart data={data?.trendsData || []} loading={loading} />
          </div>
          <StatusPieChart
            todayData={data?.statusData.today || []}
            monthData={data?.statusData.month || []}
            loading={loading}
          />
        </div>

        {/* Activity Feed */}
        <div className="pb-8">
          <ActivityFeed data={data?.activities || []} loading={loading} />
        </div>
      </div>
    </ContentLayout>
  )
}
