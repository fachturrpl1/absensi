"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

import { attendanceLogger } from '@/lib/logger';
import { getJSON, setJSON, delByPrefix } from '@/lib/cache';
async function getSupabase() {
  return await createClient();
}

export type GetAttendanceParams = {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: string;
  department?: string;
  organizationId?: number;  // Add organization ID parameter
};

export type GetAttendanceResult = {
  success: boolean;
  data: any[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
};

export const getAllAttendance = async (params: GetAttendanceParams = {}): Promise<GetAttendanceResult> => {
  const supabase = await getSupabase();
  
  const {
    page = 1,
    limit = 10,
    dateFrom,
    dateTo,
    search,
    status,
    organizationId  // Get organization ID from params
  } = params;

  // Get current user's organization
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    attendanceLogger.error("❌ User not authenticated");
    return { success: false, data: [], message: "User not authenticated" };
  }

  // Get user's organization membership
  // Note: User might be registered in multiple organizations
  let query_org = supabase
    .from("organization_members")
    .select("organization_id, id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  // If organizationId is provided, filter by it
  if (organizationId) {
    query_org = query_org.eq("organization_id", organizationId);
  }

  const { data: userMembers, error: memberError } = await query_org.limit(1);
  const userMember = userMembers?.[0];

  if (memberError) {
    attendanceLogger.error("❌ Member query error:", memberError);
    return { success: false, data: [], message: memberError.message || "Member query error" };
  }

  if (!userMember || !userMembers || userMembers.length === 0) {
    attendanceLogger.error("❌ User not in any active organization");
    return { success: false, data: [], message: "User not registered in any active organization" };
  }

  attendanceLogger.info("✅ User organization found:", userMember.organization_id);
  attendanceLogger.info("📍 Total organizations:", userMembers?.length || 0);

  // Cache key per organisasi + filter
  const cacheKey = [
    'attendance:list',
    String(userMember.organization_id),
    `p=${page}`,
    `l=${limit}`,
    `from=${dateFrom || ''}`,
    `to=${dateTo || ''}`,
    `status=${status || 'all'}`,
    `q=${(search || '').trim().toLowerCase()}`,
  ].join(':');

  // Try cache first
  const cached = await getJSON<GetAttendanceResult>(cacheKey);
  if (cached && cached.success) {
    attendanceLogger.debug(`🗄️ Cache hit: ${cacheKey}`);
    return cached;
  }

  // Helper to apply filters to a query (no heavy joins)
  const applyFilters = (q: any) => {
    let query = q.eq("organization_id", userMember.organization_id);
    if (dateFrom) query = query.gte("attendance_date", dateFrom);
    if (dateTo) query = query.lte("attendance_date", dateTo);
    if (status && status !== 'all') query = query.eq("status", status);
    return query;
  };

  // Compute count with a lightweight head count (planned)
  const { count: totalCount, error: countError } = await applyFilters(
    supabase.from("attendance_records").select("id", { count: 'planned', head: true })
  );
  if (countError) {
    attendanceLogger.error("❌ Count error:", countError);
  }

  // Fetch page data without joins
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data: rows, error: dataError } = await applyFilters(
    supabase
      .from("attendance_records")
      .select(`
        id,
        organization_member_id,
        organization_id,
        attendance_date,
        actual_check_in,
        actual_check_out,
        status,
        created_at,
        work_duration_minutes,
        remarks,
        check_in_device_id,
        check_out_device_id
      `)
      .order("attendance_date", { ascending: false })
      .order("actual_check_in", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false })
      .range(from, to)
  );

  if (dataError) {
    attendanceLogger.error("❌ Error fetching attendance:", dataError);
    attendanceLogger.error("Organization ID:", userMember.organization_id);
    return { success: false, data: [], message: `Query error: ${dataError.message}` };
  }

  attendanceLogger.info("✅ Attendance records fetched:", rows?.length || 0);

  // Fetch organization info (timezone, time_format) once
  const { data: orgInfo } = await supabase
    .from('organizations')
    .select('id, timezone, time_format')
    .eq('id', userMember.organization_id)
    .maybeSingle();

  // Fetch member details in bulk for current page
  const memberIds = Array.from(new Set((rows || []).map((r: any) => r.organization_member_id).filter(Boolean)));
  const memberMap = new Map<number, any>();
  if (memberIds.length > 0) {
    const { data: membersData } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_profiles(
          first_name,
          last_name,
          display_name,
          email,
          profile_photo_url
        ),
        departments(name)
      `)
      .in('id', memberIds);
    for (const m of (membersData || []) as any[]) {
      memberMap.set(m.id, m);
    }
  }

  // Transform format
  const mapped = (rows || []).map((item: any) => {
    const member = memberMap.get(item.organization_member_id) || {};
    const profile = member?.user_profiles || {};
    const displayName = (profile?.display_name || '').trim();
    const firstName = profile?.first_name || '';
    const lastName = profile?.last_name || '';
    const email = (profile?.email || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const effectiveName = displayName || fullName || email;
    const departmentName = member?.departments?.name || '';

    return {
      id: item.id,
      member: {
        id: item.organization_member_id,
        name: effectiveName || `Member #${item.organization_member_id}`,
        avatar: profile?.profile_photo_url,
        position: '',
        department: departmentName,
      },
      date: item.attendance_date,
      checkIn: item.actual_check_in,
      checkOut: item.actual_check_out,
      workHours: item.work_duration_minutes
        ? `${Math.floor(item.work_duration_minutes / 60)}h ${item.work_duration_minutes % 60}m`
        : (item.actual_check_in ? '-' : '-'),
      status: item.status,
      checkInDeviceId: item.check_in_device_id || null,
      checkOutDeviceId: item.check_out_device_id || null,
      checkInLocationName: null,
      checkOutLocationName: null,
      notes: item.remarks || '',
      timezone: orgInfo?.timezone || "Asia/Jakarta",
      time_format: orgInfo?.time_format || "24h",
    };
  });

  attendanceLogger.info("✅ Attendance data transformed:", mapped.length);
  attendanceLogger.debug("📊 Sample mapped data:", mapped[0]);

  const total = typeof totalCount === 'number' ? totalCount : 0;
  const result: GetAttendanceResult = {
    success: true,
    data: mapped,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  // Save to cache (TTL 60s)
  await setJSON(cacheKey, result, 60);
  attendanceLogger.debug(`🗄️ Cache set: ${cacheKey}`);
  return result;
};

