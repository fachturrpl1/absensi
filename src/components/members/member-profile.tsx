"use client"

import React from "react"
import { IOrganization_member } from "@/interface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { getUserInitials, safeAvatarSrc } from "@/lib/avatar-utils"

type Perf = {
  counts?: { present?: number; late?: number; absent?: number; excused?: number }
  lastSeen?: string | null
  averageWorkDurationMinutes?: number
  recent30?: any[]
}

export default function MemberProfile({ member, performance }: { member: IOrganization_member; performance?: Perf }) {
  const user = (member as any).user
  const router = useRouter()

  return (
    <div className="space-y-6">

      {/* Personal Info card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="w-28 h-28 flex-shrink-0">
              <Avatar className="h-28 w-28">
                <AvatarImage src={useProfilePhotoUrl(user?.profile_photo_url) ?? undefined} alt={`${user?.first_name || ''} ${user?.last_name || ''}`} />
                <AvatarFallback className="text-lg font-semibold">
                  {getUserInitials(user?.first_name, user?.last_name, user?.display_name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Basic member information</div>
              <div className="text-lg font-semibold mt-1">{user ? `${user.first_name || ''} ${user.last_name || ''}` : 'No User'}</div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <div>Employee ID: <span className="font-medium">{(member as any).employee_id || '-'}</span></div>
                  <div>Email: <span className="font-medium">{user?.email || '-'}</span></div>
                  <div>Phone: <span className="font-medium">{user?.phone || '-'}</span></div>
                </div>
                <div>
                  <div>Group: <span className="font-medium">{(member as any).groupName || member.departments?.name || '-'}</span></div>
                  <div>Position: <span className="font-medium">{(member as any).positions?.title || (member as any).position_title || '-'}</span></div>
                  <div>Hire Date: <span className="font-medium">{member.hire_date || '-'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analytics card */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">High level analytics and trends for this member. (Placeholder — add charts or KPIs here)</div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted/5 rounded">
              <div className="text-xs text-muted-foreground">90-day Average</div>
              <div className="text-xl font-semibold">{performance?.averageWorkDurationMinutes ?? '-'}</div>
            </div>
            <div className="p-3 bg-muted/5 rounded">
              <div className="text-xs text-muted-foreground">Trend</div>
              <div className="text-xl font-semibold">{performance ? (performance.counts?.present ?? 0) : '-'}</div>
            </div>
            <div className="p-3 bg-muted/5 rounded">
              <div className="text-xs text-muted-foreground">Streak</div>
              <div className="text-xl font-semibold">-</div>
            </div>
          </div>
        </CardContent>
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
                    <div className="text-2xl font-semibold">{performance.counts?.present ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Late</div>
                    <div className="text-2xl font-semibold text-amber-500">{performance.counts?.late ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Absent</div>
                    <div className="text-2xl font-semibold text-red-500">{performance.counts?.absent ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Right details */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Average Work Duration (mins)</div>
                    <div className="text-2xl font-semibold">{performance.averageWorkDurationMinutes ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Last Seen</div>
                    <div className="text-2xl font-semibold">{performance.lastSeen ?? '-'}</div>
                  </div>
                </div>

                <div className="mt-4 text-sm">
                  <div className="text-xs text-muted-foreground mb-2">Recent (30 days)</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs">
                          <th className="text-left">Date</th>
                          <th className="text-left">Status</th>
                          <th className="text-right">Duration (min)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(performance.recent30 || []).map((r, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-2">{r.attendance_date}</td>
                            <td className="py-2">{r.status}</td>
                            <td className="py-2 text-right">{r.work_duration_minutes ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No performance data available.</div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

    </div>
  )
}
