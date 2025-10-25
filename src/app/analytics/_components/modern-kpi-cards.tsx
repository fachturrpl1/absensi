"use client"

import { Users, TrendingUp, Clock, Briefcase } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPIData {
  totalMembers: number
  todayAttendanceRate: number
  avgLateMinutes: number
  totalOvertimeHours: number
  onTimeRate: number
  trends: {
    attendance: number
    late: number
    overtime: number
  }
}

interface ModernKPICardsProps {
  data: KPIData | null
  loading?: boolean
}

export function ModernKPICards({ data, loading }: ModernKPICardsProps) {
  const kpis = [
    {
      title: "Total Members",
      value: data?.totalMembers || 0,
      unit: "",
      icon: Users,
      description: "Active employees",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Attendance Rate",
      value: data?.todayAttendanceRate || 0,
      unit: "%",
      icon: TrendingUp,
      description: "Today's check-ins",
      trend: data?.trends.attendance || 0,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Avg Late Time",
      value: data?.avgLateMinutes || 0,
      unit: " min",
      icon: Clock,
      description: "Average delay",
      trend: data?.trends.late || 0,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      inverse: true,
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        const trendValue = kpi.trend
        const showTrend = typeof trendValue === "number" && trendValue !== 0
        const isPositive = kpi.inverse ? (trendValue ?? 0) < 0 : (trendValue ?? 0) > 0

        return (
          <Card key={index} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4" style={{ borderLeftColor: `hsl(var(--${kpi.color.includes('blue') ? 'primary' : kpi.color.includes('green') ? 'chart-1' : kpi.color.includes('orange') ? 'chart-3' : 'chart-5'}))` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold tracking-tight">
                      {kpi.value}
                    </h3>
                    <span className="text-xl text-muted-foreground/70">{kpi.unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{kpi.description}</p>
                    {showTrend && (
                      <span
                        className={cn(
                          "text-xs font-medium flex items-center gap-0.5",
                          isPositive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {isPositive ? "↑" : "↓"}
                        {Math.abs(trendValue)}
                        {kpi.unit === "%" ? "%" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className={cn("p-3.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow", kpi.bgColor)}>
                  <Icon className={cn("h-5 w-5", kpi.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
