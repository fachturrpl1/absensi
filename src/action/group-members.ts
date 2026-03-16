"use server"
import { createClient } from "@/utils/supabase/server"

export const getMembersByGroupId = async (groupId: string) => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      *,
      user:user_id (
        id,
        email,
        first_name,
        last_name,
        display_name
      )
    `)
    .eq("department_id", groupId)
    .eq("is_active", true) // Tambah filter active

  if (error) {
    return { success: false, message: error.message, data: [] }
  }

  // Transform data ke format yang konsisten
  const members = (data || []).map((member: any) => ({
    id: String(member.id),
    user_id: member.user_id,
    group_id: groupId,
    user_name: member.user 
      ? `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim() || member.user.display_name 
      : 'Unknown Member',
    user_email: member.user?.email || '',
    joined_at: member.created_at || new Date().toISOString(),
    is_active: member.is_active ?? true,
  }))

  return { success: true, data: members }
}
