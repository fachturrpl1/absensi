"use client"

/**
 * Modern Member Profile Component
 * Redesigned with international UX/UI standards
 * - Clean hero header with prominent avatar and actions
 * - Responsive 2-column grid layout
 * - Professional card-based design
 * - Enhanced visual hierarchy and spacing
 */

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  Building,
  UserRound,
  Calendar,
  Clock,
  Award,
  CalendarClock,
  Sparkles,
  ArrowLeft,
  MoreVertical,
  Download,
  Edit,
  FileText,
  Users,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  Timer,
  UserCheck,
  UserX,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { getUserInitials } from "@/lib/avatar-utils"
import { MemberAttendanceDonut } from "@/components/charts/member-attendance-donut"
import type { IOrganization_member, IMemberPerformance } from "@/interface"
import { cn } from "@/lib/utils"

// ============================================================================
// Types & Interfaces
// ============================================================================

type AttendanceRecord = {
  id: string
  date: string
  status: "present" | "late" | "absent" | "excused" | "leave"
  checkIn?: string
  checkOut?: string
  duration?: string
  location?: string
}

type WorkSchedule = {
  name: string
  type: string
  workingHours: string
  workingDays: string[]
}

type MemberProfileProps = {
  member: IOrganization_member
  performance?: IMemberPerformance
  recentAttendance?: AttendanceRecord[]
  schedule?: WorkSchedule
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

const formatDateShort = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

const formatPhoneNumber = (phone?: string | null) => {
  if (!phone || phone === "-" || phone.trim() === "") return "No Phone"
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("62")) {
    const match = cleaned.match(/^(62)(\d{3})(\d{4})(\d+)/)
    if (match) {
      return `+${match[1]} ${match[2]}-${match[3]}-${match[4]}`
    }
  }
  return phone
}

const getStatusColor = (status: AttendanceRecord["status"]) => {
  switch (status) {
    case "present":
      return "bg-emerald-500"
    case "late":
      return "bg-amber-500"
    case "absent":
      return "bg-red-500"
    case "excused":
      return "bg-blue-500"
    case "leave":
      return "bg-purple-500"
    default:
      return "bg-gray-400"
  }
}

const getStatusIcon = (status: AttendanceRecord["status"]) => {
  switch (status) {
    case "present":
      return UserCheck
    case "late":
      return Clock
    case "absent":
      return UserX
    case "excused":
    case "leave":
      return Calendar
    default:
      return AlertCircle
  }
}

