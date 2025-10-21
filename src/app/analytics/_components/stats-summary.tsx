"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsSummaryProps {
  pendingApprovals: number
  totalGroups: number
  onTimeRate: number
}

export function StatsSummary({
  pendingApprovals,
  totalGroups,
  onTimeRate,
}: StatsSummaryProps) {
  const stats = [
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      subtext: "Awaiting validation",
      variant: "default",
    },
    {
      label: "Total Departments",
      value: totalGroups,
      subtext: "Active groups",
      variant: "default",
    },
    {
      label: "On-Time Rate",
      value: `${onTimeRate}%`,
      subtext: "This month",
      variant: "default",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border-slate-200 dark:border-slate-800"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {stat.value}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stat.subtext}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
