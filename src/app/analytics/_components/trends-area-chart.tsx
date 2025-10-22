"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface TrendData {
  date: string
  present: number
  late: number
  absent: number
  leave: number
}

interface TrendsAreaChartProps {
  data: TrendData[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, p: any) => sum + p.value, 0)
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any) => (
            <p key={p.dataKey} className="text-xs flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="capitalize">{p.dataKey}:</span>
              <span className="font-semibold">{p.value}</span>
            </p>
          ))}
          <p className="text-xs font-semibold pt-1 border-t mt-1">
            Total: {total}
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function TrendsAreaChart({ data, loading }: TrendsAreaChartProps) {
  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>30-Day Attendance Trends</CardTitle>
          <CardDescription>Historical attendance patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <div>
            <CardTitle className="text-xl">30-Day Attendance Trends</CardTitle>
            <CardDescription className="mt-1">Historical attendance patterns and anomalies</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "currentColor" }}
            />
            <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: "10px" }} />
            <Area
              type="monotone"
              dataKey="present"
              stackId="1"
              stroke="hsl(142, 76%, 36%)"
              fill="url(#colorPresent)"
              name="Present"
            />
            <Area
              type="monotone"
              dataKey="late"
              stackId="1"
              stroke="hsl(45, 93%, 47%)"
              fill="url(#colorLate)"
              name="Late"
            />
            <Area
              type="monotone"
              dataKey="leave"
              stackId="1"
              stroke="hsl(262, 83%, 58%)"
              fill="url(#colorLeave)"
              name="Leave"
            />
            <Area
              type="monotone"
              dataKey="absent"
              stackId="1"
              stroke="hsl(0, 72%, 51%)"
              fill="url(#colorAbsent)"
              name="Absent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
