"use client"

import { useEffect, useMemo, useState } from "react"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import MemberMonthlyTrendLine from "@/components/charts/member-monthly-trend-line"
import MemberPerformanceRadar from "@/components/charts/member-performance-radar"
import MemberAreaInteractive from "@/components/charts/member-area-interactive"
import { AttendanceByGroupTable } from "@/components/attendance-by-group-table/attendance-by-group-table"
import { DashboardCard } from "@/components/dashboard-card"
import { MemberStatusChart } from "@/components/pie-chart"
import { CustomerInsights } from "@/components/customer-insights"
import { SectionCards } from "@/components/section-cards"
import { Empty } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

import { getDashboardStats, getMonthlyAttendanceStats, getTodayAttendanceDistribution } from "@/action/dashboard"
import { getMemberSummary } from "@/action/members"
import { getAttendanceByGroup } from "@/action/attendance_group"

import { createClient } from "@/utils/supabase/client"

import type { LucideIcon } from "@/components/icons/lucide-exports"
import { Users, ClipboardCheck, Clock, CalendarCheck2 } from "@/components/icons/lucide-exports"

import type { IMemberAttendancePoint, IMemberPerformance } from "@/interface"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"

type StatCard = {
  title: string
  value: number | string
  icon: LucideIcon
  loading: boolean
  description?: string
}

type AttendanceDistributionRow = {
  label: string
  value: number
}

type AttendanceSummary = {
  distribution: AttendanceDistributionRow[]
  timeline: IMemberAttendancePoint[]
  performance: IMemberPerformance | null
}

const STAT_CONFIG: Array<{
  key: keyof ReturnType<typeof mapDashboardStats>
  title: string
  icon: LucideIcon
  description?: string
}> = [
  { key: "totalMembers", title: "Total members", icon: Users },
  { key: "todayAttendance", title: "Present today", icon: ClipboardCheck },
  { key: "todayLate", title: "Late arrivals", icon: Clock },
  { key: "pendingApprovals", title: "Pending approvals", icon: CalendarCheck2 },
]

function mapDashboardStats(stats: Awaited<ReturnType<typeof getDashboardStats>>) {
  return {
    totalMembers: stats.totalMembers ?? 0,
    todayAttendance: stats.todayAttendance ?? 0,
    todayLate: stats.todayLate ?? 0,
    pendingApprovals: stats.pendingApprovals ?? 0,
    memberDistribution: stats.memberDistribution,
  }
}

type DashboardSnapshot = ReturnType<typeof mapDashboardStats>

type MemberSummary = Awaited<ReturnType<typeof getMemberSummary>>

type AttendanceGroupRow = Awaited<ReturnType<typeof getAttendanceByGroup>>["data"]

type MonthlyStats = Awaited<ReturnType<typeof getMonthlyAttendanceStats>>

type DistributionResponse = Awaited<ReturnType<typeof getTodayAttendanceDistribution>>

function StatCardItem({ title, value, icon: Icon, loading, description }: StatCard) {
  return (
    <DashboardCard title={title} value={loading ? undefined : value} loading={loading} description={description} icon={Icon} />
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardSnapshot | null>(null)
  const [memberSummary, setMemberSummaryState] = useState<MemberSummary | null>(null)
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyStats["data"] | null>(null)
  const [distribution, setDistribution] = useState<DistributionResponse["data"]>([])
  const [groupRows, setGroupRows] = useState<AttendanceGroupRow>([])

  useEffect(() => {
    async function bootstrap() {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        setOrganizationId(null)
        setLoading(false)
        return
      }

      const summary = await getMemberSummary()
      setOrganizationId(summary.organizationId)
      setMemberSummaryState(summary)
    }

    bootstrap().catch((error) => {
      console.error("Failed to resolve organization", error)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    async function fetchAnalytics() {
      try {
        setLoading(true)
        const [dashboard, monthly, distributionResult, groups] = await Promise.all([
          getDashboardStats(),
          getMonthlyAttendanceStats(),
          getTodayAttendanceDistribution(),
          getAttendanceByGroup(organizationId),
        ])

        setStats(mapDashboardStats(dashboard))
        setMonthlyAttendance(monthly.success ? monthly.data : null)
        setDistribution(distributionResult.data ?? [])
        setGroupRows(groups.data ?? [])
      } catch (error) {
        console.error("Failed to load analytics", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics().catch((error) => {
      console.error("Analytics fetch failure", error)
      setLoading(false)
    })
  }, [organizationId])

  const statCards = useMemo<StatCard[]>(() => {
    return STAT_CONFIG.map(({ key, title, icon, description }) => ({
      title,
      icon,
      description,
      loading,
      value: stats ? stats[key] : 0,
    }))
  }, [loading, stats])

  if (organizationId === null) {
    return (
      <ContentLayout title="Analytics">
        <div className="mt-24 flex justify-center">
          <Empty title="No organization detected" description="Join or create an organization to explore analytics." />
        </div>
      </ContentLayout>
    )
  }

  const attendanceTrend: IMemberAttendancePoint[] = []
  const performance: IMemberPerformance | null = null

  return (
    <ContentLayout title="Analytics">
      <div className="flex flex-col gap-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCardItem key={card.title} {...card} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Attendance overview</h2>
                <p className="text-sm text-muted-foreground">Trends and breakdown of attendance activity.</p>
              </div>
            </div>
            <div className="space-y-6">
              <MemberMonthlyTrendLine data={attendanceTrend} />
              <div className="rounded-xl border bg-muted/30 p-4">
                {distribution.length ? (
                  <ChartContainer
                    config={distribution.reduce((config, row) => {
                      config[row.name.toLowerCase()] = { label: row.name }
                      return config
                    }, {} as Record<string, { label: string }>)}
                    className="h-64"
                  >
                    <ResponsiveContainer>
                      <BarChart data={distribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="var(--primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <Skeleton className="h-64 w-full" />
                )}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Work pattern insights</h2>
              <p className="text-sm text-muted-foreground">Attendance density and average working durations.</p>
            </div>
            <MemberAreaInteractive data={attendanceTrend} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Attendance by group</h2>
              <p className="text-sm text-muted-foreground">Comparative metrics across departments.</p>
            </div>
            <AttendanceByGroupTable data={groupRows ?? []} isLoading={loading} />
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Member distribution</h2>
              <p className="text-sm text-muted-foreground">Active versus inactive members organization-wide.</p>
              <MemberStatusChart data={stats?.memberDistribution.status ?? []} />
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Performance summary</h2>
              <MemberPerformanceRadar performance={performance ?? { counts: { present: 0, late: 0, absent: 0, excused: 0 } }} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Monthly highlights</h2>
            <SectionCards monthlyAttendance={monthlyAttendance} />
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Insights feed</h2>
            <CustomerInsights />
          </div>
        </section>
      </div>
    </ContentLayout>
  )
}
