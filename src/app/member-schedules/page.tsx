import { ContentLayout } from "@/components/admin-panel/content-layout"
import { getAllMemberSchedule } from "@/action/members_schedule"
import { getAllOrganization_member } from "@/action/members"
import { getAllWorkSchedules } from "@/action/schedule"
import { createClient } from "@/utils/supabase/server"
import MemberSchedulesClient from "./member-schedules-client"
import { IMemberSchedule, IOrganization_member, IWorkSchedule } from "@/interface"

// Server Component - fetch data di server (SSR)
export default async function MemberSchedulesPage() {
  const supabase = await createClient()
  
  // Get organization ID
  const { data: { user } } = await supabase.auth.getUser()
  let organizationId = ""
  
  if (user) {
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()
    
    if (data && data.organization_id) {
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

  // Show message if user has no organization
  if (!organizationId || organizationId === '') {
    return (
      <ContentLayout title="Member Schedules">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-6xl">🏢</div>
            <h2 className="text-2xl font-semibold">No Organization Assigned</h2>
            <p className="text-muted-foreground max-w-md">
              You are not currently assigned to any organization. 
              Please contact your administrator to get access to member schedules.
            </p>
          </div>
        </div>
      </ContentLayout>
    )
  }

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
