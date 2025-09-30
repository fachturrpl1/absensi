"use server";
import { createSupabaseClient } from "@/config/supabase-config";

import { IWorkSchedule, IWorkScheduleDetail } from "@/interface"



export const getAllWorkSchedules = async () => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from("work_schedules")
        .select("*, work_schedule_details(*)")
        .order("created_at", { ascending: false })

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
};
export async function getWorkScheduleById(id: string) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("work_schedules")
        .select("*, work_schedule_details(*)")
        .eq("id", id)
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
}
export async function getWorkScheduleDetails(workScheduleId: number) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("work_schedule_details")
        .select("*")
        .eq("work_schedule_id", workScheduleId)

    if (error) return { success: false, message: error.message }
    return { success: true, data }
}

export async function createWorkSchedule(payload: Partial<IWorkSchedule>) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("work_schedules")
        .insert(payload)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
}

export async function updateWorkSchedule(id: string, payload: Partial<IWorkSchedule>) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("work_schedules")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
}


export const deleteWorkSchedule = async ( scheduleId: string | number) => {
     const id = String(scheduleId) // konversi ke string
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("work_schedules").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Deleted successfully", data: data as IWorkSchedule };
};

// ---------------- WorkScheduleDetail ----------------
export async function createWorkScheduleDetail(payload: Partial<IWorkScheduleDetail>) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("work_schedule_details")
        .insert(payload)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Schedule added successfully", data: data as IWorkScheduleDetail };
};

export async function updateWorkScheduleDetail(id: string, payload: Partial<IWorkScheduleDetail>) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("work_schedule_details")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

  if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Schedule Updated successfully", data: data as IWorkScheduleDetail };
}

export const deleteWorkScheduleDetail = async (id: string) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("work_schedule_details").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "deleted successfully", data: data as IWorkScheduleDetail };
};

