"use client"

import { ArrowUp, Users, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type StatCardsProps = {
  totalMembers?: number
  presentToday?: number
  lateArrivals?: number
  absenceCount?: number
}

export function StatCards({
  totalMembers = 183,
  presentToday = 145,
  lateArrivals = 15,
  absenceCount = 18,
}: StatCardsProps) {
  const attendanceRate = Math.round((presentToday / totalMembers) * 100)

  const stats = [
    {
      title: "Total Members",
      value: totalMembers.toString(),
      icon: Users,
      color: "text-slate-700",
      bgColor: "bg-slate-50 dark:bg-slate-900/20",
      description: "Active employees",
    },
    {
      title: "Present Today",
      value: presentToday.toString(),
      icon: Clock,
      color: "text-slate-600",
      bgColor: "bg-slate-100 dark:bg-slate-800/30",
      description: `${attendanceRate}% attendance rate`,
      trend: "+2.5%",
    },
    {
      title: "Late Arrivals",
      value: lateArrivals.toString(),
      icon: AlertCircle,
      color: "text-slate-600",
      bgColor: "bg-slate-100 dark:bg-slate-800/30",
      description: "This morning",
      trend: "-8%",
    },
    {
      title: "Absences",
      value: absenceCount.toString(),
      icon: AlertCircle,
      color: "text-slate-700",
      bgColor: "bg-slate-50 dark:bg-slate-900/20",
      description: "Today",
      trend: "-12%",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card key={i} className="border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} rounded-lg p-2`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stat.value}</div>
                {stat.trend && (
                  <Badge variant="outline" className="text-xs font-medium border-slate-200 text-slate-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-1">{stat.description}</CardDescription>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
