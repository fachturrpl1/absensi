import { TrendingUp, TrendingDown, Users, Clock, UserCheck, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { memo } from "react";
import { Progress } from "@/components/ui/progress";

// Small inline Skeleton component
function Skeleton({ className = "", style = {} }: { className?: string; style?: any }) {
  return <div className={`skeleton rounded-md ${className}`} style={style} />;
}

type DashboardData = {
  monthlyAttendance?: { currentMonth: number; previousMonth: number; percentChange: number }
  monthlyLate?: { currentMonth: number; previousMonth: number; percentChange: number }
  activeMembers?: { currentMonth: number; previousMonth: number; percentChange: number }
  activeRfid?: { currentMonth: number; previousMonth: number; percentChange: number }
} | undefined

interface SectionCardsProps {
  dashboardData: DashboardData
}

export const SectionCards = memo(function SectionCards({ dashboardData }: SectionCardsProps) {
  // Extract data from props instead of calling hooks
  const monthlyAttendance = dashboardData?.monthlyAttendance;
  const monthlyLate = dashboardData?.monthlyLate;
  const monthlyMembers = dashboardData?.activeMembers;
  const rfidStats = dashboardData?.activeRfid;

  const attendanceValue = monthlyAttendance?.currentMonth ?? null;
  const percent = monthlyAttendance?.percentChange ?? null;
  const trendPositive = percent !== null && percent > 0;

  const lateValue = monthlyLate?.currentMonth ?? null;
  const latePercent = monthlyLate?.percentChange ?? null;
  const lateTrendPositive = latePercent !== null && latePercent < 0;

  const memberValue = monthlyMembers?.currentMonth ?? null;
  const memberPercent = monthlyMembers?.percentChange ?? null;
  const memberTrendPositive = memberPercent !== null && memberPercent > 0;

  // Calculate progress percentages
  const attendanceProgress = monthlyAttendance?.previousMonth 
    ? Math.min(100, Math.round((attendanceValue || 0) / monthlyAttendance.previousMonth * 100))
    : 50;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <Card className="@container/card overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardAction>
              <Badge variant="outline" className="border-blue-200 dark:border-blue-800">
                {percent === null ? null : trendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {percent === null ? '—' : `${percent > 0 ? '+' : ''}${percent}%`}
              </Badge>
            </CardAction>
          </div>
          <CardDescription className="text-xs font-medium">Total Attendance</CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums @[250px]/card:text-4xl">
            {attendanceValue === null ? <Skeleton className="w-20 h-10" /> : attendanceValue.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 pt-0">
          <Progress value={attendanceProgress} className="h-2" />
          <div className="flex w-full items-center justify-between text-xs">
            <span className="text-muted-foreground">Last month: {monthlyAttendance?.previousMonth ?? '—'}</span>
            {percent !== null && (
              <span className={`font-medium ${trendPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trendPositive ? '↑' : '↓'} {Math.abs(percent)}%
              </span>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-background dark:to-amber-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <CardAction>
              <Badge variant="outline" className="border-amber-200 dark:border-amber-800">
                {latePercent === null ? null : lateTrendPositive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {latePercent === null ? '—' : `${latePercent > 0 ? '+' : ''}${latePercent}%`}
              </Badge>
            </CardAction>
          </div>
          <CardDescription className="text-xs font-medium">Late Arrivals</CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums @[250px]/card:text-4xl">
            {lateValue === null ? <Skeleton className="w-20 h-10" /> : lateValue.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 pt-0">
          <Progress value={lateValue && monthlyLate?.previousMonth ? Math.min(100, (lateValue / monthlyLate.previousMonth) * 100) : 0} className="h-2" />
          <div className="flex w-full items-center justify-between text-xs">
            <span className="text-muted-foreground">Last month: {monthlyLate?.previousMonth ?? '—'}</span>
            {latePercent !== null && (
              <span className={`font-medium ${lateTrendPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {lateTrendPositive ? '↓' : '↑'} {Math.abs(latePercent)}%
              </span>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 via-white to-green-50/30 dark:from-green-950/20 dark:via-background dark:to-green-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 dark:bg-green-500/20">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            {memberPercent !== null && memberPercent !== 0 && (
              <Badge variant="outline" className="border-green-200 dark:border-green-800">
                {memberTrendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {memberPercent > 0 ? '+' : ''}{memberPercent}%
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs font-medium">Active Members</CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums @[250px]/card:text-4xl">
            {memberValue === null ? <Skeleton className="w-20 h-10" /> : memberValue.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 pt-0">
          <div className="flex w-full items-center justify-between text-xs">
            <span className="text-muted-foreground">Active employees</span>
            {memberPercent !== null && memberPercent !== 0 && (
              <span className={`font-medium ${memberTrendPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {memberTrendPositive ? '↑' : '↓'} {Math.abs(memberPercent)}%
              </span>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-purple-950/20 dark:via-background dark:to-purple-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 dark:bg-purple-500/20">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <CardDescription className="text-xs font-medium">Active RFID Cards</CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums @[250px]/card:text-4xl">
            {rfidStats?.currentMonth === undefined ? <Skeleton className="w-20 h-10" /> : (rfidStats.currentMonth).toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 pt-0">
          <div className="flex w-full items-center justify-between text-xs">
            <span className="text-muted-foreground">Registered cards</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">Active</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
})
