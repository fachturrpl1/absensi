"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface HourlyData {
  hour: string
  checkIn: number
  checkOut: number
}

interface HourlyHeatmapProps {
  data: HourlyData[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-semibold mb-1">{payload[0].payload.hour}</p>
        <div className="space-y-1">
          <p className="text-xs text-green-600 dark:text-green-400">
            Check In: <span className="font-semibold">{payload[0].value}</span>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Check Out: <span className="font-semibold">{payload[1].value}</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function HourlyHeatmap({ data, loading }: HourlyHeatmapProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hourly Check-In/Out Pattern</CardTitle>
          <CardDescription>Activity distribution over 24 hours (Last 7 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <div>
            <CardTitle className="text-xl">Hourly Check-In/Out Pattern</CardTitle>
            <CardDescription className="mt-1">Activity distribution over 24 hours (Last 7 days)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hour"
              className="text-xs"
              tick={{ fill: "currentColor" }}
              tickLine={{ stroke: "currentColor" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              tickLine={{ stroke: "currentColor" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Bar
              dataKey="checkIn"
              fill="hsl(142, 76%, 36%)"
              name="Check In"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Bar
              dataKey="checkOut"
              fill="hsl(221, 83%, 53%)"
              name="Check Out"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Line
              type="monotone"
              dataKey="checkIn"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
