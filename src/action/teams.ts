"use server";

import { createClient } from "@/utils/supabase/server";
import { ITeams, ITeamMember } from "@/interface";

// GET

export const getTeams = async (organizationId?: number, includeInactive: boolean = false) => {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { success: false, message: "User not logged in", data: [] as ITeams[] };
    }

    let targetOrgId = organizationId;

    if (!targetOrgId) {
        const { data: member } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!member) {
            return { success: true, message: "User not in any organization", data: [] as ITeams[] };
        }
        targetOrgId = member.organization_id;
    }

    let query = supabase
        .from("teams")
        .select("id, organization_id, code, name, description, is_active, created_at, updated_at, settings, metadata")
        .eq("organization_id", targetOrgId);

    if (!includeInactive) {
        query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
        console.error("getTeams error:", error);
        return { success: false, message: error.message, data: [] as ITeams[] };
    }

    return { success: true, data: data as ITeams[] };
};

export const getTeamBySlug = async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .or(`code.eq.${slug},id.cast.text.eq.${slug}`) // Bisa cari pakai code atau ID
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, data: data as ITeams };
};

export const getTeamMembers = async (teamId: number) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(`
      *,
      organization_members (
        id,
        is_active,
        user:users (
          name,
          profile_photo_url,
          email
        )
      )
    `)
    .eq("team_id", teamId);

  if (error) return { success: false, message: error.message };
  return { success: true, data: data as unknown as ITeamMember[] };
};

// CREATE

export const createTeam = async (payload: Partial<ITeams>) => {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { success: false, message: "User not logged in" };
    }

    const { data, error } = await supabase
        .from("teams")
        .insert([
            {
                organization_id: payload.organization_id,
                code: payload.code,
                name: payload.name,
                description: payload.description,
                is_active: payload.is_active ?? true,
                settings: payload.settings || null,
                metadata: payload.metadata || null,
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("createTeam error:", error);
        return { success: false, message: error.message };
    }

    return { success: true, message: "Team created successfully", data };
};

// UPDATE

export const updateTeam = async (id: number, payload: Partial<ITeams>) => {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { success: false, message: "User not logged in" };
    }

    const { data, error } = await supabase
        .from("teams")
        .update({
            code: payload.code,
            name: payload.name,
            description: payload.description,
            is_active: payload.is_active,
            settings: payload.settings || null,
            metadata: payload.metadata || null,
            updated_at: new Date().toISOString(), // Opsional: Hapus jika database sudah pakai trigger otomatis
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("updateTeam error:", error);
        return { success: false, message: error.message };
    }

    return { success: true, message: "Team updated successfully", data };
};

// DELETE

export const deleteTeam = async (id: number) => {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return { success: false, message: "User not logged in" };
    }

    // Catatan: Jika ada relasi (foreign keys) di tabel lain ke team_id,
    // pastikan di database sudah diset "ON DELETE CASCADE" atau handle dependensinya di sini.
    const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("deleteTeam error:", error);
        return { success: false, message: error.message };
    }

    return { success: true, message: "Team deleted successfully" };
};