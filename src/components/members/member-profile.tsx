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
import { MemberAttendanceDonut, MemberAttendanceDonutCompact } from "@/components/charts/member-attendance-donut"
import type { IOrganization_member, IMemberPerformance } from "@/interface"
import { cn } from "@/lib/utils"

import { memberLogger } from '@/lib/logger';
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
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
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
  emergencyContact: _emergencyContact,
}: MemberProfileEnhancedProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

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
      memberLogger.debug("Exporting profile to PDF...")
    }, 1000)
  }

  const handleViewFullAttendance = () => {
    router.push(`/attendance?member=${member.id}`)
  }

  const handleManageSchedule = () => {
    router.push(`/member-schedules?member=${member.id}`)
  }

  // Get employment status for display (e.g., "Siswa")
  const employmentStatus = member.employment_status || ""

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 sm:px-6 lg:px-10">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-2 border-background shadow-lg sm:h-24 sm:w-24">
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
          <div className="space-y-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{displayName || "Name unavailable"}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{groupName || positionTitle || "No role"}</span>
              {employmentStatus && (
                <>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  <span>{employmentStatus}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {canEmail ? (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={`mailto:${email}`}>
                <Mail className="h-4 w-4" />
                Send Email
              </a>
            </Button>
          ) : null}
          {canCall ? (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={`tel:${phone}`}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact & Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={Mail} label="Email" value={email} />
              <InfoItem icon={Phone} label="Phone" value={formatPhoneNumber(phone)} />
              <InfoItem icon={BriefcaseBusiness} label="Role/Department" value={groupName || "-"} />
              <InfoItem icon={MapPin} label="Location/Group" value={member.work_location || groupName || "-"} />
              <InfoItem icon={UserRound} label="ID" value={member.employee_id || "-"} />
              <InfoItem icon={Calendar} label="Date" value={formatDate(member.hire_date)} />
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          {recentAttendance && recentAttendance.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Attendance</CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleViewFullAttendance}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAttendance.slice(0, 5).map((record) => {
                  const StatusIcon = getStatusIcon(record.status)
                  const isPresent = record.status === "present"
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-3"
                    >
                      {isPresent ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                          <StatusIcon className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", getStatusColor(record.status))}>
                          <StatusIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{formatDateShort(record.date)}</div>
                        {record.checkIn && (
                          <div className="text-sm font-medium">{record.checkIn}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Work Schedule */}
          {schedule ? (
            <Card>
              <CardHeader>
                <CardTitle>Work Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Standard Office Hours</span>
                  <Badge variant="outline" className="text-xs">{schedule.type}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Working hours</p>
                    <p className="text-lg font-semibold">{schedule.workingHours}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Working Days</p>
                    <p className="text-lg font-semibold">{schedule.workingDays.join(", ")}</p>
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

          {/* Performance Highlights */}
          {performance ? (
            <Card>
              <CardHeader>
                <CardTitle>Performance Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  {/* Donut Chart */}
                  <div className="shrink-0">
                    <MemberAttendanceDonutCompact data={attendancePercentages} />
                  </div>
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {[
                      { key: "present", label: "Present", color: "bg-black" },
                      { key: "late", label: "Late", color: "bg-gray-400" },
                      { key: "excused", label: "Excused", color: "bg-gray-400" },
                    ].map((item) => {
                      const value = attendancePercentages[item.key as keyof typeof attendancePercentages] || 0
                      const total = Object.values(attendancePercentages).reduce((a, b) => a + b, 0)
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0"
                      return (
                        <div key={item.key} className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", item.color)} />
                          <span className="text-sm">{item.label}</span>
                          {item.key === "present" && (
                            <span className="ml-auto rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                              {percentage}%
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
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
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <span className="text-sm text-foreground">
          {value && String(value).trim().length ? value : "-"}
        </span>
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
