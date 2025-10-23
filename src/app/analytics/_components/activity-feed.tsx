"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { parseTimestamp } from "@/lib/timezone"

interface Activity {
  id: number
  time: string
  type: string
  employeeName: string
  employeeId: string
  department: string
  avatarUrl?: string | null
}

interface ActivityFeedProps {
  data: Activity[]
  loading?: boolean
}

function ActivityItem({ activity }: { activity: Activity }) {
  const profilePhotoUrl = useProfilePhotoUrl(activity.avatarUrl ?? undefined)
  const initials = activity.employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const formatEventType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Get badge style based on activity type
  const getBadgeStyle = (type: string) => {
    const typeUpper = type.toUpperCase()
    
    if (typeUpper.includes("CHECK_IN") || typeUpper.includes("CHECKIN")) {
      return "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-500/20"
    }
    if (typeUpper.includes("CHECK_OUT") || typeUpper.includes("CHECKOUT")) {
      return "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20"
    }
    if (typeUpper.includes("BREAK_IN") || typeUpper.includes("BREAKIN")) {
      return "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-500/20"
    }
    if (typeUpper.includes("BREAK_OUT") || typeUpper.includes("BREAKOUT")) {
      return "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20"
    }
    if (typeUpper.includes("LATE") || typeUpper.includes("TERLAMBAT")) {
      return "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20"
    }
    if (typeUpper.includes("EARLY")) {
      return "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20"
    }
    if (typeUpper.includes("ABSENT") || typeUpper.includes("TIDAK_HADIR")) {
      return "bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border border-gray-500/20"
    }
    if (typeUpper.includes("OVERTIME") || typeUpper.includes("LEMBUR")) {
      return "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20"
    }
    
    // Default
    return "bg-secondary text-secondary-foreground border border-border"
  }

  // Parse time from database and adjust for timezone offset if needed (handles old data)
  const activityTime = parseTimestamp(activity.time)
  
  // Calculate time string
  const timeStr = formatDistanceToNow(activityTime, { addSuffix: true })

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={profilePhotoUrl ?? undefined} alt={activity.employeeName} />
        <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {activity.employeeName || "Unknown"} <span className="text-xs text-muted-foreground font-normal">• {activity.department}</span>
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeStr}</span>
            </div>
          </div>
          <span className={`text-xs flex-shrink-0 px-2.5 py-1 rounded-md font-medium transition-colors ${getBadgeStyle(activity.type)}`}>
            {formatEventType(activity.type)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function ActivityFeed({ data, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Live attendance events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <div>
            <CardTitle className="text-xl">Recent Activities</CardTitle>
            <CardDescription className="mt-1">Live attendance events stream</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent activities
            </div>
          ) : (
            data.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
