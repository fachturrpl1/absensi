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

  // Get authorized member IDs first
  const { data: memberIds } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const { count, error } = await supabase
    .from("attendance_records")
    .select('id', { count: 'exact', head: true })
    .in('organization_member_id', memberIds?.map(m => m.id) || [])
    .eq("attendance_date", today)
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
  const today = new Date().toISOString().split('T')[0];

  // Get authorized member IDs first
  const { data: memberIds } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const { count, error } = await supabase
    .from("attendance_records")
    .select('id', { count: 'exact', head: true })
    .in('organization_member_id', memberIds?.map(m => m.id) || [])
    .eq("attendance_date", today)
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
  const today = new Date().toISOString().split('T')[0];

  // Get authorized member IDs first
  const { data: memberIds } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const { count, error } = await supabase
    .from("attendance_records")
    .select('id', { count: 'exact', head: true })
    .in('organization_member_id', memberIds?.map(m => m.id) || [])
    .eq("attendance_date", today)
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
  const today = new Date().toISOString().split('T')[0];

  // Get authorized member IDs first
  const { data: memberIds } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const { count, error } = await supabase
    .from("attendance_records")
    .select('id', { count: 'exact', head: true })
    .in('organization_member_id', memberIds?.map(m => m.id) || [])
    .eq("attendance_date", today)
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

  // Get authorized member IDs first
  const { data: memberIds } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const { count, error } = await supabase
    .from("attendance_records")
    .select('id', { count: 'exact', head: true })
    .in('organization_member_id', memberIds?.map(m => m.id) || [])
    .eq("validation_status", "pending");

  if (error) {
    return { success: false, data: 0 };
  }

  return { success: true, data: count || 0 };
}

