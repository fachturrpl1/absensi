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
          className="border-gray-200"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500">
                {stat.subtext}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
