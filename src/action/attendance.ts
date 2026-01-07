"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

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
  cursor?: string; // base64 cursor for keyset pagination
};

export type AttendanceListItem = {
  id: string;
  member: {
    id: number;
    name: string;
    avatar?: string;
    position: string;
    department: string;
  };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string;
  status: string;
  checkInDeviceId: string | null;
  checkOutDeviceId: string | null;
  checkInLocationName: string | null;
  checkOutLocationName: string | null;
  notes: string;
  timezone: string;
  time_format: string;
};

export type GetAttendanceResult = {
  success: boolean;
  data: AttendanceListItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    nextCursor?: string;
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
    department,
    organizationId  // Get organization ID from params
  } = params;

  // Default date range to today in production to avoid full table scans
  const todayStr = new Date().toISOString().split('T')[0];
  const effDateFrom = dateFrom || todayStr;
  const effDateTo = dateTo || todayStr;

// Resolve effective organization id: prefer param, else cookie, else fallback to user's active membership
let effectiveOrgId: number | null = null;
let memberIdForLog: number | null = null;

if (organizationId) {
  effectiveOrgId = organizationId;
  attendanceLogger.info("🔑 Using organizationId from params:", organizationId);
} else {
  // Try resolve from cookie first (works well on Vercel)
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('org_id')?.value;
    const fromCookie = raw ? Number(raw) : NaN;
    if (!Number.isNaN(fromCookie)) {
      effectiveOrgId = fromCookie;
      attendanceLogger.info("🍪 Using organizationId from cookie:", fromCookie);
    }
  } catch {}

  // Fallback: resolve via authenticated user's active membership
  if (!effectiveOrgId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      attendanceLogger.error("❌ User not authenticated and no org cookie");
      return { success: false, data: [], message: "User not authenticated" };
    }

  const { data: userMembers, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id, id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  if (memberError) {
    attendanceLogger.error("❌ Member query error:", memberError);
    return { success: false, data: [], message: memberError.message || "Member query error" };
  }

  const userMember = userMembers?.[0];
  if (!userMember) {
    attendanceLogger.error("❌ User not in any active organization");
    return { success: false, data: [], message: "User not registered in any active organization" };
  }

  effectiveOrgId = userMember.organization_id;
  memberIdForLog = userMember.id;
  }
}

