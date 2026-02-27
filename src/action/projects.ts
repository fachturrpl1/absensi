"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
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
        teams?: {
            id: number;
            name: string;
            team_members?: {
                id: number;
                role: string;
                organization_members?: {
                    id: number;
                    user_id: string;
                    user_profiles?: {
                        id: string;
                        first_name: string;
                        last_name: string;
                        profile_photo_url: string;
                    }
                }
            }[];
        };
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

    console.log(`[ACTION getAllProjects] Received orgId: ${organizationId}, Resolved finalOrgId: ${finalOrgId}`);

    // Step 1: Fetch projects with basic team info (team names) + task count + client
    const { data, error } = await supabase
        .from("projects")
        .select(`
            *,
            organizations(id, name),
            team_projects(team_id, teams(id, name)),
            tasks(count),
            client_projects(client_id, clients(id, name))
        `)
        .eq("organization_id", finalOrgId)
        .neq("status", "deleted")
        .order("name", { ascending: true });

    if (error) {
        console.error("Supabase fetch error in getAllProjects:", error.message, error.details, error.hint);
        return { success: false, message: error.message, data: [] };
    }

    // Step 2: Collect all team_ids from all projects
    const allTeamIds: number[] = [];
    (data || []).forEach((proj: any) => {
        (proj.team_projects || []).forEach((tp: any) => {
            if (tp.team_id && !allTeamIds.includes(tp.team_id)) {
                allTeamIds.push(tp.team_id);
            }
        });
    });

    console.log("[getAllProjects] allTeamIds:", allTeamIds);

    // Step 3: Fetch all team members for those teams (use adminClient to bypass RLS)
    const adminClient = createAdminClient();
    const teamMembersByTeamId: Record<number, any[]> = {};
    if (allTeamIds.length > 0) {
        const { data: tmData, error: tmError } = await adminClient
            .from("team_members")
            .select(`
                team_id,
                organization_member_id,
                role,
                organization_members!team_members_organization_member_id_fkey(
                    id,
                    user_id,
                    user:user_id(
                        id,
                        first_name,
                        last_name,
                        profile_photo_url
                    )
                )
            `)
            .in("team_id", allTeamIds);

        console.log("[getAllProjects] team_members query error:", tmError);
        console.log("[getAllProjects] team_members count:", tmData?.length, "sample:", JSON.stringify(tmData?.slice(0, 1), null, 2));

        if (!tmError && tmData) {
            tmData.forEach((tm: any) => {
                const tid = tm.team_id as number;
                if (!teamMembersByTeamId[tid]) {
                    teamMembersByTeamId[tid] = [];
                }
                teamMembersByTeamId[tid].push(tm);
            });
        }
    }

    // Step 4: Inject team_members into each project's team_projects
    const enrichedData = (data || []).map((proj: any) => ({
        ...proj,
        team_projects: (proj.team_projects || []).map((tp: any) => ({
            ...tp,
            teams: tp.teams ? {
                ...tp.teams,
                team_members: teamMembersByTeamId[tp.team_id] || []
            } : null,
        })),
    }));

    return { success: true, data: enrichedData as unknown as IProject[] };
};

export const createProject = async (payload: {
    name: string;
    is_billable?: boolean;
    metadata?: any;
    teams?: number[];
}, organizationId?: number) => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthenticated" };

    let orgId = organizationId;
    if (!orgId) {
        try {
            orgId = await getUserOrganization(supabase);
        } catch (error: any) {
            return { success: false, message: error.message || "Failed to get organization" };
        }
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

/**
 * Fetch a flat list of { id, name } for member dropdown pickers.
 * Uses admin client so RLS doesn't block results.
 */
export const getSimpleMembersForDropdown = async (organizationId: number | string) => {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
        .from("organization_members")
        .select(`
            id,
            user_profiles!organization_members_user_id_fkey(
                id,
                first_name,
                last_name,
                display_name,
                profile_photo_url
            )
        `)
        .eq("organization_id", organizationId)
        .eq("is_active", true);

    if (error) {
        console.error("[getSimpleMembersForDropdown] error:", error.message);
        return { success: false, data: [] as { id: string; name: string }[] };
    }

    const members = (data || []).map((m: any) => {
        const profile = m.user_profiles;
        const name = profile
            ? ([profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.display_name || "Unknown")
            : "Unknown";
        return { id: String(m.id), name };
    }).filter(m => m.name !== "Unknown");

    console.log("[getSimpleMembersForDropdown] count:", members.length);
    return { success: true, data: members };
};

/**
 * Fetch a single project by ID with its team members
 */
export const getProjectWithMembers = async (id: string | number) => {
    const adminClient = createAdminClient();

    const { data: project, error: projectError } = await adminClient
        .from("projects")
        .select(`
            *,
            organizations(id, name),
            client_projects(client_id, clients(id, name))
        `)
        .eq("id", id)
        .single();

    if (projectError || !project) {
        return { success: false, message: projectError?.message || "Project not found", data: null };
    }

    // Fetch team IDs first
    const { data: tpData } = await adminClient
        .from("team_projects")
        .select("team_id")
        .eq("project_id", id);

    const teamIds = (tpData || []).map(tp => tp.team_id);

    if (teamIds.length === 0) {
        return {
            success: true,
            data: {
                ...project,
                clientName: (project as any).client_projects?.[0]?.clients?.name ?? null,
                members: []
            }
        };
    }

    // Fetch team members linked to this project via teams
    const { data: teamMembers, error: tmError } = await adminClient
        .from("team_members")
        .select(`
            team_id,
            organization_members!team_members_organization_member_id_fkey(
                id,
                user_id,
                user:user_id(
                    id,
                    first_name,
                    last_name,
                    profile_photo_url
                )
            )
        `)
        .in("team_id", teamIds);

    if (tmError) {
        console.error("[getProjectWithMembers] team_members error:", tmError);
    }

    // Map to a clean list of members
    const memberMap = new Map();
    (teamMembers || []).forEach((tm: any) => {
        const profile = tm.organization_members?.user;
        if (profile) {
            const uid = profile.id || tm.organization_members?.user_id;
            if (!memberMap.has(uid)) {
                const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown";
                memberMap.set(uid, {
                    id: String(tm.organization_members.id), // We need organization_member_id for routes
                    userId: uid,
                    name,
                    photoUrl: profile.profile_photo_url
                });
            }
        }
    });

    const result = {
        ...project,
        clientName: (project as any).client_projects?.[0]?.clients?.name ?? null,
        members: Array.from(memberMap.values())
    };

    return { success: true, data: result };
};

export const getProjectNames = async (organizationId: number | string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("organization_id", organizationId)
        .neq("status", "deleted");

    if (error) return { success: false, data: [] };
    return { success: true, data: data || [] };
};
