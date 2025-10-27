import { ContentLayout } from "@/components/admin-panel/content-layout"
import { getAllWorkSchedules } from "@/action/schedule"
import { getAllOrganization } from "@/action/organization"
import { createClient } from "@/utils/supabase/server"
import ScheduleClient from "./schedule-client"
import { IWorkSchedule } from "@/interface"

// Server Component - fetch data di server
export default async function WorkSchedulesPage() {
  const supabase = await createClient()

  // Get organization ID & name
  const { data: { user } } = await supabase.auth.getUser()
  let organizationId = ""
  let organizationName = ""

  if (user) {
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id, organizations(id, name)")
      .eq("user_id", user.id)
      .maybeSingle()

    if (data && data.organization_id) {
      organizationId = String(data.organization_id)
      organizationName = (data.organizations as any)?.name || ""
    }
  }

  // Fetch all data in parallel - 1 server round trip!
  const [schedulesRes, organizationsRes] = await Promise.all([
    getAllWorkSchedules(organizationId),
    getAllOrganization(),
  ])

  const schedules = (schedulesRes.success ? schedulesRes.data : []) as IWorkSchedule[]
  const organizations = organizationsRes.success ? organizationsRes.data : []

  // Fallback organization name from all orgs
  if (!organizationName && organizationId) {
    const org = organizations.find((o: any) => String(o.id) === organizationId)
    organizationName = org?.name || ""
  }

  // Show message if user has no organization
  if (!organizationId || organizationId === '') {
    return (
      <ContentLayout title="Work Schedules">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-6xl">🏢</div>
            <h2 className="text-2xl font-semibold">No Organization Assigned</h2>
            <p className="text-muted-foreground max-w-md">
              You are not currently assigned to any organization. 
              Please contact your administrator to get access to work schedules.
            </p>
          </div>
        </div>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title="Work Schedules">
      <ScheduleClient
        initialSchedules={schedules}
        organizationId={organizationId}
        organizationName={organizationName}
      />
    </ContentLayout>
  )
}