export async function updateAttendanceStatus(id: string, status: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("attendance_records")
    .update({ status })
    .eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

type ManualAttendancePayload = {
  organization_member_id: string;
  attendance_date: string;
  actual_check_in: string;
  actual_check_out: string | null;
  status: string;
  remarks?: string;
};

export async function checkExistingAttendance(
  organization_member_id: string,
  attendance_date: string
) {
  try {
    const supabase = await getSupabase();
    
    // Ensure organization_member_id is a number
    const memberId = Number(organization_member_id);
    if (isNaN(memberId)) {
      attendanceLogger.error("❌ Invalid organization_member_id:", organization_member_id);
      return { success: false, exists: false };
    }

    // Log for debugging
    attendanceLogger.debug(`🔍 Checking attendance for member ${memberId} on ${attendance_date}`);

    const { data, error } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("organization_member_id", memberId)
      .eq("attendance_date", attendance_date)
      .maybeSingle();

    if (error) {
      attendanceLogger.error("❌ Error checking attendance:", error);
      return { success: false, exists: false };
    }

    const exists = !!data;
    attendanceLogger.debug(`✓ Attendance check result: exists=${exists}`);
    return { success: true, exists };
  } catch (err) {
    attendanceLogger.error("❌ Exception checking attendance:", err);
    return { success: false, exists: false };
  }
}

export type AttendanceStatsResult = {
  total: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  trend: any[]; // For chart
};

export const getAttendanceStats = async (params: GetAttendanceParams = {}): Promise<{ success: boolean; data?: AttendanceStatsResult }> => {
  const supabase = await getSupabase();
  const { dateFrom, dateTo, status } = params;

  // Get current user's organization (same auth check as getAllAttendance)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: userMembers } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const userMember = userMembers?.[0];
  if (!userMember) return { success: false };

  // Base query builder
  const buildQuery = (statusFilter?: string) => {
    // We use a single query construction to avoid type mismatches from reassignment
    let q = supabase
      .from("attendance_records")
      .select("id, organization_members!inner(organization_id)", { count: 'exact', head: true })
      .eq("organization_members.organization_id", userMember.organization_id);

    if (dateFrom) q = q.gte("attendance_date", dateFrom);
    if (dateTo) q = q.lte("attendance_date", dateTo);
    if (statusFilter) q = q.eq("status", statusFilter);
    
    return q;
  };

  try {
    const [totalRes, presentRes, lateRes, absentRes, leaveRes] = await Promise.all([
      buildQuery(status !== 'all' ? status : undefined), // Total (respecting status filter if set)
      buildQuery('present'),
      buildQuery('late'),
      buildQuery('absent'),
      buildQuery('leave') // Assuming 'leave' status exists or map it
    ]);

    // For Trend Chart (Daily counts in the range)
    // This requires a separate data fetch, not just head:true
    let trendData: any[] = [];
    if (dateFrom && dateTo) {
      const { data: trend } = await supabase
        .from("attendance_records")
        .select("attendance_date, status, organization_members!inner(organization_id)")
        .eq("organization_members.organization_id", userMember.organization_id)
        .gte("attendance_date", dateFrom)
        .lte("attendance_date", dateTo);
      
      if (trend) {
        // Group by date
        const grouped = trend.reduce((acc: any, curr: any) => {
          const date = curr.attendance_date;
          if (!acc[date]) acc[date] = { date, present: 0, late: 0, absent: 0, total: 0 };
          acc[date].total++;
          if (curr.status === 'present') acc[date].present++;
          if (curr.status === 'late') acc[date].late++;
          if (curr.status === 'absent') acc[date].absent++;
          return acc;
        }, {});
        trendData = Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    }

    return {
      success: true,
      data: {
        total: totalRes.count || 0,
        present: presentRes.count || 0,
        late: lateRes.count || 0,
        absent: absentRes.count || 0,
        leave: leaveRes.count || 0,
        trend: trendData
      }
    };
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return { success: false };
  }
};

export async function createManualAttendance(payload: ManualAttendancePayload) {
  try {
    const supabase = await getSupabase();
    
    // Log for debugging
    attendanceLogger.debug("📝 Creating attendance for:", {
      member_id: payload.organization_member_id,
      date: payload.attendance_date,
      check_in: payload.actual_check_in,
    });

    const { error } = await supabase.from("attendance_records").insert([payload]);

    if (error) {
      attendanceLogger.error("❌ Error creating attendance:", error);
      
      // Check if duplicate key error
      if (error.code === "23505") {
        return { 
          success: false, 
          message: `Attendance already exists for this date. Please check existing records.` 
        };
      }
      
      return { success: false, message: error.message };
    }

    attendanceLogger.debug("✓ Attendance created successfully");
    // Invalidate list cache for the organization of this member
    try {
      const memberId = Number(payload.organization_member_id);
      if (!isNaN(memberId)) {
        const { data: orgRow } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('id', memberId)
          .maybeSingle();
        const orgId = orgRow?.organization_id;
        if (orgId) {
          await delByPrefix(`attendance:list:${orgId}:`);
        } else {
          await delByPrefix('attendance:list:');
        }
      }
    } catch (_) {}
    revalidatePath("/attendance");

    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception creating attendance:", err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : "An error occurred" 
    };
  }
}

export async function deleteAttendanceRecord(id: string) {
  try {
    const supabase = await getSupabase();
    
    attendanceLogger.info("🗑️ Deleting attendance record:", id);

    // Fetch orgId before deletion for targeted cache invalidation
    let orgId: number | null = null;
    try {
      const { data: recOrg } = await supabase
        .from('attendance_records')
        .select('organization_members!inner(organization_id)')
        .eq('id', id)
        .maybeSingle();
      const orgRel: any = (recOrg as any)?.organization_members;
      const orgObj = Array.isArray(orgRel) ? orgRel[0] : orgRel;
      orgId = orgObj?.organization_id ?? null;
    } catch (_) {}

    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("id", id);

    if (error) {
      attendanceLogger.error("❌ Error deleting attendance:", error);
      return { success: false, message: error.message };
    }

    attendanceLogger.info("✓ Attendance record deleted successfully");
    // Invalidate caches
    try {
      if (orgId) await delByPrefix(`attendance:list:${orgId}:`);
      else await delByPrefix('attendance:list:');
    } catch (_) {}
    revalidatePath("/attendance");

    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception deleting attendance:", err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : "An error occurred" 
    };
  }
}

