"use server";

import { createClient } from "@/utils/supabase/server";

export interface ITask {
    id: number;
    project_id: number;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    start_date?: string;
    due_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    created_at: string;
    updated_at: string;
}

export const getAllTasks = async (projectId?: number | string) => {
    const supabase = await createClient();

    if (!projectId) {
        return { success: false, message: "Project ID is required", data: [] };
    }

    const { data, error } = await supabase
        .from("tasks") // Assuming there's a tasks table, if not, it will return empty or throw
        .select("*")
        .eq("project_id", projectId)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

    if (error) {
        if (error.code === '42P01') {
            // Table doesn't exist
            return { success: false, message: "Tasks table does not exist", data: [] };
        }
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: (data || []) as unknown as ITask[] };
};
