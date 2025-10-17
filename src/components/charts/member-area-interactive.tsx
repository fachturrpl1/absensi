"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { IMemberAttendancePoint } from "@/interface"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"

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

function monthLabelFromDate(value: string) {
  // value expected YYYY-MM-DD
  const iso = value && value.length === 10 ? `${value}T00:00:00` : value
  const d = new Date(iso)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short' })
}

export function MemberAreaInteractive({ data }: Props) {
  const [timeRange, setTimeRange] = React.useState<'30d'|'90d'|'7d'>('30d')

  const avg = React.useMemo(() => computeAverageWorkDuration(data), [data])

  // Filter according to timeRange (data is expected ordered asc)
  const filtered = React.useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const copy = [...data]
    return copy.slice(-days)
  }, [data, timeRange])

  const chartData = filtered.map((d) => ({
    date: d.date,
    month: monthLabelFromDate(d.date),
    present: d.count || 0,
    absent: d.count ? 0 : 1,
    avg: d.averageWorkDurationMinutes ?? null,
  }))

  return (
    <Card>
      <CardHeader>
        <div className="grid flex-1 gap-1">
          <CardTitle>Area Chart - Interactive</CardTitle>
          <CardDescription>Showing attendance for the selected range</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <SelectTrigger className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex" aria-label="Select a value">
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
            <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
            <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="text-sm text-muted-foreground mb-3">Avg Work Duration: {avg ?? '-'}</div>
        <ChartContainer config={{ present: { label: 'Present' }, absent: { label: 'Absent' } }} className="aspect-auto h-[280px] w-full">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary, #2563eb)" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="var(--primary, #2563eb)" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="fillAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(220,38,38,0.9)" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="rgba(220,38,38,0.9)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} opacity={0.06} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tickFormatter={(v) => monthLabelFromDate(String(v))} />
              {/* Custom tooltip shows date, present, absent, and avg (from payload) */}
              <ChartTooltip
                cursor={false}
                content={<CustomTooltip />}
              />
              <Area dataKey="absent" name="Absent" type="monotone" fill="url(#fillAbsent)" stroke="rgba(220,38,38,0.9)" fillOpacity={0.6} />
              <Area dataKey="present" name="Present" type="natural" fill="url(#fillPresent)" stroke="var(--primary, #2563eb)" fillOpacity={1} activeDot={{ r: 4 }} />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) return null

    const point = payload[0].payload || {}
    const dateLabel = (() => {
      try {
        const d = new Date(point.date || label)
        if (isNaN(d.getTime())) return String(point.date || label)
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      } catch {
        return String(point.date || label)
      }
    })()

    const present = Number(point.present ?? 0)
    const absent = Number(point.absent ?? 0)
    const avg = point.avg != null ? String(point.avg) : '-'

    return (
      <ChartTooltipContent indicator="dot">
        <div className="bg-card border shadow-sm rounded px-3 py-2 text-xs">
          <div className="font-medium">{dateLabel}</div>
          <div className="text-muted-foreground">Present: <span className="font-semibold">{present}</span></div>
          <div className="text-muted-foreground">Absent: <span className="font-semibold">{absent}</span></div>
          <div className="text-muted-foreground">Avg (min): <span className="font-semibold">{avg}</span></div>
        </div>
      </ChartTooltipContent>
    )
  }

export default MemberAreaInteractive
