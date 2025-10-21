"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickStatProps {
  label: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
}

interface QuickStatsProps {
  stats?: QuickStatProps[]
}

const DEFAULT_STATS: QuickStatProps[] = [
  {
    label: "Attendance Rate",
    value: "85%",
    change: { value: 3.5, isPositive: true },
  },
  {
    label: "On-Time Rate",
    value: "92%",
    change: { value: 2.1, isPositive: true },
  },
  {
    label: "Avg Check-in Time",
    value: "8:22 AM",
  },
  {
    label: "Peak Hours",
    value: "8:00-8:30 AM",
  },
]

export function QuickStats({ stats = DEFAULT_STATS }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border-gray-200 bg-gray-50"
        >
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-600 font-medium truncate">
              {stat.label}
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-lg font-bold text-gray-900">
                {stat.value}
              </p>
              {stat.change && (
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    stat.change.isPositive
                      ? "text-gray-700"
                      : "text-gray-600"
                  )}
                >
                  {stat.change.isPositive ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {stat.change.value}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
