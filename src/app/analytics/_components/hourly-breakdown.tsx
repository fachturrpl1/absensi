"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"

interface HourlyBreakdownProps {
  data?: Array<{
    hour: string
    count: number
  }>
}

const DEFAULT_HOURLY_DATA = [
  { hour: "08:00", count: 45 },
  { hour: "08:15", count: 52 },
  { hour: "08:30", count: 38 },
  { hour: "09:00", count: 32 },
  { hour: "09:30", count: 15 },
  { hour: "10:00", count: 8 },
  { hour: "10:30", count: 4 },
  { hour: "Late", count: 15 },
]

export function HourlyBreakdown({ data = DEFAULT_HOURLY_DATA }: HourlyBreakdownProps) {
  const chartConfig = {
    count: {
      label: "Check-ins",
      color: "hsl(0, 0%, 25%)",
    },
  } satisfies ChartConfig

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-base">Hourly Check-in Distribution</CardTitle>
        <CardDescription>Members checked in by time slot</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
              <XAxis
                dataKey="hour"
                stroke="hsl(0, 0%, 50%)"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="hsl(0, 0%, 50%)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(0, 0%, 85%)",
                  borderRadius: "6px",
                }}
                cursor={{ fill: "hsl(0, 0%, 95%)" }}
              />
              <Bar
                dataKey="count"
                fill="hsl(0, 0%, 25%)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
