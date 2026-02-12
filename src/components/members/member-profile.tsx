"use client"

/**
 * Form-Based Member Profile Component
 * Clean, minimal profile editor with tabs and form sections
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Mail,
  Clock,
  ChevronDown,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { getUserInitials } from "@/lib/avatar-utils"
import type { IOrganization_member, IMemberPerformance, IUser } from "@/interface"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
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

type TabType = "info" | "employment" | "roles" | "pay" | "worktime" | "settings"

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const formatPhoneNumber = (phone?: string | null) => {
  if (!phone || phone === "-" || phone.trim() === "") return ""
  return phone
}

// ============================================================================
// Sub-Components
// ============================================================================

function ContactInfoRow({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{text}</span>
    </div>
  )
}

function FormField({
  label,
  value,
  placeholder,
  type = "text",
  linkText,
  disabled = false,
}: {
  label: string
  value?: string
  placeholder?: string
  type?: "text" | "email" | "phone" | "date"
  linkText?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        {linkText && (
          <button className="text-xs text-primary hover:underline">{linkText}</button>
        )}
      </div>
      {type === "phone" ? (
        <div className="flex gap-2">
          <Input
            type="tel"
            defaultValue={value}
            placeholder={placeholder || "+1 201-555-0123"}
            disabled={disabled}
            className="flex-1"
          />
        </div>
      ) : (
        <Input
          type={type}
          defaultValue={value}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
        />
      )}
    </div>
  )
}



// ============================================================================
// Main Component
// ============================================================================

export default function MemberProfile({ member, performance: _performance, recentAttendance: attendance, schedule }: MemberProfileProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("info")
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const user: IUser | undefined = member.user
  // Use user.email directly as requested
  const email = user?.email || ""
  // Use user.phone directly as requested
  const phone = user?.phone || ""
  const photoUrl = useProfilePhotoUrl(user?.profile_photo_url ?? undefined) ?? undefined

  const displayName = user
    ? [user.first_name, user.middle_name, user.last_name]
      .filter((part) => part && part.trim().length)
      .join(" ") ||
    (user.email && !user.email.toLowerCase().endsWith("@dummy.local") ? user.email : null) ||
    "Name unavailable"
    : "Name unavailable"

  const joinDate = formatDate(member.hire_date)
  const homeAddress = user
    ? [user.jalan, user.kelurahan, user.kecamatan].filter(Boolean).join(", ")
    : ""

  const lastTracked = mounted && attendance && attendance.length > 0
    ? formatDate(attendance?.[0]?.date)
    : "No recent activity"

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Implement save logic
    setTimeout(() => setIsSaving(false), 1000)
  }

  const tabs = [
    { id: "info" as TabType, label: "INFO" },
    { id: "employment" as TabType, label: "EMPLOYMENT" },
    { id: "roles" as TabType, label: "ROLES" },
    { id: "pay" as TabType, label: "PAY / BILL" },
    { id: "worktime" as TabType, label: "WORK TIME & LIMITS" },
    { id: "settings" as TabType, label: "SETTINGS" },
  ]

  return (
    <div className="h-full bg-background">
      {/* Top Bar */}
      <div className="bg-card">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/members/edit/${member.id}`)}>
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>Reset Password...</DropdownMenuItem>
                  <DropdownMenuItem>Manage profile fields</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/members")}>
                    Back to Members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "info" && (
          <div className="space-y-8">
            {/* Top Row: Avatar + Contact Info */}
            <div className="flex gap-8">
              {/* Left: Avatar */}
              <div className="flex-shrink-0">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 bg-primary">
                    <AvatarImage src={photoUrl} alt={displayName} />
                    <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                      {getUserInitials(
                        user?.first_name,
                        user?.last_name,
                        user?.display_name ?? undefined,
                        user?.email ?? undefined
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Joined
                    <br />
                    {joinDate}
                  </p>
                </div>
              </div>

              {/* Right: Contact Info */}
              <div className="space-y-2">
                <ContactInfoRow icon={Mail} text={email || "No email"} />
                <ContactInfoRow icon={Clock} text={`Last tracked time ${lastTracked}`} />
              </div>
            </div>

            {/* Identity Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold">Identity</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="EMPLOYEE ID"
                  value={user?.nik || member.employee_id || user?.employee_code || ""}
                  placeholder="No employee ID"
                />

                <FormField
                  label="BIRTHDAY"
                  value={user?.date_of_birth ?? ""}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold">Contact</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="HOME ADDRESS"
                  value={homeAddress}
                  placeholder="Search for an address"
                />
                <FormField
                  label="PERSONAL EMAIL"
                  value={email}
                  placeholder="name@example.com"
                  type="email"
                />
                <FormField
                  label="PERSONAL PHONE"
                  value={formatPhoneNumber(phone)}
                  type="phone"
                />
              </div>
            </div>

            {/* Work Schedule Section */}
            {schedule && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold">Work Schedule</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{schedule.name}</p>
                          <p className="text-xs text-muted-foreground">{schedule.type}</p>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Working Hours</p>
                          <p className="text-sm font-medium">{schedule.workingHours}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Working Days</p>
                          <p className="text-sm font-medium">{schedule.workingDays.join(", ")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Other tabs content */}
        {activeTab !== "info" && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {tabs.find((t) => t.id === activeTab)?.label} content coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
