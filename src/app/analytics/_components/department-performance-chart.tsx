"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"

interface DepartmentPerformanceChartProps {
  data: Array<{
    name: string
    attendance: number
    target: number
  }>
}

export function DepartmentPerformanceChart({
  data,
}: DepartmentPerformanceChartProps) {
  const chartConfig = {
    attendance: {
      label: "Attendance Rate",
      color: "hsl(0, 0%, 25%)",
    },
    target: {
      label: "Target Rate",
      color: "hsl(0, 0%, 80%)",
    },
  } satisfies ChartConfig

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-base">Department Performance</CardTitle>
        <CardDescription>Attendance vs Target by department</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
              <XAxis
                dataKey="name"
                stroke="hsl(0, 0%, 50%)"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="hsl(0, 0%, 50%)" style={{ fontSize: "12px" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                dataKey="attendance"
                fill="hsl(0, 0%, 25%)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="target"
                fill="hsl(0, 0%, 80%)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
