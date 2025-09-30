"use server";
import { createClient } from "@/utils/supabase/server";

// Helper function to get the supabase client
async function getSupabase() {
  return await createClient();
}

// Helper function to get current organization ID
async function getUserOrganizationId() {
  const supabase = await getSupabase();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return member?.organization_id || null;
}

// Get total active members in organization
export async function getTotalActiveMembers() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: 0 };
  }

  const supabase = await getSupabase();
  const { count, error } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get total members in organization (all members including inactive)
export async function getTotalMembers() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: 0 };
  }

  const supabase = await getSupabase();
  const { count, error } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get today's attendance count
export async function getTodayAttendance() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: 0 };
  }

  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { count, error } = await supabase
    .from("attendance_records")
    .select(`
      *,
      organization_member!inner(organization_id)
    `, { count: "exact", head: true })
    .eq("attendance_date", today)
    .eq("organization_member.organization_id", organizationId)
    .in("status", ["present", "late"]);

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get today's late attendance count
export async function getTodayLateAttendance() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: 0 };
  }

  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { count, error } = await supabase
    .from("attendance_records")
    .select(`
      *,
      organization_member!inner(organization_id)
    `, { count: "exact", head: true })
    .eq("attendance_date", today)
    .eq("organization_member.organization_id", organizationId)
    .eq("status", "late");

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get today's absent count
export async function getTodayAbsent() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: 0 };
  }

  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { count, error } = await supabase
    .from("attendance_records")
    .select(`
      *,
      organization_member!inner(organization_id)
    `, { count: "exact", head: true })
    .eq("attendance_date", today)
    .eq("organization_member.organization_id", organizationId)
    .eq("status", "absent");

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get today's excused count
export async function getTodayExcused() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: 0 };
  }

  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { count, error } = await supabase
    .from("attendance_records")
    .select(`
      *,
      organization_member!inner(organization_id)
    `, { count: "exact", head: true })
    .eq("attendance_date", today)
    .eq("organization_member.organization_id", organizationId)
    .eq("status", "excused");

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get pending approvals count
export async function getPendingApprovals() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: 0 };
  }

  const supabase = await getSupabase();

  const { count, error } = await supabase
    .from("attendance_records")
    .select(`
      *,
      organization_member!inner(organization_id)
    `, { count: "exact", head: true })
    .eq("organization_member.organization_id", organizationId)
    .eq("validated_status", "pending");

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get total departments
export async function getTotalDepartments() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: 0 };
  }

  const supabase = await getSupabase();
  const { count, error } = await supabase
    .from("departments")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get member status distribution
export async function getMemberStatusDistribution() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: [] };
  }

  const supabase = await getSupabase();
  
  // Get active members count
  const { count: activeCount } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  // Get inactive members count
  const { count: inactiveCount } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", false);

  // Get members by employment status
  const { data: employmentData } = await supabase
    .from("organization_members")
    .select("employment_status")
    .eq("organization_id", organizationId);

  const employmentDistribution = employmentData?.reduce((acc: any, member) => {
    const status = member.employment_status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  return {
    success: true,
    data: {
      status: [
        { name: "Aktif", value: activeCount || 0, color: "#10b981" },
        { name: "Tidak Aktif", value: inactiveCount || 0, color: "#ef4444" }
      ],
      employment: Object.entries(employmentDistribution).map(([key, value], index) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number,
        color: ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"][index % 5]
      }))
    }
  };
}

// Get attendance distribution for today
export async function getTodayAttendanceDistribution() {
  const organizationId = await getUserOrganizationId();
  if (!organizationId) {
    return { success: false, data: [] };
  }

  const supabase = await getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Get all possible attendance statuses for today
  const statuses = ['present', 'late', 'absent', 'excused'];
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase
        .from("attendance_records")
        .select(`
          *,
          organization_member!inner(organization_id)
        `, { count: "exact", head: true })
        .eq("attendance_date", today)
        .eq("organization_member.organization_id", organizationId)
        .eq("status", status);
      
      return { status, count: count || 0 };
    })
  );

  const colorMap: { [key: string]: string } = {
    present: "#10b981",
    late: "#f59e0b", 
    absent: "#ef4444",
    excused: "#6366f1"
  };

  const labelMap: { [key: string]: string } = {
    present: "Hadir",
    late: "Terlambat",
    absent: "Tidak Hadir",
    excused: "Izin"
  };

  return {
    success: true,
    data: results.map(({ status, count }) => ({
      name: labelMap[status],
      value: count,
      color: colorMap[status]
    }))
  };
}

// Get all dashboard stats at once
export async function getDashboardStats() {
  const [totalActiveMembers, totalMembers, todayAttendance, todayLate, todayAbsent, todayExcused, pendingApprovals, totalDepartments, memberDistribution] = await Promise.all([
    getTotalActiveMembers(),
    getTotalMembers(),
    getTodayAttendance(),
    getTodayLateAttendance(),
    getTodayAbsent(),
    getTodayExcused(),
    getPendingApprovals(),
    getTotalDepartments(),
    getMemberStatusDistribution()
  ]);

  return {
    totalActiveMembers: totalActiveMembers.data,
    totalMembers: totalMembers.data,
    todayAttendance: todayAttendance.data,
    todayLate: todayLate.data,
    todayAbsent: todayAbsent.data,
    todayExcused: todayExcused.data,
    pendingApprovals: pendingApprovals.data,
    totalDepartments: totalDepartments.data,
    memberDistribution: memberDistribution.data
  };
}
