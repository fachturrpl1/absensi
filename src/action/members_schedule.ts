"use server";
import { createSupabaseClient } from "@/config/supabase-config";
import { IMemberSchedule } from "@/interface";

export const getAllMemberSchedule = async (organizationId?: string) => {
  const supabase = await createSupabaseClient();
  
  let query = supabase
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
    .order("created_at", { ascending: false });

  if (organizationId) {
    const { data: members } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId);
    
    if (members) {
      const memberIds = members.map(m => m.id);
      query = query.in("organization_member_id", memberIds);
    }
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IMemberSchedule[] };
};

export const getMemberScheduleById = async (id: string) => {
  const supabase = await createSupabaseClient();
  
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
  const supabase = await createSupabaseClient();
  
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
  const supabase = await createSupabaseClient();
  
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
  const supabase = await createSupabaseClient();
  
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