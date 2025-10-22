"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useProfilePhotoUrl } from "@/hooks/use-profile"

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

  // Parse time - database returns timestamp with timezone already handled by Supabase
  // If time is in ISO format, new Date() will handle it correctly
  const activityTime = new Date(activity.time)
  
  // Calculate time string - if invalid or future time, there might be data issue
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
          <span className="text-xs flex-shrink-0 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">
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
