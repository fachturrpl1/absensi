"use client"

import * as React from "react"
import { Area, AreaChart } from "recharts"

import { IMemberAttendancePoint } from "@/interface"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// eslint-disable-next-line
type SparklineDatum = {
  date: string;
  label: string;
  present: number;
}

function formatLabel(date: string): string {
  const iso = date && date.length === 10 ? `${date}T00:00:00` : date
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function MemberAttendanceSparkline({ data }: { data: IMemberAttendancePoint[] }) {
  const chartData = React.useMemo<SparklineDatum[]>(
    () =>
      data.map((item) => ({
        date: item.date,
        label: formatLabel(item.date),
        present: item.count ?? 0,
      })),
    [data],
  )

  if (!chartData.length) {
    return <div className="text-xs text-muted-foreground">No attendance data available.</div>
  }

  return (
    <ChartContainer
      config={{ present: { label: "Present", color: "var(--primary, #2563eb)" } }}
      className="h-24 w-full aspect-auto [&_.recharts-default-tooltip]:rounded-lg [&_.recharts-default-tooltip]:border [&_.recharts-default-tooltip]:bg-card"
    >
      <AreaChart data={chartData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparklinePresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-present)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-present)" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <ChartTooltip cursor={false} content={<SparklineTooltip />} />
        <Area
          type="monotone"
          dataKey="present"
          stroke="var(--color-present)"
          strokeWidth={1.5}
          fill="url(#sparklinePresent)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

function SparklineTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload as SparklineDatum

  return (
    <ChartTooltipContent indicator="dot">
      <div className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-foreground">{point.label}</span>
        <span className="text-muted-foreground">
          Present: <span className="font-semibold text-foreground">{point.present}</span>
        </span>
      </div>
    </ChartTooltipContent>
  )
}

export default MemberAttendanceSparkline
