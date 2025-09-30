"use server";
import { createClient } from "@/utils/supabase/server";
import { IAttendance } from "@/interface";

// Helper function to get the supabase client
async function getSupabase() {
  return await createClient();
}

// // ➕ Add MemIOrganization_member
// export const addOrganization_member = async (Organization_member: Partial<IOrganization_member>) => {
//   const { data, error } = await supabase.from("Organization_members").insert([Organization_member]).select().single();

//   if (error) {
//     return { success: false, message: error instanceof Error ? error.message : 'Unknown error', data: null };
//   }
//   return { success: true, message: "Show added successfully", data: data as IOrganization_member };
// };

export const getAllAttendance = async () => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("attendance_records").select("*").order("created_at",{ascending:true});

  if (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error', data: [] };
  }

  return { success: true, data: data as IAttendance[] };
};

export async function updateAttendanceStatus(id: string, status: string) {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from("attendance_records")
      .update({ status })
      .eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error' }
  }
}
