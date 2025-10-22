"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"

interface MonthlyTrendChartProps {
  data: Array<{
    date: string
    present: number
    late: number
    absent: number
  }>
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const chartConfig = {
    present: {
      label: "Present",
      color: "hsl(186, 100%, 50%)",
    },
    late: {
      label: "Late",
      color: "hsl(38, 100%, 50%)",
    },
    absent: {
      label: "Absent",
      color: "hsl(0, 100%, 50%)",
    },
  } satisfies ChartConfig

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <CardHeader>
        <CardTitle className="text-base text-gray-900 dark:text-gray-100">Attendance Trends</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Last 30 days attendance pattern</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 25%)" />
              <XAxis
                dataKey="date"
                stroke="hsl(0, 0%, 40%)"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="hsl(0, 0%, 40%)" style={{ fontSize: "12px" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="present"
                stroke="hsl(186, 100%, 50%)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="late"
                stroke="hsl(38, 100%, 50%)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="absent"
                stroke="hsl(0, 100%, 50%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
