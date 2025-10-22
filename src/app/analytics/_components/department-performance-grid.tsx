"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"

interface DepartmentData {
  name: string
  rate: number
  memberCount: number
}

interface DepartmentPerformanceGridProps {
  data: DepartmentData[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-semibold mb-2">{data.name}</p>
        <div className="space-y-1">
          <p className="text-xs">
            Attendance Rate: <span className="font-semibold">{data.rate}%</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {data.memberCount} members
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function DepartmentPerformanceGrid({ data, loading }: DepartmentPerformanceGridProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Attendance rate by department (Last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  const getColor = (rate: number) => {
    if (rate >= 90) return "hsl(142, 76%, 36%)"
    if (rate >= 75) return "hsl(45, 93%, 47%)"
    return "hsl(0, 72%, 51%)"
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <div>
            <CardTitle className="text-xl">Department Performance</CardTitle>
            <CardDescription className="mt-1">Attendance rate by department (Last 30 days)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} className="text-xs" />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              className="text-xs"
              tick={{ fill: "currentColor" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
