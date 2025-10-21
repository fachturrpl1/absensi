"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  name: string
  department: string
  status: "present" | "late" | "absent" | "excused"
  checkInTime?: string
  timestamp: string
}

interface RecentActivityLogProps {
  activities?: ActivityItem[]
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    name: "John Doe",
    department: "Engineering",
    status: "present",
    checkInTime: "08:15 AM",
    timestamp: "5m ago",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    department: "Sales",
    status: "late",
    checkInTime: "09:45 AM",
    timestamp: "12m ago",
  },
  {
    id: "3",
    name: "Mike Wilson",
    department: "HR",
    status: "present",
    checkInTime: "08:02 AM",
    timestamp: "28m ago",
  },
  {
    id: "4",
    name: "Emma Davis",
    department: "Finance",
    status: "absent",
    timestamp: "1h ago",
  },
  {
    id: "5",
    name: "Alex Brown",
    department: "Marketing",
    status: "excused",
    timestamp: "2h ago",
  },
]

const statusConfig = {
  present: {
    label: "Present",
    badgeClass: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
  },
  late: {
    label: "Late",
    badgeClass: "bg-slate-600 text-white dark:bg-slate-400 dark:text-slate-900",
  },
  absent: {
    label: "Absent",
    badgeClass: "bg-slate-400 text-white dark:bg-slate-500 dark:text-white",
  },
  excused: {
    label: "Excused",
    badgeClass: "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900",
  },
}

export function RecentActivityLog({
  activities = DEFAULT_ACTIVITIES,
}: RecentActivityLogProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>Latest attendance check-ins today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No activity yet
            </p>
          ) : (
            activities.map((activity) => {
              const config = statusConfig[activity.status]
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                        {activity.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {activity.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <div className="text-right">
                      {activity.checkInTime && (
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.checkInTime}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activity.timestamp}
                      </p>
                    </div>
                    <Badge className={cn("whitespace-nowrap", config.badgeClass)}>
                      {config.label}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
