import { ContentLayout } from "@/components/admin-panel/content-layout"
import { getAllAttendance } from "@/action/attendance"
import { getAllOrganization_member } from "@/action/members"
import { getAllUsers } from "@/action/users"
import { getAllOrganization } from "@/action/organization"
import { getAllWorkSchedules } from "@/action/schedule"
import { getAllMemberSchedule } from "@/action/members_schedule"
import { createSupabaseClient } from "@/config/supabase-config"
import AttendanceClient from "./attendance-client"
import {
  IAttendance,
  IMemberSchedule,
  IOrganization,
  IOrganization_member,
  IUser,
  IWorkSchedule,
} from "@/interface"

// Server Component - fetch all data di server
export default async function AttendancePage() {
  const supabase = await createSupabaseClient()

  // Get organization ID
  const { data: { user } } = await supabase.auth.getUser()
  let organizationId = ""
  let defaultTimezone = "Asia/Jakarta"

  if (user) {
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id, organizations(timezone)")
      .eq("user_id", user.id)
      .maybeSingle()

    if (data) {
      organizationId = String(data.organization_id)
      defaultTimezone = (data.organizations as any)?.timezone || "Asia/Jakarta"
    }
  }

  // Fetch all data in parallel - 1 server round trip!
  const [
    attendanceRes,
    memberRes,
    usersRes,
    orgRes,
    workScheduleRes,
    memberScheduleRes,
  ] = await Promise.all([
    getAllAttendance(),
    getAllOrganization_member(),
    getAllUsers(),
    getAllOrganization(),
    getAllWorkSchedules(),
    getAllMemberSchedule(),
  ])

  const attendance = (attendanceRes.success ? attendanceRes.data : []) as IAttendance[]
  const members = (memberRes.success ? memberRes.data : []) as IOrganization_member[]
  const users = (usersRes.success ? usersRes.data : []) as IUser[]
  const organizations = (orgRes.success ? orgRes.data : []) as IOrganization[]
  const workSchedules = (workScheduleRes.success ? workScheduleRes.data : []) as IWorkSchedule[]
  const memberSchedules = (memberScheduleRes.success ? memberScheduleRes.data : []) as IMemberSchedule[]

  return (
    <ContentLayout title="Attendance">
      <AttendanceClient
        initialAttendance={attendance}
        initialMembers={members}
        initialUsers={users}
        initialOrganizations={organizations}
        initialWorkSchedules={workSchedules}
        initialMemberSchedules={memberSchedules}
        defaultTimezone={defaultTimezone}
      />
    </ContentLayout>
  )
}
