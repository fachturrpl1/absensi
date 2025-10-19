"use client"

import * as React from "react"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, type TooltipProps } from "recharts"

import type { IMemberPerformance } from "@/interface"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const STATUS_CONFIG = [
  { key: "present", label: "Present" },
  { key: "late", label: "Late" },
  { key: "absent", label: "Absent" },
  { key: "excused", label: "Excused" },
] as const

const STATUS_COLORS: Record<(typeof STATUS_CONFIG)[number]["key"], string> = {
  present: "var(--chart-1)",
  late: "var(--chart-3)",
  absent: "var(--chart-4)",
  excused: "var(--chart-2)",
}

const chartConfig = {
  value: { label: "Total", color: "var(--primary)" },
} satisfies ChartConfig

type MemberPerformanceRadarProps = {
  performance: IMemberPerformance
}

type ChartDatum = {
  statusKey: (typeof STATUS_CONFIG)[number]["key"]
  status: string
  value: number
  share: number
}

export default function MemberPerformanceRadar({ performance }: MemberPerformanceRadarProps) {
  const chartData = React.useMemo<ChartDatum[]>(() => {
    const total = STATUS_CONFIG.reduce((acc, item) => acc + (performance.counts?.[item.key] ?? 0), 0)

    return STATUS_CONFIG.map(({ key, label }) => {
      const value = performance.counts?.[key] ?? 0
      const share = total > 0 ? (value / total) * 100 : 0

      return {
        statusKey: key,
        status: label,
        value,
        share,
      }
    })
  }, [performance.counts])

  const total = React.useMemo(() => chartData.reduce((acc, item) => acc + item.value, 0), [chartData])
  const maxValue = React.useMemo(() => Math.max(...chartData.map((item) => item.value), 1), [chartData])

  if (!total) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/60 bg-card/60 px-6 py-10 text-center text-sm text-muted-foreground">
        <div className="text-lg font-semibold text-foreground">Performance data unavailable</div>
        <p className="max-w-sm text-muted-foreground">
          Radar insights will appear once this member has valid attendance records.
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-6 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Performance Snapshot</p>
          <h2 className="text-2xl font-semibold text-foreground">Attendance Radar</h2>
        </div>
        <div className="rounded-full border border-border/50 px-4 py-2 text-right text-xs">
          <p className="uppercase tracking-[0.2em] text-muted-foreground">Total Attendance</p>
          <p className="text-lg font-semibold text-foreground">{total.toLocaleString()}</p>
        </div>
      </header>

      <div className="space-y-6 rounded-3xl border border-border/60 bg-card/80 p-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <RadarChart accessibilityLayer data={chartData} outerRadius="70%" margin={{ top: 8, right: 24, bottom: 32, left: 24 }}>
            <defs>
              <radialGradient id="memberRadarGlow" cx="50%" cy="50%" r="60%">
                <stop offset="20%" stopColor="var(--color-value)" stopOpacity={0.45} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.08} />
              </radialGradient>
            </defs>
            <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.25} radialLines={false} />
            <PolarAngleAxis
              dataKey="status"
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}
            />
            <PolarRadiusAxis
              domain={[0, maxValue]}
              stroke="transparent"
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickCount={4}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--color-value)", strokeDasharray: "6 4", strokeOpacity: 0.35 }}
              content={<MemberRadarTooltip />}
            />
            <Radar
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2.5}
              fill="url(#memberRadarGlow)"
              fillOpacity={1}
              dot={{ r: 3, stroke: "var(--color-value)", strokeWidth: 1, fill: "var(--background)" }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </RadarChart>
        </ChartContainer>

        <StatusLegend data={chartData} />
      </div>

      <StatusSummary data={chartData} total={total} />
    </section>
  )
}

function MemberRadarTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) {
    return null
  }

  const entry = payload[0]?.payload as ChartDatum | undefined

  if (!entry) {
    return null
  }

  return (
    <ChartTooltipContent indicator="line" className="min-w-[11rem]">
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{entry.status}</p>
        <p className="text-muted-foreground">
          Count: <span className="font-semibold text-foreground">{entry.value.toLocaleString()}</span>
        </p>
        <p className="text-muted-foreground">
          Share: <span className="font-semibold text-foreground">{entry.share.toFixed(1)}%</span>
        </p>
      </div>
    </ChartTooltipContent>
  )
}

function StatusLegend({ data }: { data: ChartDatum[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
      {data.map((item) => (
        <div key={item.statusKey} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.statusKey] }} />
          <span className="font-medium text-foreground">{item.status}</span>
          <span className="text-xs text-muted-foreground">{item.share.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

function StatusSummary({ data, total }: { data: ChartDatum[]; total: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((item) => {
        const width = Math.max(item.share, 6)

        return (
          <div key={item.statusKey} className="space-y-3 rounded-2xl border border-border/50 bg-card/80 p-4 text-center shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="size-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.statusKey] }} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">{item.status}</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{item.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{item.share.toFixed(1)}% of total</p>
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: STATUS_COLORS[item.statusKey] }} />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {Math.round((item.value / total) * 1000) / 10}‰
            </p>
          </div>
        )
      })}
    </div>
  )
}