const getStatusLabel = (status: AttendanceRecord["status"]) => {
  switch (status) {
    case "present":
      return "Present"
    case "late":
      return "Late"
    case "absent":
      return "Absent"
    case "excused":
      return "Excused"
    case "leave":
      return "Leave"
    default:
      return status
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function MemberProfile({ member, performance, recentAttendance, schedule }: MemberProfileProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

  const user = member.user
  const rawEmail = user?.email ?? (member as { email?: string }).email ?? ""
  const email = rawEmail && !rawEmail.toLowerCase().endsWith("@dummy.local") ? rawEmail : "-"
  const phone = user?.mobile || user?.phone || ""
  const photoUrl = useProfilePhotoUrl(user?.profile_photo_url ?? undefined) ?? undefined

  const extendedMember = member as IOrganization_member & {
    groupName?: string
    position_title?: string
    manager_name?: string
  }

  const groupName = extendedMember.groupName || member.departments?.name || ""
  const positionTitle = member.positions?.title || extendedMember.position_title || ""

  const displayName = user
    ? [user.first_name, user.middle_name, user.last_name]
      .filter((part) => part && part.trim().length)
      .join(" ") ||
    (user.email && !user.email.toLowerCase().endsWith("@dummy.local") ? user.email : null) ||
    "Name unavailable"
    : "Name unavailable"

  const canEmail = email && email !== "-"
  const canCall = phone && phone.trim() !== "" && phone !== "No Phone"

  const attendancePercentages = React.useMemo(
    () => ({
      present: performance?.counts?.present ?? 0,
      late: performance?.counts?.late ?? 0,
      absent: performance?.counts?.absent ?? 0,
      excused: performance?.counts?.excused ?? 0,
    }),
    [performance]
  )

  const totalDays = Object.values(attendancePercentages).reduce((a, b) => a + b, 0)
  const attendanceRate =
    totalDays > 0
      ? (((attendancePercentages.present + attendancePercentages.late) / totalDays) * 100).toFixed(1)
      : "0"

  const trend: "up" | "down" | "neutral" = "up"

  const handleEdit = () => router.push(`/members/edit/${member.id}`)
  const handleExport = async () => {
    setIsExporting(true)
    setTimeout(() => setIsExporting(false), 1000)
  }
  const handleViewFullAttendance = () => router.push(`/attendance?member=${member.id}`)
  const handleManageSchedule = () => router.push(`/member-schedules?member=${member.id}`)

  return (
    <div className="w-full min-h-screen bg-muted/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>

          {/* Profile Header Grid */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Avatar + Info */}
            <div className="flex items-start gap-6">
              {/* Avatar with Status */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={photoUrl} alt={displayName} />
                  <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                    {getUserInitials(
                      user?.first_name,
                      user?.last_name,
                      user?.display_name ?? undefined,
                      user?.email ?? undefined
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-background shadow-lg",
                    member.is_active ? "bg-emerald-500" : "bg-gray-400"
                  )}
                  title={member.is_active ? "Active" : "Inactive"}
                />
              </div>

              {/* Name + Role */}
              <div className="space-y-3 min-w-0 flex-1">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                    {displayName}
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground mt-1">
                    {positionTitle || "No Position"}
                  </p>
                  {groupName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Building className="h-3.5 w-3.5" />
                      {groupName}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={member.is_active ? "default" : "secondary"}
                    className="rounded-full px-3 py-1 font-semibold"
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {member.contract_type && (
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {member.contract_type}
                    </Badge>
                  )}
                  {member.probation_end_date && new Date(member.probation_end_date) > new Date() && (
                    <Badge variant="outline" className="rounded-full px-3 py-1 border-amber-500 text-amber-700">
                      <AlertCircle className="mr-1.5 h-3 w-3" />
                      Probation
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch lg:min-w-[180px]">
              {canEmail && (
                <Button variant="default" className="flex-1 lg:flex-none gap-2" asChild>
                  <a href={`mailto:${email}`}>
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              {canCall && (
                <Button variant="outline" className="flex-1 lg:flex-none gap-2" asChild>
                  <a href={`tel:${phone}`}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={handleEdit} className="flex-1 lg:flex-none gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:w-full lg:justify-center">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export to PDF"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleViewFullAttendance}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Full Attendance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleManageSchedule}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Manage Schedule
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/members")}>
                    <Users className="mr-2 h-4 w-4" />
                    All Members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Primary Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            {performance && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <QuickStat
                    label="Attendance Rate"
                    value={`${attendanceRate}%`}
                    trend={trend}
                    icon={TrendingUp}
                    color="emerald"
                  />
                  <QuickStat
                    label="Days Present"
                    value={performance.counts?.present ?? 0}
                    icon={UserCheck}
                    color="blue"
                  />
                  <QuickStat
                    label="Total Absences"
                    value={performance.counts?.absent ?? 0}
                    icon={UserX}
                    color="red"
                  />
                </CardContent>
              </Card>
            )}

            {/* Contact & Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Contact & Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow icon={Mail} label="Email" value={email} />
                <InfoRow icon={Phone} label="Phone" value={formatPhoneNumber(phone)} />
                <InfoRow icon={BriefcaseBusiness} label="Position" value={positionTitle || "-"} />
                <InfoRow icon={Building} label="Department" value={groupName || "-"} />
                <InfoRow icon={MapPin} label="Location" value={member.work_location || "-"} />
                <InfoRow
                  icon={UserRound}
                  label="Employee ID"
                  value={member.employee_id || user?.employee_code || "-"}
                />
                <InfoRow icon={Calendar} label="Hire Date" value={formatDate(member.hire_date)} />
                {member.probation_end_date && (
                  <InfoRow icon={AlertCircle} label="Probation End" value={formatDate(member.probation_end_date)} />
                )}
              </CardContent>
            </Card>

            {/* Work Schedule */}
            {schedule && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Work Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Schedule</p>
                      <p className="font-semibold text-sm">{schedule.name}</p>
                    </div>
                    <Badge variant="secondary">{schedule.type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="h-4 w-4 text-primary" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hours</p>
                      </div>
                      <p className="text-sm font-semibold">{schedule.workingHours}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Days</p>
                      </div>
                      <p className="text-xs font-semibold">{schedule.workingDays.join(", ")}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm" onClick={handleManageSchedule}>
                    View Full Schedule
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Activity & Performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Attendance */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                    <CardDescription className="mt-1">
                      {recentAttendance && recentAttendance.length > 0
                        ? `Last ${recentAttendance.length} attendance records`
                        : "No recent attendance data"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleViewFullAttendance}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentAttendance && recentAttendance.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {recentAttendance.slice(0, 6).map((record) => {
                      const StatusIcon = getStatusIcon(record.status)
                      return (
                        <div
                          key={record.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className={cn("rounded-full p-2 shrink-0", getStatusColor(record.status))}>
                            <StatusIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm">{formatDateShort(record.date)}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {getStatusLabel(record.status)}
                              </Badge>
                            </div>
                            {(record.checkIn || record.checkOut) && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {record.checkIn && `In: ${record.checkIn}`}
                                {record.checkIn && record.checkOut && " • "}
                                {record.checkOut && `Out: ${record.checkOut}`}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                    No attendance data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            {performance && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground">
                        <p className="text-sm font-semibold">{attendanceRate}% Attendance</p>
                      </div>
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          trend === "up"
                            ? "bg-emerald-100 dark:bg-emerald-900"
                            : trend === "down"
                              ? "bg-red-100 dark:bg-red-900"
                              : "bg-gray-100 dark:bg-gray-800"
                        )}
                      >
                        {trend === "up" ? (
                          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : trend === "down" ? (
                          <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Donut Chart */}
                  <div className="flex justify-center">
                    <div className="w-full max-w-[280px]">
                      <MemberAttendanceDonut data={attendancePercentages} showLegend={false} hideTitle />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatCard icon={Award} label="Total Present" value={performance.counts?.present ?? 0} color="emerald" />
                    <StatCard icon={CalendarClock} label="Total Late" value={performance.counts?.late ?? 0} color="amber" />
                    <StatCard icon={Calendar} label="Total Absent" value={performance.counts?.absent ?? 0} color="red" />
                    <StatCard icon={Sparkles} label="Total Excused" value={performance.counts?.excused ?? 0} color="blue" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

function QuickStat({
  label,
  value,
  trend,
  icon: Icon,
  color = "gray",
}: {
  label: string
  value: string | number
  trend?: "up" | "down" | "neutral"
  icon: IconType
  color?: "emerald" | "blue" | "red" | "gray"
}) {
  const colorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    red: "bg-red-500/10 text-red-600",
    gray: "bg-gray-500/10 text-gray-600",
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="text-muted-foreground">
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : trend === "down" ? (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: IconType; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value && String(value).trim() ? value : "-"}</p>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "gray",
}: {
  icon: IconType
  label: string
  value: React.ReactNode
  color?: "emerald" | "amber" | "red" | "blue" | "gray"
}) {
  const colorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    red: "bg-red-500/10 text-red-600",
    blue: "bg-blue-500/10 text-blue-600",
    gray: "bg-gray-500/10 text-gray-600",
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-card/50">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", colorClasses[color])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}
