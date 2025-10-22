"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

import { BarChart3, Users } from "lucide-react"

type DistributionCardsProps = {
  distribution?: any[]
  statusData?: any[]
}

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#10b981"]

export function DistributionCards({ distribution = [], statusData = [] }: DistributionCardsProps) {
  const chartConfig = {
    present: { label: "Present", color: "var(--chart-1)" },
    absent: { label: "Absent", color: "var(--chart-2)" },
    late: { label: "Late", color: "var(--chart-3)" },
    excused: { label: "Excused", color: "var(--chart-4)" },
  }

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs lg:grid-cols-3">
      {/* Bar Chart */}
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                Attendance Overview
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Today's attendance distribution</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="size-full">
          {distribution.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="h-80 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-present)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-80 items-center justify-center text-muted-foreground">No data available</div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-600 dark:text-gray-500">Updated just now</p>
        </CardFooter>
      </Card>

      {/* Pie Chart */}
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Status Breakdown
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Member distribution</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          {statusData && statusData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">No data</div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm" variant="outline" className="basis-1/2 border-gray-600 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            Export
          </Button>
          <Button size="sm" variant="outline" className="basis-1/2 border-gray-600 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
