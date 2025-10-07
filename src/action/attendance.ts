"use server";

import { createClient } from "@/utils/supabase/server";
import { IAttendance } from "@/interface";

async function getSupabase() {
  return await createClient();
}

export const getAllAttendance = async () => {
  const supabase = await getSupabase();

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
          timezone
        )
      )
    `);

  if (error) {
    console.error("❌ Error fetching attendance:", error);
    return { success: false, data: [] };
  }

  // Ubah format agar timezone muncul langsung
  const mapped = (data || []).map((item: any) => ({
    ...item,
    timezone:
      item.organization_members?.organizations?.timezone || "Asia/Jakarta",
  }));

  console.log("✅ Attendance fetched with timezone:", mapped);

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
