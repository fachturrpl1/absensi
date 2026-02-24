import { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
export async function getUserOrganization(supabase: SupabaseClient) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const cookieStore = await cookies();
  const activeOrgIdStr = cookieStore.get('org_id')?.value;
  const activeOrgId = activeOrgIdStr ? parseInt(activeOrgIdStr, 10) : null;

  let query = supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (activeOrgId) {
    query = query.eq("organization_id", activeOrgId);
  }

  const { data: member, error: memberError } = await query.limit(1).maybeSingle();

  if (memberError || !member?.organization_id) {
    throw new Error('No organization found');
  }

  return member.organization_id;
}