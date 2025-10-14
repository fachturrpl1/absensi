import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "@/components/icons/lucide-exports";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Small inline Skeleton component
function Skeleton({ className = "", style = {} }: { className?: string; style?: any }) {
  return <div className={`skeleton rounded-md ${className}`} style={style} />;
}

type MonthlyStats = {
  currentMonth: number;
  previousMonth: number;
  percentChange: number;
} | null;

export function SectionCards({ monthlyAttendance }: { monthlyAttendance?: MonthlyStats }) {
  // local state so the component can fetch its own data if the parent didn't pass monthlyAttendance
  const [localMonthlyAttendance, setLocalMonthlyAttendance] = useState<MonthlyStats>(monthlyAttendance ?? null);
  const [monthlyLate, setMonthlyLate] = useState<MonthlyStats>(null);
  const [monthlyMembers, setMonthlyMembers] = useState<MonthlyStats>(null);
  
  useEffect(() => {
    // keep localMonthlyAttendance in sync with prop if parent provides it later
    if (monthlyAttendance) setLocalMonthlyAttendance(monthlyAttendance);

    async function fetchLateStats() {
      try {
        const res = await fetch('/api/dashboard/monthly-late', { credentials: 'same-origin' });
        const json = await res.json();
        console.debug('[SectionCards] /api/dashboard/monthly-late response', json);
        if (json && json.success && json.data) {
          setMonthlyLate(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch monthly late stats:', err);
      }
    }
    
    async function fetchMemberStats() {
      try {
        const res = await fetch('/api/dashboard/active-members', { credentials: 'same-origin' });
        const json = await res.json();
        console.debug('[SectionCards] /api/dashboard/active-members response', json);
        if (json && json.success && json.data) {
          setMonthlyMembers(json.data);
        } else {
          // single retry in case of transient auth/cookie race
          console.debug('[SectionCards] retrying /api/dashboard/active-members');
          const res2 = await fetch('/api/dashboard/active-members', { credentials: 'same-origin' });
          const json2 = await res2.json();
          console.debug('[SectionCards] /api/dashboard/active-members retry response', json2);
          if (json2 && json2.success && json2.data) setMonthlyMembers(json2.data);
        }
      } catch (err) {
        console.error('Failed to fetch active members stats:', err);
      }
    }
    fetchLateStats();
    fetchMemberStats();

    // If parent did not provide monthlyAttendance prop, fetch it here
    async function fetchMonthlyAttendance() {
      if (monthlyAttendance) return; // parent provided it
      try {
        const res = await fetch('/api/dashboard/monthly', { credentials: 'same-origin' });
        const json = await res.json();
        console.debug('[SectionCards] /api/dashboard/monthly response', json);
        if (json && json.success && json.data) {
          setLocalMonthlyAttendance(json.data);
        } else {
          console.error('SectionCards: /api/dashboard/monthly returned no data', json);
          // retry once
          console.debug('[SectionCards] retrying /api/dashboard/monthly');
          const res2 = await fetch('/api/dashboard/monthly', { credentials: 'same-origin' });
          const json2 = await res2.json();
          console.debug('[SectionCards] /api/dashboard/monthly retry response', json2);
          if (json2 && json2.success && json2.data) setLocalMonthlyAttendance(json2.data);
        }
      } catch (err) {
        console.error('SectionCards: failed to fetch monthly attendance', err);
      }
    }

    fetchMonthlyAttendance();

    // fetch active RFID stats
    async function fetchRfidStats() {
      try {
        const res = await fetch('/api/dashboard/active-rfid', { credentials: 'same-origin' });
        const json = await res.json();
        console.debug('[SectionCards] /api/dashboard/active-rfid response', json);
        if (json && json.success && json.data) {
          setRfidStats(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch RFID stats:', err);
      }
    }

    fetchRfidStats();
  }, []);

  const attendanceValue = localMonthlyAttendance ? localMonthlyAttendance.currentMonth : null;
  const percent = localMonthlyAttendance ? localMonthlyAttendance.percentChange : null;
  const trendPositive = percent !== null && percent > 0;

  const lateValue = monthlyLate ? monthlyLate.currentMonth : null;
  const latePercent = monthlyLate ? monthlyLate.percentChange : null;
  const lateTrendPositive = latePercent !== null && latePercent < 0; // Note: For lates, negative trend is positive

  const memberValue = monthlyMembers ? monthlyMembers.currentMonth : null;
  const memberPercent = monthlyMembers ? monthlyMembers.percentChange : null;
  const memberTrendPositive = memberPercent !== null && memberPercent > 0;
  const [rfidStats, setRfidStats] = useState<MonthlyStats | null>(null);

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
            Total kehadiran bulan ini
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Bulan lalu: {localMonthlyAttendance?.previousMonth ?? '—'}</span>
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
          <CardDescription>Keterlambatan</CardDescription>
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
            Total keterlambatan bulan ini
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Bulan lalu: {monthlyLate?.previousMonth ?? '—'}</span>
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
          <CardDescription>Member Aktif</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {memberValue === null ? <Skeleton className="w-20 h-8" /> : memberValue}
          </CardTitle>          
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total member aktif bulan ini
          </div>
          {/* footer intentionally left minimal */}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Kartu RFID Aktif</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {rfidStats ? rfidStats.currentMonth : <Skeleton className="w-20 h-8" />}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total kartu RFID aktif
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {/* intentionally hide Bulan lalu for RFID card */}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
