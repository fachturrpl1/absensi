"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { IAttendance } from "@/interface";

import { attendanceLogger } from '@/lib/logger';
async function getSupabase() {
  return await createClient();
}

export const getAllAttendance = async () => {
  const supabase = await getSupabase();

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

  // Get all member IDs in the same organization
  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", userMember.organization_id);

  if (orgMembersError) {
    attendanceLogger.error("❌ Error fetching organization members:", orgMembersError);
    return { success: false, data: [] };
  }

  const memberIds = orgMembers?.map(m => m.id) || [];
  if (memberIds.length === 0) {
    return { success: true, data: [] };
  }

  // Fetch attendance records ONLY for members in the same organization
  const { data, error } = await supabase
    .from("attendance_records")
    .select(`
      id,
      organization_member_id,
      attendance_date,
      actual_check_in,
      actual_check_out,
      status,
      created_at,
      organization_members:organization_member_id (
        id,
        user_id,
        organization_id,
        organizations:organization_id (
          id,
          name,
          timezone,
          time_format
        )
      )
    `)
    .in("organization_member_id", memberIds);

  if (error) {
    attendanceLogger.error("❌ Error fetching attendance:", error);
    return { success: false, data: [] };
  }

  // Transform format so timezone and time_format are available directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = (data || []).map((item: any) => ({
    ...item,
    timezone: item.organization_members?.organizations?.timezone || "Asia/Jakarta",
    time_format: item.organization_members?.organizations?.time_format || "24h",
  }));

  attendanceLogger.debug(`✅ Fetched ${mapped.length} attendance records for organization ${userMember.organization_id}`);
  return { success: true, data: mapped as IAttendance[] };
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
