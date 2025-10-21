"use client"

import { useEffect, useState } from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

import { getDashboardStats, getTodayAttendanceDistribution } from "@/action/dashboard"
import { getAttendanceByGroup } from "@/action/attendance_group"
import { getMemberSummary } from "@/action/members"
import { createClient } from "@/utils/supabase/client"

import { TrendingUp, TrendingDown, Users, Check, Clock, AlertCircle, BarChart3, Zap, Grid2x2Plus } from "@/components/icons/lucide-exports"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { MemberStatusChart } from "@/components/pie-chart"
import { AttendanceByGroupTable } from "@/components/attendance-by-group-table/attendance-by-group-table"
import MemberPerformanceRadar from "@/components/charts/member-performance-radar"
import { CustomerInsights } from "@/components/customer-insights"

type DashboardData = {
  totalMembers: number
  todayAttendance: number
  todayLate: number
  pendingApprovals: number
  memberDistribution: { status: Array<{ name: string; value: number; color: string }>; employment: Array<{ name: string; value: number; color: string }> } | null
}

type MetricCardProps = {
  title: string
  value: number | string
  trend?: { value: number; label: string; isPositive: boolean }
  icon: React.ReactNode
  description?: string
  loading?: boolean
  variant?: "default" | "success" | "warning" | "danger"
}

function MetricCard({
  title,
  value,
  trend,
  icon,
  description,
  loading = false,
  variant = "default",
}: MetricCardProps) {
  const variants = {
    default: "from-slate-500/10 to-slate-500/5 border-slate-200/50",
    success: "from-emerald-500/10 to-emerald-500/5 border-emerald-200/50",
    warning: "from-amber-500/10 to-amber-500/5 border-amber-200/50",
    danger: "from-red-500/10 to-red-500/5 border-red-200/50",
  }

  const textVariants = {
    default: "text-slate-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  }

  return (
    <Card className={`relative overflow-hidden border bg-gradient-to-br ${variants[variant]} hover:shadow-lg transition-all duration-300`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <div className={`rounded-lg p-2 ${textVariants[variant]} bg-opacity-10`}>{icon}</div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</div>
        )}
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? "text-emerald-600" : "text-red-600"}`}>
              {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trend.value)}%
            </div>
          )}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [distribution, setDistribution] = useState<any[]>([])
  const [groupData, setGroupData] = useState<any[]>([])

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
        const [stats, dist, groups] = await Promise.all([
          getDashboardStats(),
          getTodayAttendanceDistribution(),
          getAttendanceByGroup(organizationId ?? undefined),
        ])

        setDashboardData({
          totalMembers: stats.totalMembers ?? 0,
          todayAttendance: stats.todayAttendance ?? 0,
          todayLate: stats.todayLate ?? 0,
          pendingApprovals: stats.pendingApprovals ?? 0,
          memberDistribution: stats.memberDistribution ?? null,
        })

        setDistribution(dist.data ?? [])
        setGroupData(groups.data ?? [])
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
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Attendance Dashboard</h1>
                <p className="text-blue-100">Real-time workforce analytics and insights</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="gap-1 bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Zap className="h-3 w-3 fill-current" />
                  Live Updates
                </Badge>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-white" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white" />
          </div>
        </div>

        {/* Key Metrics Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Members"
            value={dashboardData?.totalMembers ?? 0}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 5, label: "vs last month", isPositive: true }}
            description="Active organization members"
            variant="success"
          />
          <MetricCard
            title="Present Today"
            value={dashboardData?.todayAttendance ?? 0}
            icon={<Check className="h-5 w-5" />}
            description={`${dashboardData?.totalMembers ? Math.round(((dashboardData.todayAttendance / dashboardData.totalMembers) * 100)) : 0}% attendance rate`}
            variant="success"
          />
          <MetricCard
            title="Late Arrivals"
            value={dashboardData?.todayLate ?? 0}
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: 2, label: "from yesterday", isPositive: false }}
            description="Members arrived late"
            variant="warning"
          />
          <MetricCard
            title="Pending Approvals"
            value={dashboardData?.pendingApprovals ?? 0}
            icon={<AlertCircle className="h-5 w-5" />}
            description="Awaiting approval"
            variant="danger"
          />
        </div>

        <Separator className="my-2" />

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Attendance Distribution Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Today's Attendance Distribution
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Breakdown of attendance status</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {distribution.length > 0 ? (
                <div className="h-80">
                  <ChartContainer
                    config={distribution.reduce(
                      (config, row) => {
                        config[row.name.toLowerCase()] = { label: row.name }
                        return config
                      },
                      {} as Record<string, { label: string }>
                    )}
                    className="w-full h-full"
                  >
                    <ResponsiveContainer>
                      <BarChart data={distribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="url(#colorBar)" radius={[12, 12, 0, 0]} />
                        <defs>
                          <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Member Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Member Status
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Active member breakdown</p>
            </CardHeader>
            <CardContent>
              <MemberStatusChart data={Array.isArray(dashboardData?.memberDistribution) ? [] : dashboardData?.memberDistribution?.status ?? []} />
            </CardContent>
          </Card>
        </div>

        {/* Group Performance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid2x2Plus className="h-5 w-5 text-emerald-600" />
              Attendance by Group
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Department-wise attendance metrics</p>
          </CardHeader>
          <CardContent>
            <AttendanceByGroupTable data={groupData ?? []} isLoading={false} />
          </CardContent>
        </Card>

        {/* Performance & Insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Performance Summary
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Overall team performance metrics</p>
            </CardHeader>
            <CardContent>
              <MemberPerformanceRadar performance={{ counts: { present: 0, late: 0, absent: 0, excused: 0 } }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Insights & Alerts
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Key observations and recommendations</p>
            </CardHeader>
            <CardContent>
              <CustomerInsights />
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentLayout>
  )
}
