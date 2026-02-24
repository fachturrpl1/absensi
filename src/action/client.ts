"use server";

import { createClient } from "@/utils/supabase/server";
import { IClient } from "@/interface";

async function getSupabase() {
    return await createClient();
}

/**
 * Fetch all clients for the current organization
 */
export const getClients = async (organizationId?: string) => {
    const supabase = await getSupabase();

    let targetOrgId = organizationId;

    if (!targetOrgId) {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("DEBUG: getClients - auth user:", user?.id, user?.email);
        if (!user) return { success: false, message: "Unauthorized", data: [] };

        const { data: member, error: memError } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .maybeSingle();

        console.log("DEBUG: getClients - organization_members record:", member, "Error:", memError);

        if (!member) return { success: true, message: "No organization found", data: [] };
        targetOrgId = member.organization_id;
    }

    console.log("DEBUG: getClients - final targetOrgId:", targetOrgId);

    // Fetch clients and join with projects via client_projects
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

    // Process counts and handle potential double nesting for many-to-many if Supabase returns it differently
    const processedData = data?.map((client: any) => ({
        ...client,
        project_count: client.projects?.length || 0,
        task_count: client.projects?.reduce((acc: number, proj: any) => acc + (proj.tasks?.length || 0), 0) || 0
    }));

    return {
        success: true,
        data: processedData as IClient[],
        debug: {
            authUserId: (await supabase.auth.getUser()).data.user?.id,
            resolvedOrgId: targetOrgId,
            memberRecord: (await supabase.from("organization_members").select("*").eq("user_id", (await supabase.auth.getUser()).data.user?.id).maybeSingle()).data
        }
    };
};

/**
 * Create a new client
 */
export const createClientAction = async (clientData: Partial<IClient>, projectIds?: number[]) => {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }

    if (projectIds && projectIds.length > 0) {
        const clientProjects = projectIds.map(projectId => ({
            client_id: data.id,
            project_id: projectId
        }));
        const { error: cpError } = await supabase.from("client_projects").insert(clientProjects);
        if (cpError) console.error("Error creating client projects:", cpError);
    }

    return { success: true, message: "Client created successfully", data: data as IClient };
};

/**
 * Update an existing client
 */
export const updateClientAction = async (id: number, clientData: Partial<IClient>, projectIds?: number[]) => {
    const supabase = await getSupabase();

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
        // Sync project_clients
        await supabase.from("client_projects").delete().eq("client_id", id);
        if (projectIds.length > 0) {
            const clientProjects = projectIds.map(projectId => ({
                client_id: id,
                project_id: projectId
            }));
            const { error: cpError } = await supabase.from("client_projects").insert(clientProjects);
            if (cpError) console.error("Error updating client projects:", cpError);
        }
    }

    return { success: true, message: "Client updated successfully", data: data as IClient };
};

/**
 * Archive/Restore a client (soft delete or status change)
 */
export const updateClientStatus = async (id: number, status: 'active' | 'archived') => {
    const supabase = await getSupabase();

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
export const deleteClientAction = async (id: number) => {
    const supabase = await getSupabase();

    const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: "Client deleted successfully" };
};
