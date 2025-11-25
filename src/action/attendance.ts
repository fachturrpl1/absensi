"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

import { attendanceLogger } from '@/lib/logger';
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
    department
  } = params;

  // Get current user's organization
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    attendanceLogger.error("❌ User not authenticated");
    return { success: false, data: [] };
  }

  // Get user's organization membership
  const { data: userMember, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id, id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !userMember) {
    attendanceLogger.error("❌ User not in any organization");
    return { success: false, data: [] };
  }

  // Start building the query
  let query = supabase
    .from("attendance_records")
    .select(`
      id,
      organization_member_id,
      attendance_date,
      actual_check_in,
      actual_check_out,
      status,
      created_at,
      work_duration_minutes,
      remarks,
      organization_members!inner (
        id,
        user_id,
        organization_id,
        department_id,
        user_profiles!inner (
          first_name,
          last_name,
          profile_photo_url
        ),
        departments:departments!organization_members_department_id_fkey (
          id,
          name
        ),
        organizations (
          id,
          name,
          timezone,
          time_format
        )
      ),
      check_in_device:attendance_devices!check_in_device_id (
        device_name,
        location
      ),
      check_out_device:attendance_devices!check_out_device_id (
        device_name,
        location
      )
    `, { count: 'exact' })
    .eq("organization_members.organization_id", userMember.organization_id);

  // Apply filters
  if (dateFrom) {
    query = query.gte("attendance_date", dateFrom);
  }
  
  if (dateTo) {
    query = query.lte("attendance_date", dateTo);
  }

  if (status && status !== 'all') {
    query = query.eq("status", status);
  }

  if (department && department !== 'all') {
    // Rely on client side filtering for now
  }

  if (search) {
    // Full text search implementation would go here.
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  query = query.range(from, to).order("attendance_date", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    attendanceLogger.error("❌ Error fetching attendance:", error);
    return { success: false, data: [] };
  }

  // Transform format
  const mapped = (data || []).map((item: any) => ({
    id: item.id,
    member: {
      name: `${item.organization_members?.user_profiles?.first_name || ''} ${item.organization_members?.user_profiles?.last_name || ''}`,
      avatar: item.organization_members?.user_profiles?.profile_photo_url,
      position: '', // Position not fetched in query above, add if needed
      department: item.organization_members?.departments?.name || 'No Department',
    },
    date: item.attendance_date,
    checkIn: item.actual_check_in,
    checkOut: item.actual_check_out,
    workHours: item.work_duration_minutes 
      ? `${Math.floor(item.work_duration_minutes / 60)}h ${item.work_duration_minutes % 60}m` 
      : (item.actual_check_in ? '-' : '-'),
    status: item.status,
    checkInLocationName: item.check_in_device?.location || item.check_in_device?.device_name || null,
    checkOutLocationName: item.check_out_device?.location || item.check_out_device?.device_name || null,
    notes: item.remarks || '',
    timezone: item.organization_members?.organizations?.timezone || "Asia/Jakarta",
    time_format: item.organization_members?.organizations?.time_format || "24h",
  }));

  return { 
    success: true, 
    data: mapped,
    meta: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
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
  const { dateFrom, dateTo, department, status } = params;

  // Get current user's organization (same auth check as getAllAttendance)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: userMember } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!userMember) return { success: false };

  // Base query builder
  const buildQuery = (statusFilter?: string) => {
    let q = supabase
      .from("attendance_records")
      .select("id", { count: 'exact', head: true })
      .eq("organization_members.organization_id", userMember.organization_id);

    // We need to join organization_members to filter by organization_id
    // Note: For simple count with filter, we might need inner join syntax in the select or use filtering on embedded resource
    // But 'head: true' doesn't support embedding well for filtering parent. 
    // Strategy: Use the !inner join on organization_members in the select string if we were selecting data,
    // but for count, it's trickier. 
    // Actually, Supabase/PostgREST allows filtering on embedded resources.
    
    // Let's use a more robust approach: Filter by organization_members IDs if needed, or use the existing relation logic
    // Replicating getAllAttendance logic but optimized for count
    
    q = supabase
      .from("attendance_records")
      .select("organization_members!inner(organization_id)", { count: 'exact', head: true })
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
    let trendData = [];
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