export async function deleteMultipleAttendanceRecords(ids: string[]) {
  try {
    const supabase = await getSupabase();
    
    attendanceLogger.info("🗑️ Deleting multiple attendance records:", ids);

    // Collect affected orgIds first
    let affectedOrgIds: number[] = [];
    try {
      const { data: recs } = await supabase
        .from('attendance_records')
        .select('id, organization_members!inner(organization_id)')
        .in('id', ids);
      if (recs && Array.isArray(recs)) {
        const set = new Set<number>();
        for (const r of recs as any[]) {
          const rel = r.organization_members;
          const obj = Array.isArray(rel) ? rel[0] : rel;
          const oid = obj?.organization_id;
          if (typeof oid === 'number') set.add(oid);
        }
        affectedOrgIds = Array.from(set);
      }
    } catch (_) {}

    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .in("id", ids);

    if (error) {
      attendanceLogger.error("❌ Error deleting attendance records:", error);
      return { success: false, message: error.message };
    }

    attendanceLogger.info("✓ Attendance records deleted successfully");
    // Invalidate caches for affected orgs
    try {
      if (affectedOrgIds.length > 0) {
        await Promise.all(affectedOrgIds.map((oid) => delByPrefix(`attendance:list:${oid}:`)));
      } else {
        await delByPrefix('attendance:list:');
      }
    } catch (_) {}
    revalidatePath("/attendance");

    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception deleting attendance records:", err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : "An error occurred" 
    };
  }
}
