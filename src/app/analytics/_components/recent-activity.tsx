"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { recentActivityData } from "./analytics-config"

const statusColors = {
  Present: "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20",
  Late: "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20",
  Absent: "bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-500/20",
  Excused: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20",
  "Early Leave": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20",
}

export function RecentActivity() {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <CardDescription>Latest check-ins and status updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentActivityData.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/30">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{activity.name}</span>
                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                    {activity.dept}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>{activity.time}</span>
                  <span>•</span>
                  <span className="text-xs">{activity.timestamp}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs font-medium ${statusColors[activity.status as keyof typeof statusColors]}`}
              >
                {activity.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
