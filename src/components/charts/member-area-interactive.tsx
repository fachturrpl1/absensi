"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import { IMemberAttendancePoint } from "@/interface"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useIsMobile } from "@/hooks/use-mobile"

type Props = {
  data: IMemberAttendancePoint[]
}

function computeAverageWorkDuration(data: IMemberAttendancePoint[]) {
  // compute average over days that have avg != null
  let sum = 0
  let count = 0
  data.forEach((d) => {
    if (d.averageWorkDurationMinutes != null) {
      sum += d.averageWorkDurationMinutes
      count += 1
    }
  })
  return count ? Math.round(sum / count) : null
}

function formatDateLabel(value: string) {
  const iso = value && value.length === 10 ? `${value}T00:00:00` : value
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function formatMonthTick(value: string) {
  const iso = value && value.length === 10 ? `${value}T00:00:00` : value
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: "short" })
}

export function MemberAreaInteractive({ data }: Props) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<"90d" | "30d" | "7d">("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange((prev) => (prev === "7d" ? prev : "7d"))
    }
  }, [isMobile])

  // Filter according to timeRange (data is expected ordered asc)
  const filtered = React.useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    return data.slice(-days)
  }, [data, timeRange])

  const avg = React.useMemo(() => computeAverageWorkDuration(filtered), [filtered])

  const chartData = React.useMemo(
    () =>
      filtered.map((d) => ({
        date: d.date,
        label: formatDateLabel(d.date),
        present: d.count || 0,
        avg: d.averageWorkDurationMinutes ?? null,
      })),
    [filtered],
  )

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 gap-1">
          <CardTitle>Daily Attendance</CardTitle>
          <CardDescription>Attendance activity sourced from Supabase data</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => val && setTimeRange(val as typeof timeRange)}
            variant="outline"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="90d">90 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-36 sm:hidden" size="sm" aria-label="Select range">
              <SelectValue placeholder="30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 90 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>Average work duration: <span className="font-semibold text-foreground">{avg != null ? `${avg} minutes` : '-'}</span></span>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Present</span>
          </span>
        </div>
        <ChartContainer config={{ present: { label: "Present" } }} className="aspect-auto h-[320px] w-full">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary, #2563eb)" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="var(--primary, #2563eb)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} opacity={0.08} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} tickFormatter={(v) => formatMonthTick(String(v))} />
              <ChartTooltip
                cursor={false}
                defaultIndex={isMobile ? -1 : Math.max(chartData.length - 1, 0)}
                content={<CustomTooltip />}
              />
              <Area
                dataKey="present"
                name="Present"
                type="natural"
                fill="url(#fillPresent)"
                stroke="var(--primary, #2563eb)"
                strokeWidth={2}
                fillOpacity={1}
                activeDot={{ r: 4 }}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const point = payload[0].payload || {}
  const dateLabel = point.label || point.date
  const present = Number(point.present ?? 0)
  const avg = point.avg != null ? `${point.avg} minutes` : "-"

  return (
    <ChartTooltipContent indicator="dot">
      <div className="bg-card border shadow-sm rounded px-3 py-2 text-xs">
        <div className="font-medium">{dateLabel}</div>
        <div className="text-muted-foreground">Present: <span className="font-semibold">{present}</span></div>
        <div className="text-muted-foreground">Average duration: <span className="font-semibold">{avg}</span></div>
      </div>
    </ChartTooltipContent>
  )
}

export default MemberAreaInteractive
