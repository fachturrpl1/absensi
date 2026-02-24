"use server"

import { createClient } from "@/utils/supabase/server";

export const checkDatabaseCounts = async () => {
    const supabase = await createClient();

    const { data: tasks } = await supabase
        .from("tasks")
        .select("id, project_id, project:projects(organization_id)")
        .limit(10);

    const { data: projects } = await supabase
        .from("projects")
        .select("id, organization_id, name")
        .limit(10);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: member } = user ? await supabase
        .from("organization_members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() : { data: null };

    console.log("DEBUG: Resolved member:", member);

    // Check raw tasks without filters (except org if possible)
    const { data: rawTasks, error: rawError } = await supabase
        .from("tasks")
        .select("id, name, project_id")
        .limit(10);

    // Membership checks
    const { count: projectMemberCount } = member ? await supabase
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_member_id", member.id) : { count: 0 };

    const { count: taskAssigneeCount } = member ? await supabase
        .from("task_assignees")
        .select("*", { count: "exact", head: true })
        .eq("organization_member_id", member.id) : { count: 0 };

    // Exact query used in getTasks
    const { data: exactTasks, error: exactError } = member?.organization_id ? await supabase
        .from("tasks")
        .select(`
            id,
            name,
            project:projects!inner (
                id,
                name,
                organization_id
            )
        `)
        .eq("project.organization_id", member.organization_id)
        .limit(10) : { data: null, error: { message: "member.organization_id is null/undefined" } };

    // Check for any members at all
    const { data: allMembers, error: membersError } = await supabase
        .from("organization_members")
        .select("id, organization_id, user_id")
        .limit(10);

    const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .limit(20);

    const { data: ameliaClient } = await supabase
        .from("clients")
        .select("*")
        .ilike("name", "%Amelia%")
        .maybeSingle();

    // Check getClients action
    const { getClients } = await import("@/action/client");
    const clientsResult = await getClients();

    return {
        userId: user?.id,
        userEmail: user?.email,
        memberRecord: member,
        allMembersCount: allMembers?.length,
        allMembers: allMembers,
        userOrgId: member?.organization_id,
        projectMemberCount,
        taskAssigneeCount,
        rawTasksCount: rawTasks?.length,
        rawError,
        exactTasksCount: exactTasks?.length,
        exactError,
        tasks: tasks?.map(t => ({ id: t.id, project_id: t.project_id, org_id: (t.project as any)?.organization_id })),
        projects: projects?.map(p => ({ id: p.id, org_id: p.organization_id, name: p.name })),
        organizations: orgs,
        ameliaClient,
        clientsResult,
        membersError
    };
};
