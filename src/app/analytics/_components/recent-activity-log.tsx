"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  name: string
  department: string
  status: "present" | "late" | "absent" | "excused" | "early_leave"
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
    badgeClass: "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-500/20",
  },
  late: {
    label: "Late",
    badgeClass: "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20",
  },
  absent: {
    label: "Absent",
    badgeClass: "bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border border-gray-500/20",
  },
  excused: {
    label: "Excused",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20",
  },
  early_leave: {
    label: "Early Leave",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20",
  },
}

export function RecentActivityLog({
  activities = DEFAULT_ACTIVITIES,
}: RecentActivityLogProps) {
  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <CardHeader>
        <CardTitle className="text-base text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Latest attendance check-ins today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-500 text-center py-8">
              No activity yet
            </p>
          ) : (
            activities.map((activity) => {
              const config = statusConfig[activity.status]
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                        {activity.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-500 truncate">
                        {activity.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <div className="text-right">
                      {activity.checkInTime && (
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.checkInTime}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-500">
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
