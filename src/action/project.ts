"use server";

import { createClient } from "@/utils/supabase/server";
import { IProject } from "@/interface";

async function getSupabase() {
    return await createClient();
}

/**
 * Fetch all projects for the current organization
 */
export const getProjects = async (organizationId?: string) => {
    const supabase = await getSupabase();

    let targetOrgId = organizationId;

    if (!targetOrgId) {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("getProjects: user found:", user?.id);
        if (!user) return { success: false, message: "Unauthorized", data: [] };

        const { data: member } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .maybeSingle();

        console.log("getProjects: member org:", member?.organization_id);
        if (!member) return { success: true, message: "No organization found", data: [] };
        targetOrgId = member.organization_id;
    }

    console.log("getProjects: fetching for org:", targetOrgId);

    const { data, error } = await supabase
        .from("projects")
        .select(`
            *,
            clients (id, name),
            tasks (id)
        `)
        .eq("organization_id", targetOrgId)
        .order("name", { ascending: true });

    if (error) {
        console.error("getProjects error:", error);
        return { success: false, message: error.message, data: [] };
    }

    return {
        success: true,
        data: data?.map((p: any) => ({
            ...p,
            client_count: p.clients?.length || 0,
            task_count: p.tasks?.length || 0,
            clientName: p.clients?.[0]?.name || null
        })) as IProject[]
    };
};
