"use server";

import { revalidatePath } from "next/cache";

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
          timezone,
          time_format
        )
      )
    `);

  if (error) {
    console.error("❌ Error fetching attendance:", error);
    return { success: false, data: [] };
  }

  // Transform format so timezone and time_format are available directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = (data || []).map((item: any) => ({
    ...item,
    timezone: item.organization_members?.organizations?.timezone || "Asia/Jakarta",
    time_format: item.organization_members?.organizations?.time_format || "24h",
  }));

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

export async function createManualAttendance(payload: ManualAttendancePayload) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("attendance_records").insert([payload]);

  if (error) {
    console.error("❌ Error creating attendance:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/attendance");

  return { success: true };
}
