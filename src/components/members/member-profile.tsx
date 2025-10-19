"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  Building,
  UserRound,
  Calendar,
  Clock3,
  Award,
  CalendarClock,
  Sparkles,
  ArrowLeft,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { getUserInitials } from "@/lib/avatar-utils"
import { MemberAttendanceDonut } from "@/components/charts/member-attendance-donut"
import type { IOrganization_member, IMemberPerformance } from "@/interface"

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

const formatDuration = (minutes?: number | null) => {
  if (minutes == null) return "-"
  const total = Math.round(minutes)
  const hours = Math.floor(total / 60)
  const mins = Math.max(total - hours * 60, 0)
  const parts: string[] = []
  if (hours) parts.push(`${hours}h`)
  parts.push(`${mins}m`)
  return parts.join(" ")
}

const formatTime = (value?: string | null) => (value && value.trim() ? value : "-")

type Perf = IMemberPerformance | undefined

type MemberProfileProps = {
  member: IOrganization_member
  performance?: Perf
}

export default function MemberProfile({ member, performance }: MemberProfileProps) {
  const router = useRouter()
  const user = member.user
  const email = user?.email ?? (member as { email?: string }).email ?? "-"
  const phone = user?.mobile || user?.phone || "-"
  const photoUrl = useProfilePhotoUrl(user?.profile_photo_url ?? undefined) ?? undefined
  const extendedMember = member as IOrganization_member & {
    groupName?: string
    position_title?: string
    manager_name?: string
  }

  const groupName = extendedMember.groupName || member.departments?.name || ""
  const positionTitle = member.positions?.title || extendedMember.position_title || ""
  const groupPosition = [groupName, positionTitle]
    .filter((part) => part && part.trim().length)
    .join(" • ")

  const displayName = user
    ? [user.first_name, user.middle_name, user.last_name]
        .filter((part) => part && part.trim().length)
        .join(" ") || user.email || "Name unavailable"
    : "Name unavailable"

  const canEmail = email && email !== "-"
  const canCall = phone && phone !== "-"

  const attendancePercentages = React.useMemo(
    () => ({
      present: performance?.counts?.present ?? 0,
      late: performance?.counts?.late ?? 0,
      absent: performance?.counts?.absent ?? 0,
      excused: performance?.counts?.excused ?? 0,
    }),
    [performance?.counts?.present, performance?.counts?.late, performance?.counts?.absent, performance?.counts?.excused],
  )

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 sm:px-6 lg:px-10">
      <Card className="border-muted-foreground/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="flex flex-col gap-8 p-6 sm:px-8 sm:py-8 lg:flex-row lg:flex-nowrap lg:items-start lg:justify-between lg:gap-12">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:text-left">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl sm:h-28 sm:w-28">
              <AvatarImage src={photoUrl} alt={displayName} />
              <AvatarFallback className="text-xl font-semibold">
                {getUserInitials(
                  user?.first_name,
                  user?.last_name,
                  user?.display_name ?? undefined,
                  user?.email ?? undefined,
                )}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <CardTitle className="break-words text-2xl font-semibold sm:text-3xl">{displayName || "Name unavailable"}</CardTitle>
                {member.employment_status ? (
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {member.employment_status}
                  </Badge>
                ) : null}
              </div>
              <CardDescription className="break-words text-sm text-muted-foreground">
                {groupPosition || "Role details unavailable"}
              </CardDescription>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground lg:justify-start">
                {member.departments?.name ? <Badge variant="outline">{member.departments.name}</Badge> : null}
                {member.contract_type ? <Badge variant="outline">{member.contract_type}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="grid w/full min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:w-auto lg:min-w-[20rem] lg:max-w-[22rem] lg:grid-cols-1">
            {canEmail ? (
              <Button variant="secondary" className="w-full justify-center gap-2 lg:justify-start" asChild>
                <a href={`mailto:${email}`}>
                  <Mail className="h-4 w-4" /> Send Email
                </a>
              </Button>
            ) : null}
            {canCall ? (
              <Button variant="outline" className="w-full justify-center gap-2 lg:justify-start" asChild>
                <a href={`tel:${phone}`}>
                  <Phone className="h-4 w-4" /> Call
                </a>
              </Button>
            ) : null}
            <Button variant="outline" className="w-full justify-center gap-2 lg:justify-start" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-6">
        <Card className="border-muted-foreground/20">
          <CardHeader className="flex flex-col gap-1 pb-4">
            <CardTitle className="text-lg font-semibold">Contact & Information</CardTitle>
            <CardDescription>Concise details for coordination and reporting.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoItem icon={Mail} label="Email" value={email} />
            <InfoItem icon={Phone} label="Phone" value={phone} />
            <InfoItem icon={BriefcaseBusiness} label="Group & Position" value={groupPosition || "-"} />
            <InfoItem icon={Building} label="Organization" value={member.organization?.name || "-"} />
            <InfoItem icon={MapPin} label="Location" value={member.work_location || "Location unavailable"} />
            <InfoItem icon={Calendar} label="Hire Date" value={formatDate(member.hire_date)} />
            <InfoItem icon={Clock3} label="Average Work Duration" value={formatDuration(performance?.averageWorkDurationMinutes)} />
            <InfoItem icon={UserRound} label="Employee ID" value={member.employee_id || "-"} />
          </CardContent>
        </Card>

        {performance ? (
          <Card className="border-muted-foreground/20">
            <CardHeader className="flex flex-col gap-1 pb-4">
              <CardTitle className="text-lg font-semibold">Performance Highlights</CardTitle>
              <CardDescription>Quick overview of attendance and work activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <MemberAttendanceDonut data={attendancePercentages} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatPill icon={Award} label="Total Present" value={performance.counts?.present ?? 0} />
                <StatPill icon={CalendarClock} label="Total Late" value={performance.counts?.late ?? 0} />
                <StatPill icon={Calendar} label="Total Absent" value={performance.counts?.absent ?? 0} />
                <StatPill icon={Sparkles} label="Total Excused" value={performance.counts?.excused ?? 0} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <MiniHighlight label="Average Work Duration" value={formatDuration(performance.averageWorkDurationMinutes)} />
                <MiniHighlight label="Average Check-in" value={formatTime(performance.averageCheckInTime)} />
                <MiniHighlight label="Average Check-out" value={formatTime(performance.averageCheckOutTime)} />
              </div>
            </CardContent>
          </Card>
        ) : null}

      </div>
    </div>
  )
}

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

type InfoItemProps = {
  icon: IconType
  label: string
  value?: React.ReactNode
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-muted-foreground/10 bg-card/60 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value && String(value).trim().length ? value : "-"}</p>
      </div>
    </div>
  )
}

type StatPillProps = {
  icon: IconType
  label: string
  value: React.ReactNode
}

function StatPill({ icon: Icon, label, value }: StatPillProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-muted-foreground/10 bg-card/70 px-5 py-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}

type MiniHighlightProps = {
  label: string
  value: React.ReactNode
}

function MiniHighlight({ label, value }: MiniHighlightProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-muted-foreground/10 bg-muted/40 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

