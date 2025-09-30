import { supabase } from "@/config/supabase-config";
import { IMemberSchedule } from "@/interface";



export const getAllMemberSchedule = async () => {
  const { data, error } = await supabase.from("member_schedules").select("*").order("created_at",{ascending:true});

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IMemberSchedule[] };
};