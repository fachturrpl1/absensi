"use client"

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { attendanceTrendsData, attendanceTrendsConfig } from "./analytics-config"

export function AttendanceTrends() {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Attendance Trends</CardTitle>
        <CardDescription>Last 10 days overview</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={attendanceTrendsConfig} className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceTrendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
              <XAxis dataKey="date" stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" fill="hsl(0, 0%, 20%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" fill="hsl(0, 0%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="hsl(0, 0%, 70%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
