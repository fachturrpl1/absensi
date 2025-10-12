import { SupabaseClient } from "@supabase/supabase-js";

export async function getUserOrganization(supabase: SupabaseClient) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (memberError || !member?.organization_id) {
    throw new Error('No organization found');
  }

  return member.organization_id;
}