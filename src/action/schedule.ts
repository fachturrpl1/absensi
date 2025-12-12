"use server";
import { createClient } from "@/utils/supabase/server";

import { IWorkSchedule, IWorkScheduleDetail } from "@/interface"



export const getAllWorkSchedules = async (organizationId?: number | string) => {
    const supabase = await createClient();
    
    let finalOrgId = organizationId;
    
    // If no organizationId provided, get from current user
    if (!finalOrgId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, message: "User not authenticated", data: [] };
        }

        // Get user's organization membership
        const { data: member, error: memberError } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (memberError || !member) {
            return { success: false, message: "User not in any organization", data: [] };
        }
        
        finalOrgId = member.organization_id;
    }

    // Fetch work schedules ONLY for user's organization
    const { data, error } = await supabase
        .from("work_schedules")
        .select("*, work_schedule_details(*)")
        .eq("organization_id", finalOrgId)
        .order("created_at", { ascending: false });

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
};
export async function getWorkScheduleById(id: string) {
    const supabase = await createClient();
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
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedule_details")
        .select("*")
        .eq("work_schedule_id", workScheduleId)

    if (error) return { success: false, message: error.message }
    return { success: true, data }
}

export async function createWorkSchedule(payload: Partial<IWorkSchedule>) {
    const supabase = await createClient();
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

export async function updateWorkSchedule(id: string | number, payload: Partial<IWorkSchedule>) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedules")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", String(id))
        .select()
        .single()

    if (error) {
        console.error('❌ Update Work Schedule Error:', error);
        return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data as IWorkSchedule, message: "Schedule updated successfully" };
}


export const deleteWorkSchedule = async ( scheduleId: string | number) => {
     const id = String(scheduleId) // convert to string
    const supabase = await createClient();
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
    const supabase = await createClient();
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

export async function updateWorkScheduleDetail(id: string | number, payload: Partial<IWorkScheduleDetail>) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedule_details")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", String(id))
        .select()
        .single()

    if (error) {
        console.error('❌ Update Work Schedule Detail Error:', error);
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Schedule detail updated successfully", data: data as IWorkScheduleDetail };
}

export const deleteWorkScheduleDetail = async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("work_schedule_details").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "deleted successfully", data: data as IWorkScheduleDetail };
};

