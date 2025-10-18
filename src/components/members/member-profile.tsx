"use client"

import React from "react"
import { IOrganization_member, IMemberPerformance, IMemberAttendancePoint } from "@/interface"
import MemberAreaInteractive from "@/components/charts/member-area-interactive"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Recent30DataTable from "@/components/members/recent30-data-table"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { getUserInitials } from "@/lib/avatar-utils"
// (no React hooks needed)

type RecentRecord = {
  attendance_date?: string
  status?: string
  work_duration_minutes?: number | null
}

type Perf = IMemberPerformance | undefined

export default function MemberProfile({ member, performance, attendanceTrend }: { member: IOrganization_member; performance?: Perf; attendanceTrend?: IMemberAttendancePoint[] }) {
  const user = member.user
  // prefer email from associated user object, but fall back to member.email if present
  const email = user?.email ?? (member as any).email ?? '-'
  // handle some possible extra fields that may be present at runtime
  const extendedMember = member as IOrganization_member & { groupName?: string; position_title?: string }
  const router = useRouter()
  // no admin fetch — show email from member.user and Last Seen from performance

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const dt = new Date(dateStr)
      return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(dt)
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">

      {/* Personal Info card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
          <CardDescription>Identitas & kontak — cepat lihat detail dasar anggota</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="w-28 h-28 flex-shrink-0">
              <Avatar className="h-28 w-28">
                <AvatarImage
                  src={useProfilePhotoUrl(user?.profile_photo_url ?? undefined) ?? undefined}
                  alt={([user?.first_name, user?.middle_name, user?.last_name]
                    .filter((part) => part && part.trim() !== "")
                    .join(" ") || user?.display_name || user?.email || "")}
                />
                <AvatarFallback className="text-lg font-semibold">
                  {getUserInitials(
                    user?.first_name,
                    user?.last_name,
                    user?.display_name ?? undefined,
                    user?.email ?? undefined
                  )}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Basic member information</div>
              <div className="text-lg font-semibold mt-1">
                {user
                  ? [user.first_name, user.middle_name, user.last_name]
                      .filter((part) => part && part.trim() !== "")
                      .join(" ") || user.email || "No User"
                  : "No User"}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">Employee ID</div>
                    <Badge variant="outline">{member.employee_id || '-'}</Badge>
                  </div>
                  <div className="mt-2">Email: <span className="font-medium">{email}</span></div>
                  <div>Phone: <span className="font-medium">{user?.phone || '-'}</span></div>
                </div>
                <div>
                    <div>Group: <span className="font-medium">{extendedMember.groupName || member.departments?.name || '-'}</span></div>
                    <div className="mt-2">Position: <Badge variant="secondary">{member.positions?.title || extendedMember.position_title || '-'}</Badge></div>
                  <div className="mt-2">Hire Date: <span className="font-medium">{member.hire_date || '-'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        {/* Footer intentionally removed from Personal Info — actions moved to bottom */}
      </Card>

      {/* Performance card */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {performance ? (
            <div className="grid grid-cols-2 gap-6">
              {/* Left summary */}
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Attendance summary and recent activity</div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Present</div>
              <div className="text-2xl font-semibold">{performance?.counts?.present ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Late</div>
                    <div className="text-2xl font-semibold text-amber-500">{performance?.counts?.late ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Absent</div>
                    <div className="text-2xl font-semibold text-red-500">{performance?.counts?.absent ?? 0}</div>
                  </div>
                  {/* Quick insights under counts */}
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">Average Check-in Time</div>
                    <div className="font-medium">{performance?.averageCheckInTime ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Average Check-out Time</div>
                    <div className="font-medium">{performance?.averageCheckOutTime ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Average Work Duration (mins)</div>
                    <div className="font-medium">{performance?.averageWorkDurationMinutes ?? '-'}</div>
                  </div>
                </div>
              </div>

              {/* Right details */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {/* Average Work Duration temporarily hidden */}
                  </div>
                  <div>
                    {/* Last Seen removed per request */}
                  </div>
                </div>

                <div className="mt-4 text-sm">
                  <div className="w-full">
                    <Recent30DataTable data={(performance.recent30 || []) as any} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No performance data available.</div>
          )}
        </CardContent>
      </Card>

      {/* Performance Analytics card */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">High level analytics and trends for this member.</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 90-day Average card temporarily hidden */}
            <div className="p-3 bg-muted/5 rounded">
              <div className="text-xs text-muted-foreground">Trend</div>
              <div className="text-xl font-semibold">{performance ? (performance.counts?.present ?? 0) : '-'}</div>
            </div>
            <div className="p-3 bg-muted/5 rounded">
              <div className="text-xs text-muted-foreground">Streak</div>
              <div className="text-xl font-semibold">-</div>
            </div>
          </div>

          <div className="mt-4">
            {attendanceTrend && attendanceTrend.length ? (
              <MemberAreaInteractive data={attendanceTrend} />
            ) : (
              <div className="text-muted-foreground text-sm">No trend data available.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global actions (Back) placed below analytics for clearer layout */}
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

    </div>
  )
}
