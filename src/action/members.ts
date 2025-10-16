"use server";
import { createClient } from "@/utils/supabase/server";
import { IOrganization_member } from "@/interface";

// Helper function to get the supabase client
async function getSupabase() {
  return await createClient();
}

// ➕ Add MemIOrganization_member
export const createOrganizationMember = async (Organization_member: Partial<IOrganization_member>) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("organization_members").insert([Organization_member]).select().single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Members added successfully", data: data as IOrganization_member };
};
export const getAllOrganization_member = async () => {
  const supabase = await getSupabase();

  // 1. Ambil user dari cookies
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Debug logging to help diagnose missing members
  // eslint-disable-next-line no-console
  console.debug('getAllOrganization_member - auth.getUser result', { user, userError });

  if (userError || !user) {
    return { success: false, message: "User not logged in", data: [] };
  }

  // 2. Cari organization_id user
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    // eslint-disable-next-line no-console
    console.debug('getAllOrganization_member - user has no organization_members entry for user id', user.id)
    return { success: true, message: "User not registered in any organization", data: [] };
  }

  // 3. Ambil semua member sesuai org
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('getAllOrganization_member - error fetching organization_members for org', error)
    return { success: false, message: error.message, data: [] };
  }

  // eslint-disable-next-line no-console
  console.debug('getAllOrganization_member - fetched members count', Array.isArray(data) ? data.length : 0)
  return { success: true, data: data as IOrganization_member[] };
};

// ✏️ Update Organization
export const updateOrganizationMember = async (id: string, organization: Partial<IOrganization_member>) => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("organization_members")
    .update(organization)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization updated successfully", data: data as IOrganization_member };
};
export const deleteOrganization_member = async (id: string) => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization Members deleted successfully", data: data as IOrganization_member };
};


export const getOrganizationMembersById = async (id: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
    *,
    rfid_cards (card_number, card_type)
  `)
    .eq("id", id)
    .single()

  if (error) {
    return { success: false, message: error.message, data: null }
  }

  // If the member row exists, also fetch related user, department and position records
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const member: any = data

    if (member) {
      // Fetch user profile
      if (member.user_id) {
        const { data: userData, error: userError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", member.user_id)
          .maybeSingle()

        if (!userError && userData) member.user = userData
      }

      // Fetch department (group)
      if (member.department_id) {
        const { data: deptData, error: deptError } = await supabase
          .from("departments")
          .select("*")
          .eq("id", member.department_id)
          .maybeSingle()

        if (!deptError && deptData) member.departments = deptData
      }

      // Fetch position
      if (member.position_id) {
        const { data: posData, error: posError } = await supabase
          .from("positions")
          .select("*")
          .eq("id", member.position_id)
          .maybeSingle()

        if (!posError && posData) member.positions = posData
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('getOrganizationMembersById: failed to fetch related records', e)
  }

  return { success: true, data }
}

export const getDepartmentMembersByOrganization = async (organizationId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("departments")
    .select(
      `
      id,
      name,
      organization_members:organization_members!department_id (id)
      `
    )
    .eq("organization_id", organizationId);

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  const result = (data || []).map((dept) => ({
    department: dept.name,
    members: dept.organization_members ? dept.organization_members.length : 0,
  }));

  return { success: true, data: result };
};


export const getUserOrganizationId = async (userId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle(); // supaya bisa null kalau tidak ada

  if (error) {
    return { success: false, message: error.message, organizationId: null };
  }

  if (!data) {
    // user belum terdaftar di organization_members
    return { success: true, message: "User not in organization", organizationId: null };
  }

  return { success: true, message: "Organization found", organizationId: data.organization_id };
};