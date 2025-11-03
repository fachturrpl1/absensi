"use client"

import { format, subMonths } from "date-fns"
import { Users, TrendingUp, Clock } from "lucide-react"
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
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Total Members</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Organization</CardDescription>
        </CardHeader>
        <CardContent className="size-full">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{totalMembers}</span>
            </div>
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
              <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">+5.2%</span>
        </CardFooter>
      </Card>

      {/* Present Today Card with Chart */}
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Present Today</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Last Month</CardDescription>
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
          <span className="text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{todayAttendance}</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">+12.5%</span>
        </CardFooter>
      </Card>

      {/* Late Arrivals Card with Chart */}
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Late Arrivals</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Last Month</CardDescription>
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
          <span className="text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{todayLate}</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">-2.5%</span>
        </CardFooter>
      </Card>

      {/* Attendance Rate Card */}
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <CardHeader>
          <div className="w-fit rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
            <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-gray-900 dark:text-gray-100">Attendance Rate</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">This Month</CardDescription>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{attendanceRate}%</p>
          <div className="w-fit rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">+3.8%</div>
        </CardContent>
      </Card>

      {/* On-Time Rate Card */}
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <CardHeader>
          <div className="w-fit rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-gray-900 dark:text-gray-100">On-Time Rate</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">This Month</CardDescription>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">92%</p>
          <div className="w-fit rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">+5.2%</div>
        </CardContent>
      </Card>

      {/* Attendance Trend Card */}
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Attendance Trend</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Year to Date (YTD)</CardDescription>
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
          <p className="text-gray-600 dark:text-gray-400 text-sm">+14% growth since January</p>
        </CardFooter>
      </Card>
    </div>
  )
}
