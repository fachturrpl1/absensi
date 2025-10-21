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
      color: "hsl(0, 0%, 25%)",
    },
    late: {
      label: "Late",
      color: "hsl(0, 0%, 50%)",
    },
    absent: {
      label: "Absent",
      color: "hsl(0, 0%, 70%)",
    },
  } satisfies ChartConfig

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-base">Attendance Trends</CardTitle>
        <CardDescription className="text-gray-600">Last 30 days attendance pattern</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
              <XAxis
                dataKey="date"
                stroke="hsl(0, 0%, 50%)"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="hsl(0, 0%, 50%)" style={{ fontSize: "12px" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="present"
                stroke="hsl(0, 0%, 25%)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="late"
                stroke="hsl(0, 0%, 50%)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="absent"
                stroke="hsl(0, 0%, 70%)"
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
