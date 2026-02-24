"use server";

import { createClient } from "@/utils/supabase/server";

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
}

export const getAllProjects = async (organizationId?: number | string) => {
    const supabase = await createClient();

    let finalOrgId = organizationId;

    if (!finalOrgId) {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, message: "User not authenticated", data: [] };
        }

        const { data: member, error: memberError } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (memberError || !member) {
            return { success: false, message: "User not in any organization", data: [] };
        }

        finalOrgId = member.organization_id;
    }

    // Fetch projects joined with organizations for the Client Name fallback
    const { data, error } = await supabase
        .from("projects")
        .select(`
      *,
      organizations(id, name)
    `)
        .eq("organization_id", finalOrgId)
        .neq("status", "deleted")
        .order("name", { ascending: true });

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: (data || []) as unknown as IProject[] };
};
