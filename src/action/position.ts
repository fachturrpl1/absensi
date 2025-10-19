
"use server";
import {supabase} from "@/config/supabase-config";
import { IPositions } from "@/interface";
import { createClient } from "@/utils/supabase/server";

export const getAllPositions = async () => {
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
    .from("positions")
    .select("*")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IPositions[] };
};

export async function createPositions(payload: Partial<IPositions>) {
    const { data, error } = await supabase
        .from("positions")
        .insert(payload)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPositions[] };
}

export async function updatePositions(id: string, payload: Partial<IPositions>) {
    const { data, error } = await supabase
        .from("positions")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPositions[] };
}


export const deletePositions = async ( PositionsId: string | number) => {
     const id = String(PositionsId) // convert to string
    const { data, error } = await supabase
        .from("positions").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Deleted successfully", data: data as IPositions };
};
