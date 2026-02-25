"use server";

import { createClient } from "@/utils/supabase/server";
import { ITask } from "@/interface";

async function getSupabase() {
    return await createClient();
}

/**
 * Fetch all tasks for the current user's organization
 */
export const getTasks = async (organizationId?: string) => {
    const supabase = await getSupabase();

    let targetOrgId = organizationId;

    if (!targetOrgId) {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("getTasks: user found:", user?.id);
        if (!user) return { success: false, message: "Unauthorized", data: [] };

        const { data: member } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .maybeSingle();

        console.log("getTasks: member org:", member?.organization_id);
        if (!member) return { success: true, message: "No organization found", data: [] };
        targetOrgId = member.organization_id;
    }

    console.log("getTasks: fetching for org:", targetOrgId);

    // Fetch tasks from the optimized view which has all details pre-aggregated
    const { data, error } = await supabase
        .from("tasks_with_details")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("created_at", { ascending: false });

    console.log("getTasks: query result count:", data?.length, "error:", error);

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    // Map the flattened view data back to the nested structure expected by ITask
    const processedData = data?.map((task: any) => ({
        ...task,
        project: {
            id: task.project_id,
            name: task.project_name,
            client: task.client_name ? [{ id: task.client_id, name: task.client_name }] : []
        }
    }));

    return { success: true, data: processedData as unknown as ITask[] };
};

/**
 * Create a new task
 */
export const createTask = async (task: Partial<ITask>) => {
    const supabase = await getSupabase();
    const { data, error } = await supabase
        .from("tasks")
        .insert([task])
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Task created successfully", data: data as ITask };
};

/**
 * Update an existing task
 */
export const updateTask = async (id: string, task: Partial<ITask>) => {
    const supabase = await getSupabase();
    const { data, error } = await supabase
        .from("tasks")
        .update(task)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Task updated successfully", data: data as ITask };
};

/**
 * Delete a task
 */
export const deleteTask = async (id: string) => {
    const supabase = await getSupabase();
    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: "Task deleted successfully" };
};

/**
 * Assign a member to a task
 */
export const assignTaskMember = async (taskId: number, memberId: number, role: string = 'assignee') => {
    const supabase = await getSupabase();
    const { data, error } = await supabase
        .from("task_assignees")
        .insert([{ task_id: taskId, organization_member_id: memberId, role }])
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, data };
};
