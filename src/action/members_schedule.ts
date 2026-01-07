"use server";
import { createClient } from "@/utils/supabase/server";
import { IMemberSchedule } from "@/interface";

export const getAllMemberSchedule = async (organizationId?: number | string) => {
  const supabase = await createClient();
  
  let finalOrgId = organizationId;
  
  // If no organizationId provided, get from current user
  if (!finalOrgId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, message: "User not authenticated", data: [] };
    }

    // Get user's organization membership
    const { data: userMember, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !userMember) {
      return { success: false, message: "User not in any organization", data: [] };
    }
    
    finalOrgId = userMember.organization_id;
  }

  // Get all member IDs in the same organization
  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", finalOrgId);

  if (orgMembersError) {
    return { success: false, message: orgMembersError.message, data: [] };
  }

  const memberIds = orgMembers?.map(m => m.id) || [];
  if (memberIds.length === 0) {
    return { success: true, data: [] };
  }

  // Fetch member schedules with all related data
  const { data, error } = await supabase
    .from("member_schedules")
    .select(`
      id,
      organization_member_id,
      work_schedule_id,
      shift_id,
      effective_date,
      end_date,
      is_active,
      created_at,
      updated_at,
      organization_member:organization_member_id (
        id,
        employee_id,
        user:user_id (
          id,
          first_name,
          middle_name,
          last_name,
          email
        )
      ),
      work_schedule:work_schedule_id (
        id,
        code,
        name,
        schedule_type,
        organization_id
      )
    `)
    .in("organization_member_id", memberIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error('[MEMBER-SCHEDULE] Error fetching schedules:', error);
    return { success: false, message: error.message, data: [] };
  }

  console.log('[MEMBER-SCHEDULE] Successfully fetched', data?.length || 0, 'schedules');
  return { success: true, data: data as unknown as IMemberSchedule[] };
};

export const getMemberSchedulesPage = async (
  organizationId: number | string | undefined,
  pageIndex = 0,
  pageSize = 10,
) => {
  try {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, message: "User not authenticated", data: [], total: 0 };
      }

      const { data: userMember, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !userMember) {
        return { success: false, message: "User not in any organization", data: [], total: 0 };
      }

      finalOrgId = userMember.organization_id;
    }

    const { data: orgMembers, error: orgMembersError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", finalOrgId);

    if (orgMembersError) {
      return { success: false, message: orgMembersError.message, data: [], total: 0 };
    }

    const memberIds = orgMembers?.map((m) => m.id) || [];
    if (memberIds.length === 0) {
      return { success: true, data: [], total: 0 };
    }

    const safePageIndex = Math.max(0, Number(pageIndex) || 0);
    const safePageSize = Math.max(1, Number(pageSize) || 10);
    const from = safePageIndex * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await supabase
      .from("member_schedules")
      .select(
        `
        id,
        organization_member_id,
        work_schedule_id,
        shift_id,
        effective_date,
        end_date,
        is_active,
        created_at,
        updated_at,
        organization_member:organization_member_id (
          id,
          employee_id,
          user:user_id (
            id,
            first_name,
            middle_name,
            last_name,
            email
          )
        ),
        work_schedule:work_schedule_id (
          id,
          code,
          name,
          schedule_type,
          organization_id
        )
      `,
        { count: "exact" },
      )
      .in("organization_member_id", memberIds)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[MEMBER-SCHEDULE] Error fetching schedules page:', error);
      return { success: false, message: error.message, data: [], total: 0 };
    }

    return {
      success: true,
      data: (data || []) as unknown as IMemberSchedule[],
      total: typeof count === "number" ? count : (data?.length || 0),
    };
  } catch (error) {
    console.error("[getMemberSchedulesPage] Unexpected error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
      data: [],
      total: 0,
    };
  }
};

export const getActiveMemberScheduleMemberIds = async (organizationId?: number | string) => {
  try {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, message: "User not authenticated", data: [] as string[] };
      }

      const { data: userMember, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !userMember) {
        return { success: false, message: "User not in any organization", data: [] as string[] };
      }

      finalOrgId = userMember.organization_id;
    }

    const { data: orgMembers, error: orgMembersError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", finalOrgId);

    if (orgMembersError) {
      return { success: false, message: orgMembersError.message, data: [] as string[] };
    }

    const memberIds = orgMembers?.map((m) => String(m.id)) || [];
    if (memberIds.length === 0) {
      return { success: true, data: [] as string[] };
    }

    const { data, error } = await supabase
      .from("member_schedules")
      .select("organization_member_id")
      .in("organization_member_id", memberIds)
      .eq("is_active", true);

    if (error) {
      return { success: false, message: error.message, data: [] as string[] };
    }

    const ids = Array.from(
      new Set((data || []).map((row: any) => String(row.organization_member_id)).filter(Boolean)),
    );

    return { success: true, data: ids };
  } catch (error) {
    console.error("[getActiveMemberScheduleMemberIds] Unexpected error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown server error",
      data: [] as string[],
    };
  }
};

export const getMemberScheduleById = async (id: string) => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("member_schedules")
    .select(`
      id,
      organization_member_id,
      work_schedule_id,
      shift_id,
      effective_date,
      end_date,
      is_active,
      created_at,
      updated_at,
      organization_member:organization_member_id (
        id,
        employee_id,
        user:user_id (
          id,
          first_name,
          middle_name,
          last_name,
          email
        )
      ),
      work_schedule:work_schedule_id (
        id,
        code,
        name,
        schedule_type,
        organization_id
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as unknown as IMemberSchedule };
};

export const createMemberSchedule = async (payload: Partial<IMemberSchedule>) => {
  const supabase = await createClient();
  
  // Check if member already has an active schedule
  if (payload.organization_member_id) {
    const { data: existingSchedules } = await supabase
      .from("member_schedules")
      .select("id, is_active")
      .eq("organization_member_id", payload.organization_member_id)
      .eq("is_active", true);

    if (existingSchedules && existingSchedules.length > 0) {
      return { 
        success: false, 
        message: "Member already has an active schedule. Please deactivate the existing schedule first.", 
        data: null 
      };
    }
  }
  
  const { data, error } = await supabase
    .from("member_schedules")
    .insert({
      organization_member_id: payload.organization_member_id,
      work_schedule_id: payload.work_schedule_id,
      shift_id: payload.shift_id || null,
      effective_date: payload.effective_date,
      end_date: payload.end_date || null,
      is_active: payload.is_active ?? true
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Member schedule created successfully", data: data as IMemberSchedule };
};

export const updateMemberSchedule = async (id: string, payload: Partial<IMemberSchedule>) => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("member_schedules")
    .update({
      ...payload,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Member schedule updated successfully", data: data as IMemberSchedule };
};

export const deleteMemberSchedule = async (id: string) => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("member_schedules")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Member schedule deleted successfully", data: data as IMemberSchedule };
};