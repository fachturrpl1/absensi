"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { hourlyCheckInData } from "./analytics-config"

export function HourlyCheckin() {
  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Check-in Distribution</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Members by check-in time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyCheckInData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 25%)" />
              <XAxis dataKey="hour" stroke="hsl(0, 0%, 40%)" fontSize={12} />
              <YAxis stroke="hsl(0, 0%, 40%)" fontSize={12} />
              <Tooltip formatter={(value: any) => `${value} members`} />
              <Bar dataKey="count" fill="hsl(186, 100%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
