"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { hourlyCheckInData } from "./analytics-config"

export function HourlyCheckin() {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Check-in Distribution</CardTitle>
        <CardDescription>Members by check-in time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyCheckInData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
              <XAxis dataKey="hour" stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <Tooltip formatter={(value: any) => `${value} members`} />
              <Bar dataKey="count" fill="hsl(0, 0%, 30%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
