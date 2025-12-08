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
    return { success: false, data: [] };
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
    return { success: false, data: [], message: memberError.message };
  }

  if (!userMember || !userMembers || userMembers.length === 0) {
    attendanceLogger.error("❌ User not in any active organization");
    return { success: false, data: [], message: "User not registered in any active organization" };
  }

  attendanceLogger.info("✅ User organization found:", userMember.organization_id);
  attendanceLogger.info("📍 Total organizations:", userMembers?.length || 0);

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
      organization_members (
        id,
        user_id,
        organization_id,
        department_id,
        user_profiles (
          first_name,
          last_name,
          profile_photo_url
        ),
        organizations (
          id,
          name,
          timezone,
          time_format
        )
      ),
      check_in_device:attendance_devices (
        device_name,
        location
      ),
      check_out_device:attendance_devices (
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

  // Note: Department filtering removed due to ambiguous relationship
  // Can be added back after fixing the FK relationship in database
  // if (department && department !== 'all') {
  //   query = query.eq("organization_members.department_id", department);
  // }

  if (search) {
    // Search by member name - filter manually after fetch
    // Supabase doesn't support nested OR queries with ilike directly
    attendanceLogger.info(`🔍 Search query: ${search}`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  query = query.range(from, to).order("attendance_date", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    attendanceLogger.error("❌ Error fetching attendance:", error);
    attendanceLogger.error("Organization ID:", userMember.organization_id);
    attendanceLogger.error("Error code:", error.code);
    attendanceLogger.error("Error message:", error.message);
    attendanceLogger.error("Error details:", JSON.stringify(error));
    return { success: false, data: [], message: `Query error: ${error.message}` };
  }

  attendanceLogger.info("✅ Attendance records fetched:", data?.length || 0);

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

  attendanceLogger.info("✅ Attendance data transformed:", mapped.length);

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
