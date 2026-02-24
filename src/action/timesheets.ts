"use server";

import { createClient } from "@/utils/supabase/server";

export interface AddManualTimePayload {
    organization_member_id: number;
    timesheet_id: number;
    date: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    notes?: string;
    activity_pct?: number;
    manual_pct?: number;
    source?: "desktop" | "web" | "manual" | "system";
    is_billable?: boolean;
    is_paid?: boolean;
    project_id?: string;
    task_id?: string;
}

export async function addManualTime(payload: AddManualTimePayload) {
    try {
        const supabase = await createClient();

        // Verify user authentication
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, message: "User not authenticated", data: null };
        }

        // Prepare insert payload
        const insertPayload = {
            ...payload,
            source: payload.source || "manual",
        };

        // Insert into timesheet_entries
        const { data, error } = await supabase
            .from("timesheet_entries")
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message, data: null };
        }

        // We successfully inserted the child record.
        // If the database has a trigger, it will automatically update the `total_manual_seconds` 
        // in the `timesheets` table. If not, we would need to manually update it here.
        // For now, depending on the DB setup, we assume the trigger handles aggregation or we can just return success.

        return {
            success: true,
            message: "Manual time added successfully",
            data
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown server error",
            data: null,
        };
    }
}
