"use client"

import { memo, useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { TrendingUp, Calendar } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface MonthlyTrendData {
  month: string
  attendance: number
  late: number
}

interface MonthlyTrendChartProps {
  data?: MonthlyTrendData[]
  isLoading?: boolean
}

const chartConfig = {
  attendance: {
    label: "Present",
    color: "hsl(var(--chart-1))",
  },
  late: {
    label: "Late",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export const MonthlyTrendChart = memo(function MonthlyTrendChart({ 
  data = [], 
  isLoading = false 
}: MonthlyTrendChartProps) {
  const trendData = useMemo(() => {
    if (!data || data.length === 0) {
      // Default placeholder data for last 6 months
      const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
      return months.map(month => ({
        month,
        attendance: 0,
        late: 0
      }))
    }
    return data
  }, [data])

  const trend = useMemo(() => {
    if (trendData.length < 2) return { direction: 'stable', percentage: 0 }
    const lastMonth = trendData[trendData.length - 1].attendance
    const previousMonth = trendData[trendData.length - 2].attendance
    
    if (previousMonth === 0) return { direction: 'up', percentage: 0 }
    
    const change = ((lastMonth - previousMonth) / previousMonth) * 100
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(Math.round(change))
    }
  }, [trendData])

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Monthly Attendance Trend
            </CardTitle>
            <CardDescription>Last 6 months attendance overview</CardDescription>
          </div>
          {trend.direction !== 'stable' && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`h-4 w-4 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
              {trend.percentage}% {trend.direction === 'up' ? 'increase' : 'decrease'}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full bg-muted animate-pulse rounded-lg" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorAttendance)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="late"
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#colorLate)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Attendance trends showing {trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'stable'} growth
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Data from the last 6 months
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
})