if (!effectiveOrgId) {
  return { success: false, data: [], message: "Organization not resolved" };
}
attendanceLogger.info("✅ Effective org resolved:", effectiveOrgId, "member:", memberIdForLog);
  // Cache key per organisasi + filter
  const cacheKey = [
    'attendance:list',
    String(effectiveOrgId),
    `p=${page}`,
    `l=${limit}`,
    `from=${dateFrom || ''}`,
    `to=${dateTo || ''}`,
    `status=${status || 'all'}`,
    `dept=${department || 'all'}`,
    `q=${(search || '').trim().toLowerCase()}`,
  ].join(':');

  // Try cache first (safe if Redis down)
  let cached: GetAttendanceResult | null = null;
  try {
    cached = await getJSON<GetAttendanceResult>(cacheKey);
  } catch (_) {
    attendanceLogger.warn(`⚠️ Cache read failed for key ${cacheKey}, proceeding without cache`);
  }
  if (cached && cached.success) {
    attendanceLogger.debug(`🗄️ Cache hit: ${cacheKey}`);
    try {
      if (cached.meta && Array.isArray(cached.data)) {
        const rowsLen = cached.data.length;
        const currentLimit = cached.meta.limit || limit;
        if ((cached.meta.total ?? 0) < rowsLen) {
          cached.meta.total = rowsLen;
          cached.meta.totalPages = Math.ceil(rowsLen / currentLimit);
          try { await setJSON(cacheKey, cached, 60); } catch {}
        }
      }
    } catch {}
    return cached;
  }

  type AttendanceRow = {
    id: number;
    organization_member_id: number;
    attendance_date: string;
    actual_check_in: string | null;
    actual_check_out: string | null;
    status: string;
    created_at: string;
    work_duration_minutes: number | null;
    remarks: string | null;
    check_in_device_id: string | null;
    check_out_device_id: string | null;
  };
  type MemberProfile = {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    profile_photo_url: string | null;
  };
  type MemberData = {
    id: number;
    user_profiles: MemberProfile | MemberProfile[] | null;
    departments: { name: string | null } | { name: string | null }[] | null;
  };
  
  // Inline filters below to avoid deep generic instantiation on Supabase types
  const hasSearch = Boolean(search && search.trim() !== '');
  const term = hasSearch ? search!.trim().toLowerCase() : '';
  const pattern = hasSearch ? `%${term}%` : '';

  // Offset variables are no longer needed when using keyset pagination

  // Keyset pagination disabled for now (using offset pagination for stability)
  // Use single-join filtering (no prefetch of memberIds)
  // This keeps queries simple and allows PostgREST to optimize joins

  // COUNT (lazy, page 1 saja)
  // Prepare relation selection for count join (include only needed relations)
  const innerParts: string[] = ['id'];
  if (hasSearch) innerParts.push('user_profiles!inner(search_name)');
  if (department && department !== 'all') innerParts.push('departments!organization_members_department_id_fkey(name)');
  const countRel = `organization_members!inner(${innerParts.join(',')})`;

  // Cache key for COUNT should be independent of page/limit
  const countCacheKey = [
    'attendance:list',
    String(effectiveOrgId),
    `from=${effDateFrom || ''}`,
    `to=${effDateTo || ''}`,
    `status=${status || 'all'}`,
    `dept=${department || 'all'}`,
    `q=${(search || '').trim().toLowerCase()}`,
    'count'
  ].join(':');
  let totalCount: number | undefined = undefined;
  let needCount = page === 1;
  if (!needCount) {
    try {
      const cachedCount = await getJSON<number>(countCacheKey);
      if (typeof cachedCount === 'number') {
        totalCount = cachedCount;
      } else {
        needCount = true;
      }
    } catch {
      needCount = true;
    }
  }
  if (needCount) {
    let countQuery = supabase
      .from('attendance_records')
      .select(`id, ${countRel}`, { count: 'exact', head: true })
      .eq('organization_members.organization_id', effectiveOrgId)
      .eq('organization_members.is_active', true);
    if (effDateFrom) countQuery = countQuery.gte('attendance_date', effDateFrom);
    if (effDateTo) countQuery = countQuery.lte('attendance_date', effDateTo);
    if (status && status !== 'all') countQuery = countQuery.eq('status', status);
    if (department && department !== 'all') countQuery = countQuery.eq('organization_members.departments.name', department);
    if (hasSearch) countQuery = countQuery.ilike('organization_members.user_profiles.search_name', pattern);
    const countResp = await countQuery;
    totalCount = (countResp as unknown as { count: number | null }).count ?? 0;
    try { await setJSON(countCacheKey, totalCount, 60); } catch {}
  }

  // LIST dengan join untuk mengambil profil/departemen
  // Specify exact FK for departments to avoid PostgREST ambiguous embed error
  const listRel = 'organization_members!inner(id, is_active, user_profiles(first_name,last_name,display_name,email,profile_photo_url), departments!organization_members_department_id_fkey(name))';
  const fromIdx = (page - 1) * limit;
  const toIdx = fromIdx + limit - 1;
  let listQuery = supabase
    .from('attendance_records')
    .select(`id, organization_member_id, attendance_date, actual_check_in, actual_check_out, status, created_at, work_duration_minutes, ${listRel}`)
    .eq('organization_members.organization_id', effectiveOrgId)
    .eq('organization_members.is_active', true);
  if (effDateFrom) listQuery = listQuery.gte('attendance_date', effDateFrom);
  if (effDateTo) listQuery = listQuery.lte('attendance_date', effDateTo);
  if (status && status !== 'all') listQuery = listQuery.eq('status', status);
  if (department && department !== 'all') listQuery = listQuery.eq('organization_members.departments.name', department);
  if (hasSearch) listQuery = listQuery.ilike('organization_members.user_profiles.search_name', pattern);
  listQuery = listQuery
    .order('attendance_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(fromIdx, toIdx);
  const listResp = await listQuery;
  type AttendanceRowWithRel = AttendanceRow & { organization_members: MemberData | MemberData[] | null };
  const rows = (listResp as unknown as { data: AttendanceRowWithRel[] | null }).data;
  const dataError = (listResp as unknown as { error: { message: string } | null }).error;
  if (dataError) {
    return { success: false, data: [], message: dataError.message };
  }

  // Defensive: if rows are empty but cached totalCount > 0, recompute count fresh
  if ((!rows || rows.length === 0) && typeof totalCount === 'number' && totalCount > 0) {
    let freshCount = supabase
      .from('attendance_records')
      .select(`id, ${countRel}`, { count: 'exact', head: true })
      .eq('organization_members.organization_id', effectiveOrgId)
      .eq('organization_members.is_active', true);
    if (effDateFrom) freshCount = freshCount.gte('attendance_date', effDateFrom);
    if (effDateTo) freshCount = freshCount.lte('attendance_date', effDateTo);
    if (status && status !== 'all') freshCount = freshCount.eq('status', status);
    if (department && department !== 'all') freshCount = freshCount.eq('organization_members.departments.name', department);
    if (hasSearch) freshCount = freshCount.ilike('organization_members.user_profiles.search_name', pattern);
    const freshResp = await freshCount;
    totalCount = (freshResp as unknown as { count: number | null }).count ?? 0;
    try { await setJSON(countCacheKey, totalCount, 60); } catch {}
  }

  // If count somehow less than current page size, adjust to at least rows length
  if (typeof totalCount === 'number' && rows && totalCount < rows.length) {
    totalCount = rows.length;
  }

  // Fallback: if single-join returns no rows, try IN(memberIds) —
  // Guarded to avoid heavy scans on serverless. Enable only when searching.
  const FALLBACK_ON = process.env.ATTENDANCE_LIST_FALLBACK === '1';
  let effectiveRows = rows;
  if ((!effectiveRows || effectiveRows.length === 0) && FALLBACK_ON && hasSearch) {
    attendanceLogger.warn("⚠️ Single-join returned 0 rows. Trying fallback IN(memberIds)...");
    const { data: members, error: membersErr } = await supabase
      .from('organization_members')
      .select('id, user_profiles(search_name)')
      .eq('organization_id', effectiveOrgId)
      .eq('is_active', true);

    if (!membersErr && Array.isArray(members) && members.length > 0) {
      type MemberRow = { id: number; user_profiles: { search_name: string | null } | { search_name: string | null }[] | null };
      let memberIds = (members as MemberRow[]).map(m => m.id);

      if (hasSearch) {
        const match = (m: MemberRow) => {
          const up = m.user_profiles;
          const sn = Array.isArray(up) ? up[0]?.search_name : up?.search_name;
          return (sn || '').toLowerCase().includes(term);
        };
        memberIds = (members as MemberRow[]).filter(match).map(m => m.id);
      }

      if (memberIds.length > 0) {
        // Limit IN size to avoid timeouts
        const MAX_IDS = 500;
        if (memberIds.length > MAX_IDS) memberIds = memberIds.slice(0, MAX_IDS);
        let fbQuery = supabase
          .from('attendance_records')
          .select(`id, organization_member_id, attendance_date, actual_check_in, actual_check_out, status, created_at, work_duration_minutes, ${listRel}`)
          .in('organization_member_id', memberIds);

        if (status && status !== 'all') fbQuery = fbQuery.eq('status', status);

        const fbResp = await fbQuery
          .order('attendance_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(fromIdx, toIdx);

        const fbRows = (fbResp as unknown as { data: AttendanceRowWithRel[] | null }).data;
        if (fbRows && fbRows.length > 0) {
          attendanceLogger.info("✅ Fallback IN(memberIds) returned rows:", fbRows.length);
          effectiveRows = fbRows;
        }
      }
    }
  }

  // Small cache for org info to avoid repeated fetch on each page load
  const orgInfoCacheKey = `org:info:${effectiveOrgId}`;
  let orgInfo: { id: number; timezone: string | null; time_format: string | null } | null = null;
  try {
    orgInfo = await getJSON<{ id: number; timezone: string | null; time_format: string | null }>(orgInfoCacheKey);
  } catch (_) {
    attendanceLogger.warn(`⚠️ Org info cache read failed for key ${orgInfoCacheKey}, using DB fallback`);
  }
  if (!orgInfo) {
    const { data: orgInfoRaw } = await supabase
      .from('organizations')
      .select('id, timezone, time_format')
      .eq('id', effectiveOrgId)
      .maybeSingle();
    const fallbackInfo = { id: effectiveOrgId, timezone: 'Asia/Jakarta', time_format: '24h' }
    orgInfo = orgInfoRaw || fallbackInfo;
    try { await setJSON(orgInfoCacheKey, orgInfo, 600); } catch {}
  }

  const mapped = (effectiveRows || []).map((item: AttendanceRowWithRel) => {
    const m = item.organization_members as MemberData | MemberData[] | null;
    const mObj: MemberData | null = Array.isArray(m) ? (m[0] as MemberData) : (m as MemberData);
    const profileObj = mObj?.user_profiles;
    const profile: MemberProfile | null = Array.isArray(profileObj) ? (profileObj[0] ?? null) : (profileObj ?? null);
    const displayName = (profile?.display_name ?? '').trim();
    const firstName = profile?.first_name ?? '';
    const lastName = profile?.last_name ?? '';
    const email = (profile?.email ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const effectiveName = displayName || fullName || email;
    const deptObj = mObj?.departments;
    const departmentName = Array.isArray(deptObj) ? (deptObj[0]?.name ?? '') : (deptObj?.name ?? '');

    return {
      id: String(item.id),
      member: {
        id: item.organization_member_id,
        name: effectiveName || `Member #${item.organization_member_id}`,
        avatar: profile?.profile_photo_url || undefined,
        position: '',
        department: departmentName,
      },
      date: item.attendance_date,
      checkIn: item.actual_check_in,
      checkOut: item.actual_check_out,
      workHours: item.work_duration_minutes ? `${Math.floor(item.work_duration_minutes / 60)}h ${item.work_duration_minutes % 60}m` : (item.actual_check_in ? '-' : '-'),
      status: item.status,
      checkInDeviceId: null,
      checkOutDeviceId: null,
      checkInLocationName: null,
      checkOutLocationName: null,
      notes: '',
      timezone: orgInfo?.timezone || 'Asia/Jakarta',
      time_format: orgInfo?.time_format || '24h',
    };
  });

  const total = typeof totalCount === 'number' ? totalCount : (effectiveRows?.length || 0);
  let nextCursor: string | undefined = undefined;
  if ((effectiveRows?.length || 0) === limit && effectiveRows && effectiveRows.length > 0) {
    const last = effectiveRows[effectiveRows.length - 1] as AttendanceRow | undefined;
    if (last) {
      const payload = { ad: last.attendance_date, cr: last.created_at, id: last.id };
      try { nextCursor = Buffer.from(JSON.stringify(payload)).toString('base64'); } catch {}
    }
  }
  const result: GetAttendanceResult = {
    success: true,
    data: mapped,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit), nextCursor }
  };

  // Save to cache (TTL 60s)
  try {
    await setJSON(cacheKey, result, 120);
    attendanceLogger.debug(`🗄️ Cache set: ${cacheKey}`);
  } catch (_) {
    attendanceLogger.warn(`⚠️ Cache write failed for key ${cacheKey}, returning result without cache`);
  }
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
      .select("id, organization_members!inner(organization_id)", { count: 'planned', head: true })
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

      if (Array.isArray(recs)) {
        type RecRow = { organization_members: { organization_id: number } | { organization_id: number }[] | null };
        const set = new Set<number>();
        for (const r of recs as RecRow[]) {
          const rel = r.organization_members ?? null;
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
