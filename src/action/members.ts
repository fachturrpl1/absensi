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
    return { success: true, message: "User not registered in any organization", data: [] };
  }

  // 3. Ambil semua member sesuai org
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

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