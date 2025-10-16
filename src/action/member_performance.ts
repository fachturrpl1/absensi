"use server";
import { createClient } from "@/utils/supabase/server";

async function getSupabase() {
  return await createClient();
}

/**
 * Fetch basic performance metrics for a single organization_member
 * Returns counts for present/late/absent/excused, lastSeen (latest attendance_date),
 * average work_duration_minutes (where available) and recent 30-day summary.
 */
export const getMemberPerformance = async (memberId: string) => {
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
  const avgPromise = supabase
    .from("attendance_records")
    .select("work_duration_minutes")
    .eq("organization_member_id", memberId);

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

  const [counts, latestRes, avgRes, recentRes] = await Promise.all([
    countsPromise,
    latestPromise,
    avgPromise,
    recentPromise,
  ]);

  const countsMap: Record<string, number> = {};
  (counts || []).forEach((c: any) => (countsMap[c.status] = c.count || 0));

  let avg = 0;
  if (avgRes && avgRes.data && Array.isArray(avgRes.data)) {
    const vals = avgRes.data.map((r: any) => Number(r.work_duration_minutes || 0)).filter(Boolean);
    avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
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
      recent30: recent,
    },
  };
};
