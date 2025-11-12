"use server";
import { createClient } from "@/utils/supabase/server";
import { IMemberSchedule } from "@/interface";

export const getAllMemberSchedule = async () => {
  const supabase = await createClient();
  
  // Get current user's organization
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

  // Get all member IDs in the same organization
  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", userMember.organization_id);

  if (orgMembersError) {
    return { success: false, message: orgMembersError.message, data: [] };
  }

  const memberIds = orgMembers?.map(m => m.id) || [];
  if (memberIds.length === 0) {
    return { success: true, data: [] };
  }

  // Fetch member schedules ONLY for members in the same organization
  const { data, error } = await supabase
    .from("member_schedules")
    .select(`
      *,
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
        schedule_type
      )
    `)
    .in("organization_member_id", memberIds)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IMemberSchedule[] };
};

export const getMemberScheduleById = async (id: string) => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("member_schedules")
    .select(`
      *,
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
        schedule_type
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, data: data as IMemberSchedule };
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
    .insert(payload)
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
    .update({ ...payload, updated_at: new Date().toISOString() })
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