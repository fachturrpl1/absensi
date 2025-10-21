"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"

interface AttendanceStatusChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
}

export function AttendanceStatusChart({ data }: AttendanceStatusChartProps) {
  const chartConfig = {
    attendance: {
      label: "Attendance Status",
    },
  } satisfies ChartConfig

  const total = data.reduce((acc, item) => acc + item.value, 0)

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-base">Attendance Status Distribution</CardTitle>
        <CardDescription className="text-gray-600">Today&apos;s attendance breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="grid grid-cols-2 gap-3">
            {data.map((item) => (
              <div
                key={item.name}
                className="rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-600">
                    {item.name}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {item.value}
                  </span>
                  <span className="text-xs text-gray-500">
                    {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
