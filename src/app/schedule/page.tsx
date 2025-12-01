import { getAllWorkSchedules } from "@/action/schedule"
import { getUserOrganization } from "@/action/organization"
import { createClient } from "@/utils/supabase/server"
import ScheduleClient from "./schedule-client"
import { IWorkSchedule } from "@/interface"

// Server Component - fetch data di server (now with secure organization filtering)
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

  // Fetch schedules (automatically filtered by user's organization)
  // and user's organization data only
  const [schedulesRes, organizationRes] = await Promise.all([
    getAllWorkSchedules(),
    getUserOrganization(),
  ])

  const schedules = (schedulesRes.success ? schedulesRes.data : []) as IWorkSchedule[]
  const organization = organizationRes.success ? organizationRes.data : null

  // Use organization data from getUserOrganization
  if (organization) {
    organizationId = String(organization.id)
    organizationName = organization.name || ""
  }

  // Show message if user has no organization
  if (!organizationId || organizationId === '') {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full">
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
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <ScheduleClient
        initialSchedules={schedules}
        organizationId={organizationId}
        organizationName={organizationName}
      />
    </div>
  )
}
