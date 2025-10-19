
"use server";
import {supabase} from "@/config/supabase-config";
import { IDepartments } from "@/interface";
import { createClient } from "@/utils/supabase/server";


export const getAllDepartments = async () => {
  const supabase = await createClient();

  // 1. Retrieve user from cookies
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "User not logged in", data: [] };
  }

  // 2. Find user's organization_id
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return { success: true, message: "User not registered in any organization", data: [] };
  }

  // 3. Fetch all members for the organization
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IDepartments[] };
};

export async function createDepartments(payload: Partial<IDepartments>) {
  const supabaseServer = await createClient();

  // 1. Retrieve logged-in user
  const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
  if (userError || !user) {
    return { success: false, message: "User not logged in", data: [] };
  }

  // 2. Find organization_id from organization_members
  const { data: member, error: memberError } = await supabaseServer
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError) {
    return { success: false, message: memberError.message, data: [] };
  }

  if (!member) {
    return { success: false, message: "User not registered in any organization", data: [] };
  }

  // 3. Insert department with matching organization_id
  const { data, error } = await supabase
    .from("departments")
    .insert({
      ...payload,
      organization_id: member.organization_id, // 👈 otomatis dari user
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IDepartments[] };
}


export async function updateDepartments(id: string, payload: Partial<IDepartments>) {
    const { data, error } = await supabase
        .from("departments")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IDepartments[] };
}


export const deleteDepartments = async ( departmentsId: string | number) => {
     const id = String(departmentsId) // convert to string
    const { data, error } = await supabase
        .from("departments").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Deleted successfully", data: data as IDepartments };
};
