"use client"
import React from 'react'
import type { TooltipProps } from 'recharts'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { IMemberAttendancePoint } from '@/interface'
import { ShadcnChartTooltipContent } from '@/components/ui/shadcn-chart'

type ChartDatum = {
  date: IMemberAttendancePoint['date']
  iso: string
  short: string | IMemberAttendancePoint['date']
  present: number
  absent: number
  avg: number | null
}

function MemberTooltipContent({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0]?.payload as ChartDatum | undefined
  if (!data) return null

  const formattedDate = React.useMemo(() => {
    const dt = new Date(data.iso || data.date)
    return Number.isNaN(dt.getTime()) ? String(data.date) : dt.toLocaleDateString()
  }, [data.iso, data.date])

  return (
    <ShadcnChartTooltipContent>
      <div className="bg-card border shadow-sm rounded px-3 py-2 text-xs">
        <div className="font-medium">{formattedDate}</div>
        <div className="text-muted-foreground">
          Present: <span className="font-semibold">{data.present}</span>
        </div>
        <div className="text-muted-foreground">
          Absent: <span className="font-semibold">{data.absent}</span>
        </div>
        <div className="text-muted-foreground">
          Avg (min): <span className="font-semibold">{data.avg ?? '-'}</span>
        </div>
      </div>
    </ShadcnChartTooltipContent>
  )
}

export default function MemberAreaChart({ data }: { data: IMemberAttendancePoint[] }) {
  // map data to chart-friendly format (date label)
  const chartData: ChartDatum[] = data.map((d) => {
    // ensure we parse YYYY-MM-DD safely by appending T00:00:00 to avoid timezone parsing issues
    const iso = typeof d.date === 'string' && d.date.length === 10 ? `${d.date}T00:00:00` : String(d.date)
    const dt = new Date(iso)
    const short = !isNaN(dt.getTime())
      ? dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : d.date

    // present = number of attendance records for that day
    const present = Number(d.count || 0)
    // absent: if there were no attendance records, mark as 1 (absent), otherwise 0
    const absent = present === 0 ? 1 : 0

    return {
      date: d.date,
      iso: iso,
      short,
      present,
      absent,
      avg: d.averageWorkDurationMinutes ?? null,
    }
  })

  // Prefer theme tokens when available; these vars are used by shadcn themes
  const colorPrimary = 'var(--primary, #2563eb)'
  const colorDesktop = 'var(--color-desktop, ' + colorPrimary + ')'

  return (
    <div className="aspect-auto h-[250px] w-full">
      <ResponsiveContainer>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorDesktop} stopOpacity={0.95} />
              <stop offset="95%" stopColor={colorDesktop} stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} opacity={0.06} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
            tickFormatter={(value: string) => {
              // value expected as YYYY-MM-DD
              const iso = value && value.length === 10 ? `${value}T00:00:00` : value
              const d = new Date(iso)
              if (isNaN(d.getTime())) return value
              return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            }}
          />
          <Tooltip cursor={false} content={<MemberTooltipContent />} />
          <Area
            dataKey="present"
            name="Present"
            type="natural"
            fill="url(#fillValue)"
            stroke={colorDesktop}
            fillOpacity={1}
            activeDot={{ r: 4 }}
          />
          <Area
            dataKey="absent"
            name="Absent"
            type="monotone"
            fill="rgba(220,38,38,0.08)"
            stroke="rgba(220,38,38,0.9)"
            strokeDasharray="3 3"
            fillOpacity={0.6}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
