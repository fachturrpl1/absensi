"use client"

/**
 * Enhanced Member Profile Component
 *
 * Layout is designed to match the provided mock:
 * - Header with avatar, basic info, and quick actions
 * - Contact & Information + Work Schedule cards
 * - Recent Attendance + Performance Highlights
 * Plus several extra data sections (Personal Details, Organization & Access, Emergency Contact).
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
  ChevronDown,
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
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { getUserInitials } from "@/lib/avatar-utils"
import { MemberAttendanceDonut } from "@/components/charts/member-attendance-donut"
import type { IOrganization_member, IMemberPerformance } from "@/interface"
import { cn } from "@/lib/utils"

import { memberLogger } from "@/lib/logger"

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

type MemberProfileEnhancedProps = {
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
  if (!phone || phone === "-" || phone.trim() === "") return "No Phone"
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
}: MemberProfileEnhancedProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>("all")
  const [attendancePeriodFilter, setAttendancePeriodFilter] = useState<string>("all")
  const [profileSearchQuery, setProfileSearchQuery] = useState<string>("")

  const user = member.user
  const email = user?.email ?? (member as { email?: string }).email ?? "-"
  const phone = user?.mobile || user?.phone || ""
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
  const canCall = phone && phone.trim() !== "" && phone !== "No Phone"
  const employmentStatus = member.employment_status?.trim()
  const showEmploymentStatusBadge = employmentStatus && employmentStatus.toLowerCase() !== "active"

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
  const attendanceRate =
    totalDays > 0
      ? (((attendancePercentages.present + attendancePercentages.late) / totalDays) * 100).toFixed(1)
      : "0"

  // Mock trend - replace with actual data
  const trend: "up" | "down" | "neutral" = "up"

  // Quick Actions
  const handleEdit = () => {
    router.push(`/members/edit/${member.id}`)
  }

  const handleExport = async () => {
    setIsExporting(true)
    // TODO: Implement PDF export
    setTimeout(() => {
      setIsExporting(false)
      memberLogger.debug("Exporting profile to PDF...")
    }, 1000)
  }

  const handleViewFullAttendance = () => {
    router.push(`/attendance?member=${member.id}`)
  }

  const handleManageSchedule = () => {
    router.push(`/member-schedules?member=${member.id}`)
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-3 pb-4 sm:px-4 lg:px-6">
      {/* Header Card with Enhanced Actions */}
      <Card className="border-muted-foreground/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="flex flex-col gap-4 p-4 sm:px-5 sm:py-5 lg:flex-row lg:flex-nowrap lg:items-start lg:justify-between lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center lg:flex-row lg:items-center lg:text-left">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-background shadow-lg sm:h-20 sm:w-20">
                <AvatarImage src={photoUrl} alt={displayName} />
                <AvatarFallback className="text-xl font-semibold">
                  {getUserInitials(
                    user?.first_name,
                    user?.last_name,
                    user?.display_name ?? undefined,
                    user?.email ?? undefined
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
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <CardTitle className="break-words text-xl font-semibold sm:text-2xl">
                  {displayName || "Name unavailable"}
                </CardTitle>
                {/* Show Active/Inactive status with priority over employment_status */}
                <Badge
                  variant={member.is_active ? "default" : "destructive"}
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                >
                  {member.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="break-words text-xs sm:text-sm text-muted-foreground">
                {groupPosition || "Role details unavailable"}
              </CardDescription>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground lg:justify-start">
                {member.departments?.name ? <Badge variant="outline">{member.departments.name}</Badge> : null}
                {showEmploymentStatusBadge ? <Badge variant="outline">{employmentStatus}</Badge> : null}
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
          <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[260px]">
            <div className="grid grid-cols-2 gap-2">
              {canEmail ? (
                <Button
                  variant="ghost"
                  className={cn(
                    "h-11 justify-center gap-2 rounded-xl border border-border bg-card/80 text-sm font-medium shadow-sm hover:bg-card",
                    !canCall ? "col-span-2" : ""
                  )}
                  asChild
                >
                  <a href={`mailto:${email}`}>
                    <Mail className="h-4 w-4" />
                    Send Email
                  </a>
                </Button>
              ) : null}
              {canCall ? (
                <Button
                  variant="ghost"
                  className={cn(
                    "h-11 justify-center gap-2 rounded-xl border border-border bg-card/80 text-sm font-medium shadow-sm hover:bg-card",
                    !canEmail ? "col-span-2" : ""
                  )}
                  asChild
                >
                  <a href={`tel:${phone}`}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
              ) : null}
            </div>

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-11 w-full items-center justify-between rounded-xl border border-border bg-card/80 px-4 text-sm font-medium shadow-sm hover:bg-card"
                >
                  <span className="flex items-center gap-2">
                    <MoreVertical className="h-4 w-4" />
                    Quick Actions
                  </span>
                  <ChevronDown className="h-4 w-4" />
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

            <div className="flex justify-end">
              <Button variant="link" className="h-auto px-0 text-sm font-semibold" onClick={() => router.back()}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-4">
        {/* Grid Layout for Top Cards (matches reference layout) */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Contact & Information */}
          <Card className="border-muted-foreground/20">
            <CardHeader className="flex flex-col gap-0.5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold">Contact & Information</CardTitle>
                  <CardDescription>Basic employment and contact details.</CardDescription>
                </div>
                <div className="relative w-[200px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search fields..."
                    value={profileSearchQuery}
                    onChange={(e) => setProfileSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              {(() => {
                const infoItems = [
                  { icon: Mail, label: "Email", value: email },
                  { icon: Phone, label: "Phone", value: formatPhoneNumber(phone) },
                  { icon: BriefcaseBusiness, label: "Position", value: positionTitle || "-" },
                  { icon: Building, label: "Group", value: groupName || "-" },
                  { icon: MapPin, label: "Location", value: member.work_location || "-" },
                  {
                    icon: UserRound,
                    label: "Employee ID",
                    value: member.employee_id || user?.employee_code || "-",
                  },
                  { icon: Calendar, label: "Hire Date", value: formatDate(member.hire_date) },
                ]

                if (member.probation_end_date) {
                  infoItems.push({
                    icon: AlertCircle,
                    label: "Probation End",
                    value: formatDate(member.probation_end_date),
                  })
                }

                // Filter items based on search query
                const filteredItems = profileSearchQuery
                  ? infoItems.filter(
                      (item) =>
                        item.label.toLowerCase().includes(profileSearchQuery.toLowerCase()) ||
                        String(item.value).toLowerCase().includes(profileSearchQuery.toLowerCase())
                    )
                  : infoItems

                return filteredItems.map((item, index) => (
                  <InfoItem key={index} icon={item.icon} label={item.label} value={item.value} />
                ))
              })()}
            </CardContent>
          </Card>

          {/* Schedule Information and Recent Attendance */}
          <div className="space-y-4">
            {schedule ? (
              <Card className="border-muted-foreground/20">
                <CardHeader className="flex flex-col gap-0.5 pb-3">
                  <CardTitle className="text-base font-semibold">Work Schedule</CardTitle>
                  <CardDescription>Current work schedule and hours.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-card/60 p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Schedule Name</p>
                      <p className="text-lg font-semibold text-primary">{schedule.name}</p>
                    </div>
                    <Badge variant="outline">{schedule.type}</Badge>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex items-center gap-2.5 rounded-lg border bg-card/60 px-3 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Timer className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="space-y-0">
                        <p className="text-[10px] text-muted-foreground">Working Hours</p>
                        <p className="text-xs font-semibold">{schedule.workingHours}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-lg border bg-card/60 px-3 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="space-y-0">
                        <p className="text-[10px] text-muted-foreground">Working Days</p>
                        <p className="text-xs font-semibold">{schedule.workingDays.join(", ")}</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" size="sm" onClick={handleManageSchedule}>
                    View Full Schedule
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {/* Recent Attendance */}
            <Card className="border-muted-foreground/20">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold">Recent Attendance</CardTitle>
                      <CardDescription>
                        {recentAttendance && recentAttendance.length > 0
                          ? `Last ${recentAttendance.length} days attendance records.`
                          : "Recent attendance records will appear here."}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={attendancePeriodFilter} onValueChange={setAttendancePeriodFilter}>
                      <SelectTrigger className="h-8 w-[110px] text-xs">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="last7">Last 7 Days</SelectItem>
                        <SelectItem value="last14">Last 14 Days</SelectItem>
                        <SelectItem value="last30">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={attendanceStatusFilter} onValueChange={setAttendanceStatusFilter}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleViewFullAttendance} className="h-8">
                      View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-h-[200px]">
                {(() => {
                  // Filter attendance records by status and period
                  const now = new Date()
                  const filteredAttendance = recentAttendance?.filter((record) => {
                    // Filter by status
                    const matchesStatus = attendanceStatusFilter === "all" || record.status === attendanceStatusFilter
                    
                    // Filter by period
                    if (!matchesStatus) return false
                    
                    if (attendancePeriodFilter === "all") return true
                    
                    const recordDate = new Date(record.date)
                    const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
                    
                    switch (attendancePeriodFilter) {
                      case "last7":
                        return daysDiff <= 7
                      case "last14":
                        return daysDiff <= 14
                      case "last30":
                        return daysDiff <= 30
                      default:
                        return true
                    }
                  }) || []

                  return filteredAttendance.length > 0 ? (
                    <div className="max-h-64 space-y-2.5 overflow-y-auto pr-2">
                      {filteredAttendance.map((record) => {
                      const StatusIcon = getStatusIcon(record.status)
                      return (
                        <div
                          key={record.id}
                          className="flex items-center gap-3 rounded-lg border bg-card/60 p-3 transition-colors hover:bg-accent/50"
                        >
                          <div className={cn("rounded-full p-2", getStatusColor(record.status))}>
                            <StatusIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{formatDateShort(record.date)}</p>
                              <Badge variant="outline">{getStatusLabel(record.status)}</Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
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
                  ) : (
                    <div className="flex items-center justify-center min-h-[200px] text-sm text-muted-foreground">
                      {recentAttendance && recentAttendance.length > 0
                        ? `No attendance records found with status "${attendanceStatusFilter}".`
                        : "No attendance records available yet."}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Highlights */}
        {performance ? (
          <Card className="border-muted-foreground/20">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold">Attendance Percentage</CardTitle>
                  <CardDescription>Attendance distribution across the evaluation period.</CardDescription>
                </div>
                {/* Attendance Rate with Trend */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="rounded-lg border-transparent bg-secondary text-secondary-foreground px-4 py-2.5 text-center whitespace-nowrap">
                    <p className="text-sm font-medium">
                      {attendanceRate}% Attendance Rate
                    </p>
                  </div>
                  <div className="p-2.5 bg-violet-100 dark:bg-violet-900 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                    {trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    ) : trend === "down" ? (
                      <TrendingDown className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    ) : (
                      <Minus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="mx-auto w-full max-w-[240px] md:max-w-[320px]">
                <MemberAttendanceDonut data={attendancePercentages} showLegend={false} hideTitle />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
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
    <div className="flex items-center gap-2.5 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="text-xs sm:text-sm font-semibold text-foreground">
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
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
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
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xs sm:text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}


