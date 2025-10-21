"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { recentActivityData } from "./analytics-config"

const statusColors = {
  Present: "bg-slate-100 text-slate-800 border-slate-300",
  Late: "bg-slate-100 text-slate-700 border-slate-300",
  Absent: "bg-slate-200 text-slate-700 border-slate-400",
  Excused: "bg-slate-100 text-slate-700 border-slate-300",
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
