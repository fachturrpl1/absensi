"use client"

import { format, subMonths } from "date-fns"
import { Users, TrendingUp, TrendingDown, Clock } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

import {
  attendanceDistributionChartData,
  attendanceDistributionConfig,
  attendanceTrendData,
  attendanceTrendConfig,
} from "./analytics.config"

const lastMonth = format(subMonths(new Date(), 1), "LLLL")

type OverviewCardsProps = {
  totalMembers?: number
  todayAttendance?: number
  todayLate?: number
  attendanceRate?: number
}

export function OverviewCards({
  totalMembers = 183,
  todayAttendance = 145,
  todayLate = 18,
  attendanceRate = 79,
}: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Total Members Card */}
      <Card>
        <CardHeader>
          <CardTitle>Total Members</CardTitle>
          <CardDescription>Organization</CardDescription>
        </CardHeader>
        <CardContent className="size-full">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-semibold tabular-nums">{totalMembers}</span>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <span className="text-sm font-medium text-green-500">+5.2%</span>
        </CardFooter>
      </Card>

      {/* Present Today Card with Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Present Today</CardTitle>
          <CardDescription>Last Month</CardDescription>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer className="size-full min-h-24" config={attendanceDistributionConfig}>
            <BarChart accessibilityLayer data={attendanceDistributionChartData} barSize={8}>
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => `${lastMonth}: ${label}`} />} />
              <Bar dataKey="present" stackId="a" fill="var(--color-present)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xl font-semibold tabular-nums">{todayAttendance}</span>
          <span className="text-sm font-medium text-green-500">+12.5%</span>
        </CardFooter>
      </Card>

      {/* Late Arrivals Card with Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Late Arrivals</CardTitle>
          <CardDescription>Last Month</CardDescription>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer className="size-full min-h-24" config={attendanceDistributionConfig}>
            <BarChart accessibilityLayer data={attendanceDistributionChartData} barSize={8}>
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => `${lastMonth}: ${label}`} />} />
              <Bar dataKey="late" stackId="a" fill="var(--color-late)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xl font-semibold tabular-nums">{todayLate}</span>
          <span className="text-sm font-medium text-red-500">-2.5%</span>
        </CardFooter>
      </Card>

      {/* Attendance Rate Card */}
      <Card>
        <CardHeader>
          <div className="w-fit rounded-lg bg-blue-500/10 p-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between">
          <div className="space-y-1.5">
            <CardTitle>Attendance Rate</CardTitle>
            <CardDescription>This Month</CardDescription>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{attendanceRate}%</p>
          <div className="w-fit rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">+3.8%</div>
        </CardContent>
      </Card>

      {/* On-Time Rate Card */}
      <Card>
        <CardHeader>
          <div className="w-fit rounded-lg bg-emerald-500/10 p-2">
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between">
          <div className="space-y-1.5">
            <CardTitle>On-Time Rate</CardTitle>
            <CardDescription>This Month</CardDescription>
          </div>
          <p className="text-2xl font-semibold tabular-nums">92%</p>
          <div className="w-fit rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">+5.2%</div>
        </CardContent>
      </Card>

      {/* Attendance Trend Card */}
      <Card className="col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle>Attendance Trend</CardTitle>
          <CardDescription>Year to Date (YTD)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={attendanceTrendConfig} className="h-24 w-full">
            <AreaChart
              data={attendanceTrendData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="attendance"
                fill="var(--color-attendance)"
                fillOpacity={0.2}
                stroke="var(--color-attendance)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-sm">+14% growth since January</p>
        </CardFooter>
      </Card>
    </div>
  )
}
