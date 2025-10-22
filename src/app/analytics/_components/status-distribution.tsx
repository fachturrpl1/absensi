"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { statusDistributionData } from "./analytics-config"

const COLORS = ["hsl(186, 100%, 50%)", "hsl(0, 100%, 50%)", "hsl(38, 100%, 50%)", "hsl(220, 90%, 56%)"]

export function StatusDistribution() {
  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Status Distribution</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Today's attendance status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusDistributionData} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name}: ${percentage}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value} members`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
