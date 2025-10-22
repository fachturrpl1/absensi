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
      color: "hsl(186, 100%, 50%)",
    },
    target: {
      label: "Target Rate",
      color: "hsl(0, 0%, 70%)",
    },
  } satisfies ChartConfig

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <CardHeader>
        <CardTitle className="text-base text-gray-900 dark:text-gray-100">Department Performance</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Attendance vs Target by department</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 25%)" />
              <XAxis
                dataKey="name"
                stroke="hsl(0, 0%, 40%)"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="hsl(0, 0%, 40%)" style={{ fontSize: "12px" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                dataKey="attendance"
                fill="hsl(186, 100%, 50%)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="target"
                fill="hsl(0, 0%, 70%)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
