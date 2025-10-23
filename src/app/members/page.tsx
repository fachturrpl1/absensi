import { ContentLayout } from "@/components/admin-panel/content-layout"
import { getAllOrganization_member } from "@/action/members"
import { getAllGroups } from "@/action/group"
import { getAllUsers } from "@/action/users"
import { createSupabaseClient } from "@/config/supabase-config"
import MembersClient from "./members-client"
import { IOrganization_member, IUser } from "@/interface"

// Server Component - fetch data di server
export default async function MembersPage() {
  const supabase = await createSupabaseClient()

  // Get organization ID
  const { data: { user } } = await supabase.auth.getUser()
  let organizationId = ""

  if (user) {
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (data) {
      organizationId = String(data.organization_id)
    }
  }

  // Fetch all data in parallel - 1 server round trip!
  const [memberRes, userRes, groupsRes] = await Promise.all([
    getAllOrganization_member(),
    getAllUsers(),
    getAllGroups(),
  ])

  const membersData = (memberRes.success ? memberRes.data : []) as IOrganization_member[]
  const usersData = (userRes.success ? userRes.data : []) as IUser[]
  const groupsData = groupsRes?.data || []

  // Create group map
  const groupMap = new Map<string, string>()
  groupsData.forEach((g: any) => {
    if (g && g.id) groupMap.set(String(g.id), g.name)
  })

  // Manual join: attach user and group to each member
  const mergedMembers = membersData.map((m) => {
    const u = usersData.find((usr) => usr.id === m.user_id)
    const groupName =
      groupMap.get(String(m.department_id)) ||
      (m.groups && (m.groups as any).name) ||
      (m.departments && (m.departments as any).name) ||
      ""
    return { ...m, user: u, groupName }
  })

  // Filter by organization
  const filteredMembers = organizationId
    ? mergedMembers.filter((m) => String(m.organization_id) === organizationId)
    : mergedMembers

  return (
    <ContentLayout title="Member List">
      <MembersClient initialMembers={filteredMembers} />
    </ContentLayout>
  )
}
