"use client"

import { memo } from "react"
import { Activity, CheckCircle, Clock, AlertCircle, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  memberName: string
  status: 'present' | 'late' | 'absent'
  checkInTime: string
  lateMinutes?: number
  department?: string
}

interface RecentActivityFeedProps {
  activities?: ActivityItem[]
  isLoading?: boolean
  limit?: number
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md animate-pulse bg-muted ${className}`} />
}

const statusConfig = {
  present: {
    icon: CheckCircle,
    label: 'On Time',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 dark:bg-green-500/20',
    badgeVariant: 'default' as const
  },
  late: {
    icon: Clock,
    label: 'Late',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeVariant: 'secondary' as const
  },
  absent: {
    icon: AlertCircle,
    label: 'Absent',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 dark:bg-red-500/20',
    badgeVariant: 'destructive' as const
  }
}

export const RecentActivityFeed = memo(function RecentActivityFeed({ 
  activities = [],
  isLoading = false,
  limit = 10
}: RecentActivityFeedProps) {
  const displayActivities = activities.slice(0, limit)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRelativeTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return timeString
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Recent Check-ins</CardTitle>
              <CardDescription className="text-xs">Live attendance activity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (displayActivities.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Recent Check-ins</CardTitle>
              <CardDescription className="text-xs">Live attendance activity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <User className="h-8 w-8 text-muted-foreground/40 mb-1.5" />
            <p className="text-xs text-muted-foreground font-medium">No recent activity</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Check-ins will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Recent Check-ins</CardTitle>
            <CardDescription className="text-xs">Live attendance activity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-200 via-indigo-300 to-transparent dark:from-indigo-900 dark:via-indigo-800" />
          
          <div className="space-y-0.5">
            {displayActivities.map((activity, index) => {
              const config = statusConfig[activity.status]
              const StatusIcon = config.icon
              const isLast = index === displayActivities.length - 1
              
              return (
                <div
                  key={activity.id}
                  className="relative pl-10 pr-2 py-2.5 rounded-lg hover:bg-accent/30 transition-colors group"
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-[13px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-2 border-background transition-all",
                    config.bgColor,
                    "group-hover:scale-125"
                  )}>
                    <div className={cn(
                      "absolute inset-0 rounded-full animate-ping opacity-75",
                      config.bgColor,
                      isLast && index < 3 ? "block" : "hidden"
                    )} />
                  </div>

                  <div className="flex items-start gap-2.5">
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 flex-shrink-0 border-2 border-background shadow-sm">
                      <AvatarFallback className={cn(config.bgColor, "text-xs font-medium")}>
                        {getInitials(activity.memberName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold truncate">
                          {activity.memberName}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] px-1.5 py-0 h-4 border-0 font-medium flex-shrink-0",
                            config.bgColor, 
                            config.color
                          )}
                        >
                          <StatusIcon className="h-2 w-2 mr-0.5" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className="truncate">{activity.department || 'No Department'}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {getRelativeTime(activity.checkInTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
