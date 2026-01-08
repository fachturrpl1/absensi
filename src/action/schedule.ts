"use server";
import { createClient } from "@/utils/supabase/server";

import { IWorkSchedule, IWorkScheduleDetail } from "@/interface"


const toScheduleCode = (name?: string, code?: string) => {
    const existing = typeof code === "string" ? code.trim() : "";
    if (existing) return existing;

    const base = typeof name === "string" ? name.trim() : "";
    const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const safe = slug || "schedule";
    const suffix = Date.now().toString(36).slice(-6);
    return `${safe}-${suffix}`;
}



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
        .select(
            "id, organization_id, code, name, description, schedule_type, is_default, is_active, created_at, updated_at",
        )
        .eq("organization_id", finalOrgId)
        .order("created_at", { ascending: false });

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IWorkSchedule[] };
};

export const getWorkSchedulesPage = async (
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

            const { data: member, error: memberError } = await supabase
                .from("organization_members")
                .select("organization_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (memberError || !member) {
                return { success: false, message: "User not in any organization", data: [], total: 0 };
            }

            finalOrgId = member.organization_id;
        }

        const safePageIndex = Math.max(0, Number(pageIndex) || 0);
        const safePageSize = Math.max(1, Number(pageSize) || 10);
        const from = safePageIndex * safePageSize;
        const to = from + safePageSize - 1;

        const { data, error, count } = await supabase
            .from("work_schedules")
            .select(
                "id, organization_id, code, name, description, schedule_type, is_default, is_active, created_at, updated_at",
                { count: "estimated" },
            )
            .eq("organization_id", finalOrgId)
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            return { success: false, message: error.message, data: [], total: 0 };
        }

        return {
            success: true,
            data: (data || []) as IWorkSchedule[],
            total: typeof count === "number" ? count : (data?.length || 0),
        };
    } catch (error) {
        console.error("[getWorkSchedulesPage] Unexpected error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown server error",
            data: [],
            total: 0,
        };
    }
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

    const insertPayload: Partial<IWorkSchedule> = {
        ...payload,
        code: toScheduleCode(payload.name, payload.code),
    }

    const { data, error } = await supabase
        .from("work_schedules")
        .insert(insertPayload)
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

