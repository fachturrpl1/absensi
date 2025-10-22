"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StatusData {
  name: string
  value: number
  color: string
}

interface StatusPieChartProps {
  todayData: StatusData[]
  monthData: StatusData[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <p className="text-sm font-semibold">{data.name}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Count: <span className="font-semibold text-foreground">{data.value}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Percentage: <span className="font-semibold text-foreground">{data.percent?.toFixed(1)}%</span>
        </p>
      </div>
    )
  }
  return null
}

export function StatusPieChart({ todayData, monthData, loading }: StatusPieChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Attendance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  const renderCustomLabel = (entry: any) => {
    return `${entry.value}`
  }

  const ChartContent = ({ data }: { data: StatusData[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)

    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground truncate">{item.name}</span>
              <span className="font-semibold ml-auto">
                {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <div>
            <CardTitle className="text-xl">Status Distribution</CardTitle>
            <CardDescription className="mt-1">Attendance breakdown by status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="pt-4">
            {todayData.length > 0 ? (
              <ChartContent data={todayData} />
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
                No data available for today
              </div>
            )}
          </TabsContent>
          <TabsContent value="month" className="pt-4">
            {monthData.length > 0 ? (
              <ChartContent data={monthData} />
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
                No data available for this month
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
