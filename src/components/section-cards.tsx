import { TrendingUp, TrendingDown } from "@/components/icons/lucide-exports";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { memo } from "react";

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

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Attendance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{attendanceValue === null ? <Skeleton className="w-20 h-8" /> : attendanceValue}</CardTitle>
          <CardAction>
            <Badge variant="outline">
              {percent === null ? null : trendPositive ? <TrendingUp /> : <TrendingDown />}
              {percent === null ? '—' : `${percent > 0 ? '+' : ''}${percent}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total attendance this month
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Last month: {monthlyAttendance?.previousMonth ?? '—'}</span>
            {percent !== null && (
              <Badge variant={trendPositive ? "secondary" : "destructive"} className="text-xs">
                {trendPositive ? <TrendingUp className="size-3 mr-1" /> : <TrendingDown className="size-3 mr-1" />}
                {percent > 0 ? '+' : ''}{percent}%
              </Badge>
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Late arrivals</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {lateValue === null ? <Skeleton className="w-20 h-8" /> : lateValue}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {latePercent === null ? null : lateTrendPositive ? <TrendingDown /> : <TrendingUp />}
              {latePercent === null ? '—' : `${latePercent > 0 ? '+' : ''}${latePercent}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total late arrivals this month
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Last month: {monthlyLate?.previousMonth ?? '—'}</span>
            {latePercent !== null && (
              <Badge variant={lateTrendPositive ? "secondary" : "destructive"} className="text-xs">
                {lateTrendPositive ? <TrendingDown className="size-3 mr-1" /> : <TrendingUp className="size-3 mr-1" />}
                {latePercent > 0 ? '+' : ''}{latePercent}%
              </Badge>
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active members</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {memberValue === null ? <Skeleton className="w-20 h-8" /> : memberValue}
          </CardTitle>          
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total active members this month
          </div>
          {/* footer intentionally left minimal */}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active RFID cards</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {rfidStats?.currentMonth ?? <Skeleton className="w-20 h-8" />}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total active RFID cards
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {/* intentionally hide Bulan lalu for RFID card */}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
})
