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

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return timeString
    }
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
      return formatTime(timeString)
    } catch {
      return formatTime(timeString)
    }
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20">
            <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>Live attendance activity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : displayActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">Check-ins will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-4">
              {displayActivities.map((activity, index) => {
                const config = statusConfig[activity.status]
                const StatusIcon = config.icon
                
                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
                      "animate-in fade-in slide-in-from-bottom-2",
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={config.bgColor}>
                        {getInitials(activity.memberName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.memberName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{activity.department || 'No Department'}</span>
                        <span>•</span>
                        <span>{getRelativeTime(activity.checkInTime)}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs border-0", config.bgColor, config.color)}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      {activity.status === 'late' && activity.lateMinutes && (
                        <span className="text-xs text-muted-foreground">
                          +{activity.lateMinutes}min
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
})
