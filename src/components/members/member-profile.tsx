"use client"

/**
 * Enhanced Member Profile Component
 * 
 * Improvements added:
 * 1. Recent Attendance Timeline
 * 2. Schedule Information Card
 * 3. Quick Actions Dropdown Menu
 * 4. Emergency Contact Card
 * 5. Enhanced Performance with Trends
 * 6. Better Status Indicators
 * 7. Improved Formatting
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
  Clock3,
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
  Clock,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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

type EmergencyContact = {
  name: string
  relationship: string
  phone: string
  alternativePhone?: string
}

type MemberProfileEnhancedProps = {
  member: IOrganization_member
  performance?: IMemberPerformance
  recentAttendance?: AttendanceRecord[]
  schedule?: WorkSchedule
  emergencyContact?: EmergencyContact
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

const formatDateShort = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("id-ID", {
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
  if (mins) parts.push(`${mins}m`)
  return parts.join(" ") || "0m"
}

const formatTime = (value?: string | null) => (value && value.trim() ? value : "-")

const formatPhoneNumber = (phone?: string | null) => {
  if (!phone || phone === "-") return "-"
  // Format: +62 812-3456-7890
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
      return "bg-green-500"
    case "late":
      return "bg-yellow-500"
    case "absent":
      return "bg-red-500"
    case "excused":
      return "bg-blue-500"
    case "leave":
      return "bg-purple-500"
    default:
      return "bg-gray-500"
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

export default function MemberProfileEnhanced({
  member,
  performance,
  recentAttendance,
  schedule,
  emergencyContact,
}: MemberProfileEnhancedProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

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
    [performance]
  )

  // Calculate attendance rate and trend
  const totalDays = Object.values(attendancePercentages).reduce((a, b) => a + b, 0)
  const attendanceRate = totalDays > 0 
    ? ((attendancePercentages.present + attendancePercentages.late) / totalDays * 100).toFixed(1)
    : "0"

  // Mock trend - replace with actual data
  const trend: "up" | "down" | "neutral" = "up" // Can be calculated from historical data

  // Quick Actions
  const handleEdit = () => {
    router.push(`/members/edit/${member.id}`)
  }

  const handleExport = async () => {
    setIsExporting(true)
    // TODO: Implement PDF export
    setTimeout(() => {
      setIsExporting(false)
      console.log("Exporting profile to PDF...")
    }, 1000)
  }

  const handleViewFullAttendance = () => {
    router.push(`/attendance?member=${member.id}`)
  }

  const handleManageSchedule = () => {
    router.push(`/member-schedules?member=${member.id}`)
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 sm:px-6 lg:px-10">
      {/* Header Card with Enhanced Actions */}
      <Card className="border-muted-foreground/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="flex flex-col gap-8 p-6 sm:px-8 sm:py-8 lg:flex-row lg:flex-nowrap lg:items-start lg:justify-between lg:gap-12">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:text-left">
            <div className="relative">
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
              {/* Status Indicator */}
              <div
                className={cn(
                  "absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background",
                  member.is_active ? "bg-green-500" : "bg-gray-400"
                )}
                title={member.is_active ? "Active" : "Inactive"}
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <CardTitle className="break-words text-2xl font-semibold sm:text-3xl">
                  {displayName || "Name unavailable"}
                </CardTitle>
                {member.employment_status ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  >
                    {member.employment_status}
                  </Badge>
                ) : null}
                {!member.is_active && (
                  <Badge variant="destructive" className="rounded-full">
                    Inactive
                  </Badge>
                )}
              </div>
              <CardDescription className="break-words text-sm text-muted-foreground">
                {groupPosition || "Role details unavailable"}
              </CardDescription>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground lg:justify-start">
                {member.departments?.name ? <Badge variant="outline">{member.departments.name}</Badge> : null}
                {member.contract_type ? <Badge variant="outline">{member.contract_type}</Badge> : null}
                {member.probation_end_date && new Date(member.probation_end_date) > new Date() ? (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Probation
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:w-auto lg:min-w-[20rem] lg:max-w-[22rem] lg:grid-cols-1">
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

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-center gap-2 lg:justify-start">
                  <MoreVertical className="h-4 w-4" />
                  Quick Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export to PDF"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleViewFullAttendance}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Full Attendance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManageSchedule}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Manage Schedule
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/members`)}>
                  <Users className="mr-2 h-4 w-4" />
                  View All Members
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="w-full justify-center gap-2 lg:justify-start"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-6">
        {/* Grid Layout for Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact & Information */}
          <Card className="border-muted-foreground/20">
            <CardHeader className="flex flex-col gap-1 pb-4">
              <CardTitle className="text-lg font-semibold">Contact & Information</CardTitle>
              <CardDescription>Basic employment and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <InfoItem icon={Mail} label="Email" value={email} />
              <InfoItem icon={Phone} label="Phone" value={formatPhoneNumber(phone)} />
              <InfoItem icon={BriefcaseBusiness} label="Position" value={positionTitle || "-"} />
              <InfoItem icon={Building} label="Department" value={groupName || "-"} />
              <InfoItem icon={MapPin} label="Location" value={member.work_location || "-"} />
              <InfoItem icon={UserRound} label="Employee ID" value={member.employee_id || "-"} />
              <InfoItem icon={Calendar} label="Hire Date" value={formatDate(member.hire_date)} />
              {member.probation_end_date && (
                <InfoItem
                  icon={AlertCircle}
                  label="Probation End"
                  value={formatDate(member.probation_end_date)}
                />
              )}
            </CardContent>
          </Card>

          {/* Schedule Information */}
          {schedule ? (
            <Card className="border-muted-foreground/20">
              <CardHeader className="flex flex-col gap-1 pb-4">
                <CardTitle className="text-lg font-semibold">Work Schedule</CardTitle>
                <CardDescription>Current work schedule and hours.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-card/60 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Schedule Name</p>
                    <p className="text-lg font-semibold text-primary">{schedule.name}</p>
                  </div>
                  <Badge variant="outline">{schedule.type}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border bg-card/60 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Timer className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Working Hours</p>
                      <p className="text-sm font-semibold">{schedule.workingHours}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border bg-card/60 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Working Days</p>
                      <p className="text-sm font-semibold">{schedule.workingDays.join(", ")}</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={handleManageSchedule}
                >
                  View Full Schedule
                </Button>
              </CardContent>
            </Card>
          ) : null}


        </div>

        {/* Recent Attendance Timeline */}
        {recentAttendance && recentAttendance.length > 0 ? (
          <Card className="border-muted-foreground/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">Recent Attendance</CardTitle>
                  <CardDescription>Last {recentAttendance.length} days attendance records.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleViewFullAttendance} className="ml-4">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAttendance.map((record) => {
                  const StatusIcon = getStatusIcon(record.status)
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 rounded-lg border bg-card/60 p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className={cn("rounded-full p-2", getStatusColor(record.status))}>
                        <StatusIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{formatDateShort(record.date)}</p>
                          <Badge variant="outline">{getStatusLabel(record.status)}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                          {record.checkIn && (
                            <span className="flex items-center gap-1">
                              <Clock3 className="h-3 w-3" />
                              In: {record.checkIn}
                            </span>
                          )}
                          {record.checkOut && (
                            <span className="flex items-center gap-1">
                              <Clock3 className="h-3 w-3" />
                              Out: {record.checkOut}
                            </span>
                          )}
                          {record.duration && (
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {record.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Performance Highlights - Enhanced */}
        {performance ? (
          <Card className="border-muted-foreground/20">
            <CardHeader className="flex flex-col gap-1 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Performance Highlights</CardTitle>
                  <CardDescription>Attendance metrics and work activity.</CardDescription>
                </div>
                {/* Attendance Rate with Trend */}
                <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-4 py-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                    <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
                  </div>
                  {trend === "up" ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : trend === "down" ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <MemberAttendanceDonut data={attendancePercentages} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatPill
                  icon={Award}
                  label="Total Present"
                  value={performance.counts?.present ?? 0}
                  color="green"
                />
                <StatPill
                  icon={CalendarClock}
                  label="Total Late"
                  value={performance.counts?.late ?? 0}
                  color="yellow"
                />
                <StatPill
                  icon={Calendar}
                  label="Total Absent"
                  value={performance.counts?.absent ?? 0}
                  color="red"
                />
                <StatPill
                  icon={Sparkles}
                  label="Total Excused"
                  value={performance.counts?.excused ?? 0}
                  color="blue"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <MiniHighlight
                  label="Avg Work Duration"
                  value={formatDuration(performance.averageWorkDurationMinutes)}
                />
                <MiniHighlight label="Avg Check-in" value={formatTime(performance.averageCheckInTime)} />
                <MiniHighlight
                  label="Avg Check-out"
                  value={formatTime(performance.averageCheckOutTime)}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

type InfoItemProps = {
  icon: IconType
  label: string
  value?: React.ReactNode
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value && String(value).trim().length ? value : "-"}
        </p>
      </div>
    </div>
  )
}

type StatPillProps = {
  icon: IconType
  label: string
  value: React.ReactNode
  color?: "green" | "yellow" | "red" | "blue" | "gray"
}

function StatPill({ icon: Icon, label, value, color = "gray" }: StatPillProps) {
  const colorClasses = {
    green: "bg-green-500/10 text-green-600",
    yellow: "bg-yellow-500/10 text-yellow-600",
    red: "bg-red-500/10 text-red-600",
    blue: "bg-blue-500/10 text-blue-600",
    gray: "bg-primary/10 text-primary",
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-muted-foreground/10 bg-card/70 px-5 py-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", colorClasses[color])}>
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
