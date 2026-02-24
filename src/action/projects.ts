"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserOrganization } from "@/utils/get-user-org";

export interface IProject {
    id: number;
    organization_id: number;
    code: string;
    name: string;
    description?: string;
    status: string;
    priority: string;
    start_date?: string;
    end_date?: string;
    is_billable: boolean;
    currency_code: string;
    budget_amount?: number;
    budget_hours?: number;
    color_code?: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
    deleted_at?: string;

    // Joined relation
    organizations?: {
        id: number;
        name: string;
    };
    team_projects?: {
        team_id: number;
    }[];
}

export const getAllProjects = async (organizationId?: number | string) => {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
        try {
            finalOrgId = await getUserOrganization(supabase);
        } catch (error: any) {
            console.error("Error fetching organization:", error);
            return { success: false, message: error.message || "Error fetching organization", data: [] };
        }
    }

    // Fetch projects joined with organizations and team_projects
    const { data, error } = await supabase
        .from("projects")
        .select(`
            *,
            organizations(id, name),
            team_projects(team_id)
        `)
        .eq("organization_id", finalOrgId)
        .neq("status", "deleted")
        .order("name", { ascending: true });

    if (error) {
        console.error("Supabase fetch error in getAllProjects:", error.message, error.details, error.hint);
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: (data || []) as unknown as IProject[] };
};

export const createProject = async (payload: {
    name: string;
    is_billable?: boolean;
    metadata?: any;
    teams?: number[];
}) => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthenticated" };

    let orgId: number;
    try {
        orgId = await getUserOrganization(supabase);
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to get organization" };
    }

    // Create auto-generated code
    const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

    // Fallback timestamp if count is somehow null
    const baseCount = count != null ? count + 1 : Date.now();
    const code = `PRJ-${orgId}-${baseCount}`;

    const { data, error } = await supabase
        .from("projects")
        .insert({
            organization_id: orgId,
            code,
            name: payload.name,
            is_billable: payload.is_billable !== false, // default true
            status: 'active',
            metadata: payload.metadata || {},
        })
        .select()
        .single();

    if (error) return { success: false, message: error.message };

    // Handle team_projects
    if (payload.teams && payload.teams.length > 0) {
        const teamProjects = payload.teams.map((teamId: number) => ({
            team_id: teamId,
            project_id: data.id
        }));
        await supabase.from("team_projects").insert(teamProjects);
    }

    return { success: true, data };
};

export const updateProject = async (id: number, payload: {
    name?: string;
    is_billable?: boolean;
    metadata?: any;
    teams?: number[];
    status?: string;
}) => {
    const supabase = await createClient();

    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.is_billable !== undefined) updateData.is_billable = payload.is_billable;
    if (payload.metadata !== undefined) updateData.metadata = payload.metadata;
    if (payload.status !== undefined) updateData.status = payload.status;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) return { success: false, message: error.message };

    if (payload.teams !== undefined) {
        // Delete old teams
        await supabase.from("team_projects").delete().eq("project_id", id);
        // Insert new teams
        if (payload.teams.length > 0) {
            const teamProjects = payload.teams.map((teamId: number) => ({
                team_id: teamId,
                project_id: id
            }));
            await supabase.from("team_projects").insert(teamProjects);
        }
    }

    return { success: true, data };
};

export const archiveProject = async (id: number) => {
    return updateProject(id, { status: "archived" });
};

export const unarchiveProject = async (id: number) => {
    return updateProject(id, { status: "active" });
};

export const deleteProject = async (id: number) => {
    const supabase = await createClient();

    // Provide soft-delete via status
    const { error } = await supabase
        .from("projects")
        .update({
            status: "deleted",
            deleted_at: new Date().toISOString()
        })
        .eq("id", id);

    if (error) return { success: false, message: error.message };
    return { success: true };
};
