"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react"

interface KPICardsProps {
  totalMembers: number
  todayAttendance: number
  todayLate: number
  todayAbsent: number
  attendanceRate: number
}

export function KPICards({
  totalMembers,
  todayAttendance,
  todayLate,
  todayAbsent,
  attendanceRate,
}: KPICardsProps) {
  const cards = [
    {
      title: "Total Members",
      value: totalMembers,
      icon: Users,
      description: "Active organization members",
      trend: "+5.2%",
      color: "text-slate-700 dark:text-slate-300",
      bgColor: "bg-slate-50 dark:bg-slate-900/50",
    },
    {
      title: "Present Today",
      value: todayAttendance,
      icon: CheckCircle2,
      description: "Members checked in",
      trend: "+12.5%",
      color: "text-slate-700 dark:text-slate-300",
      bgColor: "bg-slate-50 dark:bg-slate-900/50",
    },
    {
      title: "Late Arrivals",
      value: todayLate,
      icon: Clock,
      description: "Late check-ins today",
      trend: "-2.5%",
      color: "text-slate-700 dark:text-slate-300",
      bgColor: "bg-slate-50 dark:bg-slate-900/50",
    },
    {
      title: "Absent",
      value: todayAbsent,
      icon: AlertCircle,
      description: "Members not present",
      trend: "-1.2%",
      color: "text-slate-700 dark:text-slate-300",
      bgColor: "bg-slate-50 dark:bg-slate-900/50",
    },
    {
      title: "Attendance Rate",
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      description: "Overall attendance percentage",
      trend: "+3.8%",
      color: "text-slate-700 dark:text-slate-300",
      bgColor: "bg-slate-50 dark:bg-slate-900/50",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {card.value}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {card.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
