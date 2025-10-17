"use server";
import { createClient } from "@/utils/supabase/server";
import { ApiResponse, IMemberPerformance } from "@/interface";

async function getSupabase() {
  return await createClient();
}

/**
 * Fetch basic performance metrics for a single organization_member
 * Returns counts for present/late/absent/excused, lastSeen (latest attendance_date),
 * average work_duration_minutes (where available) and recent 30-day summary.
 */
export const getMemberPerformance = async (memberId: string): Promise<ApiResponse<IMemberPerformance>> => {
  const supabase = await getSupabase();

  // basic aggregated counts
  const statuses = ["present", "late", "absent", "excused"];

  const countsPromise = Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("organization_member_id", memberId)
        .eq("status", status);

      if (error) {
        console.error("getMemberPerformance count error", error);
        return { status, count: 0 };
      }
      return { status, count: count || 0 };
    })
  );

  // latest attendance row
  const latestPromise = supabase
    .from("attendance_records")
    .select("*, organization_members(*)")
    .eq("organization_member_id", memberId)
    .order("attendance_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // avg work duration
  // compute average over the last 90 days as primary metric
  const since90Date = new Date();
  since90Date.setDate(since90Date.getDate() - 89); // include today => 90 days
  const since90 = since90Date.toISOString().split("T")[0];

  const avg90Promise = supabase
    .from("attendance_records")
    .select("work_duration_minutes")
    .eq("organization_member_id", memberId)
    .gte("attendance_date", since90);

  // recent 30 days count
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);
  const since = sinceDate.toISOString().split("T")[0];

  const recentPromise = supabase
    .from("attendance_records")
    .select("id,status,attendance_date,work_duration_minutes")
    .eq("organization_member_id", memberId)
    .gte("attendance_date", since)
    .order("attendance_date", { ascending: true });

  const [counts, latestRes, avg90Res, recentRes] = await Promise.all([
    countsPromise,
    latestPromise,
    avg90Promise,
    recentPromise,
  ]);

  const countsMap: Record<string, number> = {};
  (counts || []).forEach((c: any) => (countsMap[c.status] = c.count || 0));

  // average over last 90 days
  let avg = 0;
  if (avg90Res && avg90Res.data && Array.isArray(avg90Res.data)) {
    const vals = avg90Res.data
      .map((r: any) => Number(r.work_duration_minutes || 0))
      .filter((v) => Number.isFinite(v) && v > 0);
    avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }

  // compute average check-in and check-out times over the last 90 days
  // avg90Res currently only selected work_duration_minutes; fetch check-in/out instead
  const avgTimesRes = await supabase
    .from("attendance_records")
    .select("actual_check_in,actual_check_out,work_duration_minutes")
    .eq("organization_member_id", memberId)
    .gte("attendance_date", since90);

  let avgCheckInStr: string | null = null;
  let avgCheckOutStr: string | null = null;
  if (avgTimesRes && avgTimesRes.data && Array.isArray(avgTimesRes.data)) {
    const ins: number[] = []
    const outs: number[] = []
    const durations: number[] = []
    for (const r of avgTimesRes.data) {
      const ci = r.actual_check_in
      const co = r.actual_check_out
      const dur = Number(r.work_duration_minutes || 0)
      if (ci) {
        const t = Date.parse(ci)
        if (!isNaN(t)) ins.push(new Date(t).getHours() * 60 + new Date(t).getMinutes())
        else {
          // try parse time-only 'HH:MM:SS' or 'HH:MM'
          const m = String(ci).match(/(\d{1,2}):(\d{2})/)
          if (m) ins.push(Number(m[1]) * 60 + Number(m[2]))
        }
      }
      if (co) {
        const t2 = Date.parse(co)
        if (!isNaN(t2)) outs.push(new Date(t2).getHours() * 60 + new Date(t2).getMinutes())
        else {
          const m2 = String(co).match(/(\d{1,2}):(\d{2})/)
          if (m2) outs.push(Number(m2[1]) * 60 + Number(m2[2]))
        }
      }
      if (Number.isFinite(dur) && dur > 0) durations.push(dur)
    }

    const avgMinutes = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null)
    const avgIn = avgMinutes(ins)
    const avgOut = avgMinutes(outs)
    avgCheckInStr = avgIn != null ? `${String(Math.floor(avgIn / 60)).padStart(2, "0")}:${String(avgIn % 60).padStart(2, "0")}` : null
    avgCheckOutStr = avgOut != null ? `${String(Math.floor(avgOut / 60)).padStart(2, "0")}:${String(avgOut % 60).padStart(2, "0")}` : null

    // prefer previously computed avg for work duration if present; else compute from durations
    if (!avg && durations.length) {
      avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    }
  }

  const recent = recentRes && recentRes.data ? recentRes.data : [];

  return {
    success: true,
    data: {
      counts: {
        present: countsMap.present || 0,
        late: countsMap.late || 0,
        absent: countsMap.absent || 0,
        excused: countsMap.excused || 0,
      },
      lastSeen: latestRes && latestRes.data ? (latestRes.data as any).attendance_date : null,
  averageWorkDurationMinutes: avg,
  averageCheckInTime: avgCheckInStr,
  averageCheckOutTime: avgCheckOutStr,
      recent30: recent,
    },
  };
};
