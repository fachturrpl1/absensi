"use client"

import { useEffect, useState } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { createClient } from "@/utils/supabase/client"
import { getMemberSummary } from "@/action/members"
import { useAnalytics } from "@/hooks/use-analytics"

import { Card } from "@/components/ui/card"
import { ModernKPICards } from "./_components/modern-kpi-cards"
import { HourlyHeatmap } from "./_components/hourly-heatmap"
import { DepartmentPerformanceGrid } from "./_components/department-performance-grid"
import { TrendsAreaChart } from "./_components/trends-area-chart"
import { StatusPieChart } from "./_components/status-pie-chart"
import { ActivityFeed } from "./_components/activity-feed"
import { InsightsCards } from "./_components/insights-cards"

export default function AnalyticsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  
  const { data, isLoading, error } = useAnalytics()

  useEffect(() => {
    async function initializeOrg() {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          setOrganizationId(null)
          setInitializing(false)
          return
        }

        const summary = await getMemberSummary()
        setOrganizationId(summary.organizationId)
        setInitializing(false)
      } catch (error) {
        console.error("Failed to initialize organization:", error)
        setInitializing(false)
      }
    }

    initializeOrg()
  }, [])

  const generateInsights = () => {
    if (!data?.kpis) {
      // Return default insights when no data
      return [
        {
          type: "info" as const,
          title: "No Data Available",
          description: "Waiting for attendance data to generate insights",
          value: "0%",
        },
        {
          type: "info" as const,
          title: "No Late Arrivals",
          description: "No late arrival data recorded today",
          value: "0min",
        },
        {
          type: "info" as const,
          title: "No Trend Data",
          description: "Not enough data to calculate attendance trends",
          value: "0%",
        },
      ]
    }

    const insights = []

    // Always show attendance rate card
    if (data.kpis.todayAttendanceRate >= 90) {
      insights.push({
        type: "success" as const,
        title: "Excellent Attendance",
        description: "Today's attendance rate exceeds 90%. Keep up the great work!",
        value: `${data.kpis.todayAttendanceRate}%`,
      })
    } else if (data.kpis.todayAttendanceRate >= 75) {
      insights.push({
        type: "positive" as const,
        title: "Good Attendance",
        description: "Today's attendance is within acceptable range",
        value: `${data.kpis.todayAttendanceRate}%`,
      })
    } else if (data.kpis.todayAttendanceRate > 0) {
      insights.push({
        type: "warning" as const,
        title: "Low Attendance",
        description: "Today's attendance is below target. Consider follow-up actions.",
        value: `${data.kpis.todayAttendanceRate}%`,
      })
    } else {
      insights.push({
        type: "info" as const,
        title: "No Attendance Data",
        description: "No attendance records found for today",
        value: "0%",
      })
    }

    // Always show late arrivals card
    if (data.kpis.avgLateMinutes > 0) {
      insights.push({
        type: "info" as const,
        title: "Late Arrivals",
        description: `Average late time is ${data.kpis.avgLateMinutes} minutes today`,
        value: `${data.kpis.avgLateMinutes}min`,
      })
    } else {
      insights.push({
        type: "success" as const,
        title: "Excellent Punctuality",
        description: "No late arrivals recorded today",
        value: "0min",
      })
    }

    // Always show trend card
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
    } else {
      insights.push({
        type: "info" as const,
        title: "Stable Attendance",
        description: "Attendance trend is steady compared to yesterday",
        value: `${data.kpis.trends.attendance >= 0 ? '+' : ''}${data.kpis.trends.attendance}%`,
      })
    }

    // Overtime card (only if > 0)
    if (data.kpis.totalOvertimeHours > 0) {
      insights.push({
        type: "info" as const,
        title: "Overtime Activity",
        description: "Significant overtime hours recorded today",
        value: `${data.kpis.totalOvertimeHours}h`,
      })
    }

    // Punctuality card (only if very high)
    if (data.kpis.onTimeRate >= 95) {
      insights.push({
        type: "positive" as const,
        title: "High Punctuality",
        description: "Over 95% of attendees arrived on time",
        value: `${data.kpis.onTimeRate}%`,
      })
    }

    // Top department card
    if (data.departmentData && data.departmentData.length > 0) {
      const topDept = data.departmentData[0]
      if (topDept.rate >= 90) {
        insights.push({
          type: "success" as const,
          title: "Top Department",
          description: `${topDept.name} leads with ${topDept.rate}% attendance`,
        })
      } else if (topDept.rate > 0) {
        insights.push({
          type: "info" as const,
          title: "Top Department",
          description: `${topDept.name} leads with ${topDept.rate}% attendance`,
        })
      }
    }

    return insights.slice(0, 6)
  }

  // Show loading skeleton while initializing or loading data
  if (initializing || isLoading) {
    return (
      <ContentLayout title="Analytics">
        <div className="space-y-8">
          <Card className="p-8">
            <div className="flex flex-col gap-2 items-center text-center">
              <div className="h-10 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-8 w-16 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </ContentLayout>
    )
  }

  // Show empty state only after initialization complete
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

  // Show error state
  if (error) {
    return (
      <ContentLayout title="Analytics">
        <div className="mt-24 flex justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Failed to load analytics</EmptyTitle>
              <EmptyDescription>
                {error instanceof Error ? error.message : 'An error occurred'}
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

        <ModernKPICards data={data?.kpis || null} loading={false} />

        <InsightsCards data={generateInsights()} loading={false} />

        {/* Charts Grid with better spacing */}
        <div className="grid gap-6 xl:grid-cols-2">
          <HourlyHeatmap data={data?.hourlyData || []} loading={false} />
          <DepartmentPerformanceGrid data={data?.departmentData || []} loading={false} />
        </div>

        {/* Trends and Status Section */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TrendsAreaChart data={data?.trendsData || []} loading={false} />
          </div>
          <StatusPieChart
            todayData={data?.statusData.today || []}
            monthData={data?.statusData.month || []}
            loading={false}
          />
        </div>

        {/* Activity Feed */}
        <div className="pb-8">
          <ActivityFeed data={data?.activities || []} loading={false} />
        </div>
      </div>
    </ContentLayout>
  )
}
