import { ContentLayout } from "@/components/admin-panel/content-layout"
import { getAllMemberSchedule } from "@/action/members_schedule"
import { getAllOrganization_member } from "@/action/members"
import { getAllWorkSchedules } from "@/action/schedule"
import { createSupabaseClient } from "@/config/supabase-config"
import MemberSchedulesClient from "./member-schedules-client"
import { IMemberSchedule, IOrganization_member, IWorkSchedule } from "@/interface"

// Server Component - fetch data di server (SSR)
export default async function MemberSchedulesPage() {
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

  // Fetch all data di server - 1 round trip saja!
  const [schedulesRes, membersRes, workSchedulesRes] = await Promise.all([
    getAllMemberSchedule(organizationId),
    getAllOrganization_member(),
    getAllWorkSchedules(organizationId),
  ])

  const schedules = (schedulesRes.success ? schedulesRes.data : []) as IMemberSchedule[]
  const members = (membersRes.success ? membersRes.data : []) as IOrganization_member[]
  const workSchedules = (workSchedulesRes.success ? workSchedulesRes.data : []) as IWorkSchedule[]

  // Filter members by organization
  const filteredMembers = organizationId
    ? members.filter((m) => String(m.organization_id) === organizationId)
    : members

  return (
    <ContentLayout title="Member Schedules">
      <MemberSchedulesClient
        initialSchedules={schedules}
        initialMembers={filteredMembers}
        initialWorkSchedules={workSchedules}
      />
    </ContentLayout>
  )
}
