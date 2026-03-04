"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserOrganization } from "@/utils/get-user-org";
import { IClient } from "@/interface";

async function getSupabase() {
    return await createClient();
}

/**
 * Fetch all clients for the current organization
 */
export const getClients = async (organizationId?: string | number) => {
    const supabase = await getSupabase();
    let targetOrgId = organizationId;

    if (!targetOrgId) {
        try {
            targetOrgId = await getUserOrganization(supabase);
        } catch (error) {
            console.error("getClients: org resolution failed:", error);
            return { success: false, message: "Unauthorized or no organization found", data: [] };
        }
    }

    const { data, error } = await supabase
        .from("clients")
        .select(`
            *,
            projects (
                id,
                name,
                tasks (id)
            )
        `)
        .eq("organization_id", targetOrgId)
        .order("name", { ascending: true });

    if (error) {
        console.error("getClients error:", error);
        return { success: false, message: error.message, data: [] };
    }

    return {
        success: true,
        data: data?.map((client: any) => ({
            ...client,
            project_count: client.projects?.length || 0,
            task_count: client.projects?.reduce((acc: number, proj: any) => acc + (proj.tasks?.length || 0), 0) || 0
        })) as IClient[]
    };
};

/**
 * Create a new client
 */
export const createClientAction = async (formData: FormData) => {
    const supabase = await getSupabase();
    const project_ids_raw = formData.get("project_ids") as string;
    const projectIds = project_ids_raw ? JSON.parse(project_ids_raw) : [];

    // Extract client data from FormData
    const clientData: Partial<IClient> = {
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        status: (formData.get("status") as any) || 'active',
        budget_type: formData.get("budget_type") as any,
        budget_amount: formData.get("budget_amount") ? parseFloat(formData.get("budget_amount") as string) : null,
        notify_percentage: formData.get("notify_percentage") ? parseInt(formData.get("notify_percentage") as string) : 80,
        invoice_notes: formData.get("invoice_notes") as string,
        net_terms_days: formData.get("net_terms_days") ? parseInt(formData.get("net_terms_days") as string) : 30,
        auto_invoice_frequency: formData.get("auto_invoice_frequency") as string
    };

    const { data, error } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }

    if (projectIds && projectIds.length > 0) {
        const clientProjects = projectIds.map((projectId: number) => ({
            client_id: data.id,
            project_id: projectId
        }));
        await supabase.from("client_projects").insert(clientProjects);
    }

    return { success: true, message: "Client created successfully", data: data as IClient };
};

/**
 * Update an existing client
 */
export const updateClientAction = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = Number(formData.get("id"));
    const project_ids_raw = formData.get("project_ids") as string;
    const projectIds = project_ids_raw ? JSON.parse(project_ids_raw) : undefined;

    const clientData: Partial<IClient> = {
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        budget_type: formData.get("budget_type") as any,
        budget_amount: formData.get("budget_amount") ? parseFloat(formData.get("budget_amount") as string) : null,
        notify_percentage: formData.get("notify_percentage") ? parseInt(formData.get("notify_percentage") as string) : 80,
        invoice_notes: formData.get("invoice_notes") as string,
        net_terms_days: formData.get("net_terms_days") ? parseInt(formData.get("net_terms_days") as string) : 30,
        auto_invoice_frequency: formData.get("auto_invoice_frequency") as string
    };

    const { data, error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }

    if (projectIds !== undefined) {
        await supabase.from("client_projects").delete().eq("client_id", id);
        if (projectIds.length > 0) {
            const clientProjects = projectIds.map((projectId: number) => ({
                client_id: id,
                project_id: projectId
            }));
            await supabase.from("client_projects").insert(clientProjects);
        }
    }

    return { success: true, message: "Client updated successfully", data: data as IClient };
};

/**
 * Archive/Restore a client (soft delete or status change)
 */
export const updateClientStatus = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = Number(formData.get("id"));
    const status = formData.get("status") as 'active' | 'archived';

    const { error } = await supabase
        .from("clients")
        .update({ status })
        .eq("id", id);

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: `Client ${status === 'archived' ? 'archived' : 'restored'} successfully` };
};

/**
 * Delete a client
 */
export const deleteClientAction = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = Number(formData.get("id"));

    const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: "Client deleted successfully" };
};
