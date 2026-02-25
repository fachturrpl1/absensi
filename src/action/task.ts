"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserOrganization } from "@/utils/get-user-org";
import { ITask } from "@/interface";

async function getSupabase() {
    return await createClient();
}

/**
 * Fetch all tasks for the current organization
 */
export const getTasks = async (organizationId?: string | number) => {
    const supabase = await getSupabase();
    let targetOrgId = organizationId;

    if (!targetOrgId) {
        try {
            targetOrgId = await getUserOrganization(supabase);
        } catch (error) {
            console.error("getTasks: org resolution failed:", error);
            return { success: false, message: "Unauthorized or no organization found", data: [] };
        }
    }

    const { data, error } = await supabase
        .from("tasks_with_details")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("created_at", { ascending: false });

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return {
        success: true,
        data: data?.map((task: any) => ({
            ...task,
            project: {
                id: task.project_id,
                name: task.project_name,
                client: task.client_name ? [{ id: task.client_id, name: task.client_name }] : []
            }
        })) as ITask[]
    };
};

/**
 * Create a new task
 */
export const createTask = async (formData: FormData) => {
    const supabase = await getSupabase();
    const task: Partial<ITask> = {
        name: formData.get("name") as string,
        project_id: Number(formData.get("project_id")),
        status: (formData.get("status") as any) || "todo",
        priority: (formData.get("priority") as any) || "medium"
    };

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
export const updateTask = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = formData.get("id") as string;
    const task: Partial<ITask> = {};

    if (formData.has("name")) task.name = formData.get("name") as string;
    if (formData.has("status")) task.status = formData.get("status") as any;
    if (formData.has("priority")) task.priority = formData.get("priority") as any;
    if (formData.has("project_id")) task.project_id = Number(formData.get("project_id"));

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
export const deleteTask = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = formData.get("id") as string;

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
