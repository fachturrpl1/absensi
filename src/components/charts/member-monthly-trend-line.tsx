"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  present: { label: "Present", color: "var(--primary, #2563eb)" },
  late: { label: "Late", color: "#f97316" },
  absent: { label: "Absent", color: "#dc2626" },
}

export type MemberMonthlyTrendPoint = {
  date: string
  label: string
  present: number
  late: number
  absent: number
}

export function MemberMonthlyTrendLine({ data }: { data: MemberMonthlyTrendPoint[] }) {
  const chartData = React.useMemo(() => data, [data])

  if (!chartData.length) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
        Monthly attendance trend is not available yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Monthly Attendance Trend</h3>
        <p className="text-sm text-muted-foreground">Comparison of present, late, and absent statuses by date.</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[320px] w-full">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--muted-foreground)/0.25)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="present"
            stroke="var(--color-present)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Present"
          />
          <Line
            type="monotone"
            dataKey="late"
            stroke="var(--color-late, #f97316)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Late"
          />
          <Line
            type="monotone"
            dataKey="absent"
            stroke="var(--color-absent, #dc2626)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Absent"
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

export default MemberMonthlyTrendLine
