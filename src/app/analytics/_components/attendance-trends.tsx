"use client"

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { attendanceTrendsData, attendanceTrendsConfig } from "./analytics-config"

export function AttendanceTrends() {
  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Attendance Trends</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Last 10 days overview</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={attendanceTrendsConfig} className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceTrendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 25%)" />
              <XAxis dataKey="date" stroke="hsl(0, 0%, 40%)" fontSize={12} />
              <YAxis stroke="hsl(0, 0%, 40%)" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" fill="hsl(186, 100%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" fill="hsl(38, 100%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="hsl(0, 100%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
