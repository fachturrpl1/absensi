'use client'
import { Clock, Users, CheckCircle2, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface DashboardStats {
  totalPresent: number
  totalLate: number
  totalAbsent: number
  totalWorkHoursToday: number
  activeMembers: number
  onTimeRate: number
  avgWorkHours: number
}

interface Props {
  stats: DashboardStats
}

const EnhancedStatCard = ({
  title, value, icon: Icon, trend, trendValue, trendLabel, color = 'blue', delay = 0
}: {
  title: string
  value: string | number
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  trendLabel?: string
  color?: 'blue' | 'green' | 'orange' | 'purple'
  delay?: number
}) => {
  const iconColorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay, duration: 0.3 }} 
      className="h-full"
    >
      <Card className="h-full border-border bg-card hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColorClasses[color])}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 text-sm">
              {trend === 'up' && <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />}
              {trend === 'down' && <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />}
              {trend === 'neutral' && <Minus className="w-4 h-4 text-muted-foreground" />}
              <span className={cn(
                "font-semibold", 
                trend === 'up' && "text-green-600 dark:text-green-400", 
                trend === 'down' && "text-red-600 dark:text-red-400", 
                trend === 'neutral' && "text-muted-foreground"
              )}>
                {trendValue}
              </span>
              {trendLabel && <span className="text-muted-foreground text-xs ml-1">{trendLabel}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function StatsCards({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <EnhancedStatCard
        title="Total Work Hours"
        value={`${(stats.totalWorkHoursToday || 0).toFixed(1)}h`}
        icon={Clock}
        trend="up" 
        trendValue="+12%" 
        trendLabel="from last period"
        color="blue" 
        delay={0}
      />
      <EnhancedStatCard
        title="Active Members"
        value={stats.activeMembers || 0}
        icon={Users}
        trend="up" 
        trendValue="+5" 
        trendLabel="new this week"
        color="green" 
        delay={0.1}
      />
      <EnhancedStatCard
        title="On-Time Rate"
        value={`${(stats.onTimeRate || 0).toFixed(0)}%`}
        icon={CheckCircle2}
        trend="up" 
        trendValue="+8%" 
        trendLabel="improvement"
        color="purple" 
        delay={0.2}
      />
      <EnhancedStatCard
        title="Avg Hours/Member"
        value={`${(stats.avgWorkHours || 0).toFixed(1)}h`}
        icon={Activity}
        trend="neutral" 
        trendValue="0%" 
        trendLabel="no change"
        color="orange" 
        delay={0.3}
      />
    </div>
  )
}