// Get total groups
export async function getTotalGroups() {
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
  const defaultData = {
    status: [
      { name: "Active", value: 0, color: "#10b981" },
      { name: "Inactive", value: 0, color: "#ef4444" }
    ],
    employment: []
  };
  
  if (!organizationId) {
    return { success: false, data: defaultData };
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

  const employmentDistribution = employmentData?.reduce((acc: Record<string, number>, member) => {
    const status = member.employment_status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  return {
    success: true,
    data: {
      status: [
        { name: "Active", value: activeCount || 0, color: "#10b981" },
        { name: "Inactive", value: inactiveCount || 0, color: "#ef4444" }
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

  // Get authorized member IDs first
  const { data: memberIds } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  // Get all possible attendance statuses for today
  const statuses = ['present', 'late', 'absent', 'excused'];
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase
        .from("attendance_records")
        .select('id', { count: 'exact', head: true })
        .in('organization_member_id', memberIds?.map(m => m.id) || [])
        .eq("attendance_date", today)
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
    present: "Present",
    late: "Late",
    absent: "Absent",
    excused: "Excused"
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

// Get monthly late attendance stats
export async function getMonthlyLateStats() {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
    }

    const organizationId = await getUserOrganizationId();
    if (!organizationId) {
      return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    function monthRange(year: number, month: number) {
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      const formatDate = (date: Date) => {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };
      return { start: formatDate(start), end: formatDate(lastDay) };
    }

    const curRange = monthRange(currentYear, currentMonth);
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevRange = monthRange(prevYear, prevMonth);

    const { data: memberIds } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const memberIdList = (memberIds || []).map((m: any) => m.id);

    const [currentRes, previousRes] = await Promise.all([
      supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .in('organization_member_id', memberIdList)
        .gte('attendance_date', curRange.start)
        .lte('attendance_date', curRange.end)
        .eq('status', 'late'),
      supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .in('organization_member_id', memberIdList)
        .gte('attendance_date', prevRange.start)
        .lte('attendance_date', prevRange.end)
        .eq('status', 'late')
    ]);

    const currentCount = currentRes.count ?? 0;
    const previousCount = previousRes.count ?? 0;
    let percentChange = 0;
    if (previousCount === 0 && currentCount > 0) {
      percentChange = 100;
    } else if (previousCount > 0) {
      percentChange = Math.round(((currentCount - previousCount) / previousCount) * 100);
    }

    return {
      success: true,
      data: { currentMonth: currentCount, previousMonth: previousCount, percentChange }
    };
  } catch (error) {
    return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
  }
}

// Get active members stats
export async function getActiveMembersStats() {
  try {
    const supabase = await getSupabase();
    const organizationId = await getUserOrganizationId();
    if (!organizationId) {
      return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
    }

    const { data: currentMembers } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const previousDate = new Date();
    previousDate.setMonth(previousDate.getMonth() - 1);
    
    const { data: previousMembers } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .lte('hire_date', previousDate.toISOString().split('T')[0]);

    const currentMonthCount = currentMembers?.length ?? 0;
    const previousMonthCount = previousMembers?.length ?? 0;
    let percentChange = 0;
    if (previousMonthCount === 0 && currentMonthCount > 0) {
      percentChange = 100;
    } else if (previousMonthCount > 0) {
      percentChange = Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100);
    }

    return {
      success: true,
      data: { currentMonth: currentMonthCount, previousMonth: previousMonthCount, percentChange }
    };
  } catch (error) {
    return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
  }
}

// Get active RFID stats
export async function getActiveRfidStats() {
  try {
    const supabase = await getSupabase();
    const organizationId = await getUserOrganizationId();
    if (!organizationId) {
      return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
    }

    const { data: members } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    const memberIds = members?.map((m: any) => m.id) || [];
    if (memberIds.length === 0) {
      return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
    }

    const { count: currentCount } = await supabase
      .from("rfid_cards")
      .select("id", { count: "exact", head: true })
      .in("organization_member_id", memberIds);

    return {
      success: true,
      data: { currentMonth: currentCount ?? 0, previousMonth: 0, percentChange: 0 }
    };
  } catch (error) {
    return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
  }
}

// Get attendance groups data
export async function getAttendanceGroupsData(organizationId: string) {
  try {
    const supabase = await getSupabase();
    if (!organizationId) {
      return { success: false, data: [] };
    }

    const { data: members } = await supabase
      .from('organization_members')
      .select(`
        id,
        department_id,
        departments:department_id (
          id,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (!members || members.length === 0) {
      return { success: true, data: [] };
    }

    const today = new Date().toISOString().split('T')[0];
    const memberIds = members.map((m: any) => m.id);

    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('organization_member_id, status')
      .in('organization_member_id', memberIds)
      .eq('attendance_date', today);

    const groupMap = new Map<string, { group: string; present: number; late: number; absent: number; excused: number; others: number; total: number }>();

    members.forEach((member: any) => {
      const groupName = member.departments?.name || 'No Group';
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, { group: groupName, present: 0, late: 0, absent: 0, excused: 0, others: 0, total: 0 });
      }
      const groupData = groupMap.get(groupName)!;
      groupData.total += 1;

      const memberAttendance = attendance?.find((a: any) => a.organization_member_id === member.id);
      if (memberAttendance) {
        const status = memberAttendance.status;
        if (status === 'present') groupData.present += 1;
        else if (status === 'late') groupData.late += 1;
        else if (status === 'absent') groupData.absent += 1;
        else if (status === 'excused') groupData.excused += 1;
        else groupData.others += 1;
      }
    });

    return { success: true, data: Array.from(groupMap.values()) };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// Get all dashboard stats at once - CONSOLIDATED with single org ID fetch
export async function getDashboardStats(): Promise<{
  totalActiveMembers: number
  totalMembers: number
  todayAttendance: number
  todayLate: number
  todayAbsent: number
  todayExcused: number
  pendingApprovals: number
  totalGroups: number
  memberDistribution: { status: Array<{ name: string; value: number; color: string }>; employment: Array<{ name: string; value: number; color: string }> } | null
  monthlyAttendance: { currentMonth: number; previousMonth: number; percentChange: number }
  monthlyLate: { currentMonth: number; previousMonth: number; percentChange: number }
  activeMembers: { currentMonth: number; previousMonth: number; percentChange: number }
  activeRfid: { currentMonth: number; previousMonth: number; percentChange: number }
  attendanceGroups: any[]
}> {
  // Call getUserOrganizationId once at the top - prevents multiple DB calls
  const organizationId = await getUserOrganizationId();
  
  // All these functions internally call getUserOrganizationId again
  // TODO: Refactor to accept organizationId as parameter to avoid redundant calls
  const [
    totalActiveMembers, 
    totalMembers, 
    todayAttendance, 
    todayLate, 
    todayAbsent, 
    todayExcused, 
    pendingApprovals, 
    totalGroups, 
    memberDistribution,
    monthlyAttendance,
    monthlyLate,
    activeMembers,
    activeRfid,
    attendanceGroups
  ] = await Promise.all([
    getTotalActiveMembers(),
    getTotalMembers(),
    getTodayAttendance(),
    getTodayLateAttendance(),
    getTodayAbsent(),
    getTodayExcused(),
    getPendingApprovals(),
    getTotalGroups(),
    getMemberStatusDistribution(),
    getMonthlyAttendanceStats(),
    getMonthlyLateStats(),
    getActiveMembersStats(),
    getActiveRfidStats(),
    getAttendanceGroupsData(organizationId || '')
  ]);

  return {
    totalActiveMembers: totalActiveMembers.data,
    totalMembers: totalMembers.data,
    todayAttendance: todayAttendance.data,
    todayLate: todayLate.data,
    todayAbsent: todayAbsent.data,
    todayExcused: todayExcused.data,
    pendingApprovals: pendingApprovals.data,
    totalGroups: totalGroups.data,
    memberDistribution: memberDistribution.success ? memberDistribution.data : null,
    monthlyAttendance: monthlyAttendance.data,
    monthlyLate: monthlyLate.data,
    activeMembers: activeMembers.data,
    activeRfid: activeRfid.data,
    attendanceGroups: attendanceGroups.data
  };
}

// Get monthly attendance stats
export async function getMonthlyAttendanceStats() {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
    }

    const organizationId = await getUserOrganizationId();
    if (!organizationId) {
      return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Get first and last day of month
    function monthRange(year: number, month: number) {
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      
      const formatDate = (date: Date) => {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      return { 
        start: formatDate(start),
        end: formatDate(lastDay)
      };
    }

    const curRange = monthRange(currentYear, currentMonth);
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevRange = monthRange(prevYear, prevMonth);

    // Get authorized member IDs first
    const { data: memberIds, error: memberIdsError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (memberIdsError) {
      console.error('Failed to fetch organization member ids', memberIdsError);
      return { success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 }, error: memberIdsError };
    }

    type MemberIdRow = { id: string };
    const memberIdList = (memberIds || []).map((member) => (member as MemberIdRow).id);

    // small retry wrapper for transient network errors
    async function queryWithRetry<T>(queryFn: () => Promise<T>, retries = 1): Promise<T> {
      try {
        return await queryFn();
      } catch (err) {
        if (retries > 0) {
          console.warn('Query failed, retrying once', err);
          return await queryWithRetry(queryFn, retries - 1);
        }
        throw err;
      }
    }

    const [currentRes, previousRes] = await Promise.all([
      queryWithRetry(() =>
        Promise.resolve(
          supabase
            .from('attendance_records')
            .select('id', { count: 'exact', head: true })
            .in('organization_member_id', memberIdList || [])
            .gte('attendance_date', curRange.start)
            .lte('attendance_date', curRange.end)
            .in('status', ['present', 'late'])
            .then((res) => res)
        )
      ),

      queryWithRetry(() =>
        Promise.resolve(
          supabase
            .from('attendance_records')
            .select('id', { count: 'exact', head: true })
            .in('organization_member_id', memberIdList || [])
            .gte('attendance_date', prevRange.start)
            .lte('attendance_date', prevRange.end)
            .in('status', ['present', 'late'])
            .then((res) => res)
        )
      )
    ]);

    const currentCount = currentRes.count ?? 0;
    const previousCount = previousRes.count ?? 0;

    let percentChange = 0;
    if (previousCount === 0 && currentCount > 0) {
      percentChange = 100;
    } else if (previousCount === 0 && currentCount === 0) {
      percentChange = 0;
    } else {
      percentChange = Math.round(((currentCount - previousCount) / previousCount) * 100);
    }

    return {
      success: true,
      data: {
        currentMonth: currentCount,
        previousMonth: previousCount,
        percentChange
      }
    };
  } catch (error) {
    return {
      success: false,
      data: {
        currentMonth: 0,
        previousMonth: 0,
        percentChange: 0
      },
      error,
    };
  }
}