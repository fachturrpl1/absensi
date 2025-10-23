"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { statusDistributionData } from "./analytics-config"

// Modern color palette for status distribution
// Green for Present, Red for Late, Gray for Absent, Blue for Excused
const COLORS = [
  "hsl(142, 71%, 45%)", // Green for Present
  "hsl(0, 84%, 60%)",   // Red for Late
  "hsl(215, 14%, 34%)", // Gray for Absent
  "hsl(221, 83%, 53%)", // Blue for Excused
]

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
