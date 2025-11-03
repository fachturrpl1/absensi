"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, X, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"

import { createManualAttendance, checkExistingAttendance } from "@/action/attendance"
import { getAllOrganization_member } from "@/action/members"
import { toTimestampWithTimezone } from "@/lib/timezone"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { IOrganization_member } from "@/interface"
import { toast } from "sonner"

type AttendanceEntry = {
  organization_member_id: string
  attendance_date: string
  actual_check_in: string
  actual_check_out: string | null
  status: string
  remarks?: string
}

type MemberOption = {
  id: string
  label: string
  department: string
}

type BatchEntry = {
  id: string
  memberId: string
  checkInDate: string
  checkInTime: string
  checkOutDate?: string
  checkOutTime?: string
  status: string
  remarks?: string
}

const STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
  { value: "early_leave", label: "Early Leave" },
]

const singleFormSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkInTime: z.string().min(1, "Check-in time is required"),
  checkOutDate: z.string().optional(),
  checkOutTime: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  remarks: z.string().max(500).optional(),
})

type SingleFormValues = z.infer<typeof singleFormSchema>

export function AttendanceFormBatch() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [originalMembersData, setOriginalMembersData] = useState<IOrganization_member[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("single")
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [availableGroups, setAvailableGroups] = useState<Array<{id: string, name: string}>>([])

  // Auto-fill dengan waktu sekarang
  const now = new Date();
  const currentDate = format(now, 'yyyy-MM-dd');
  const currentTime = format(now, 'HH:mm');

  const form = useForm<SingleFormValues>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      checkInDate: currentDate,
      checkInTime: currentTime,
      checkOutDate: currentDate,
      checkOutTime: currentTime,
      status: "present",
      remarks: "",
    },
  })

  // Load members once on mount
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true)
        const res = await getAllOrganization_member()

        if (!res.success) {
          throw new Error(res.message || "Failed to load members")
        }

        const membersData = (res.data || []) as IOrganization_member[]
        
        // Store original data for filtering
        setOriginalMembersData(membersData)
        
        // Extract unique groups/departments
        const groupsMap = new Map<string, string>()
        membersData.forEach((member) => {
          if (member.department_id && member.departments?.name) {
            groupsMap.set(String(member.department_id), member.departments.name)
          }
        })
        const groups = Array.from(groupsMap.entries()).map(([id, name]) => ({ id, name }))
        setAvailableGroups(groups)

        const options: MemberOption[] = membersData
          .filter((member) => member.id && member.user?.id)
          .map((member) => {
            // Build full name from first, middle, last name
            const nameParts = [
              member.user?.first_name?.trim(),
              member.user?.middle_name?.trim(),
              member.user?.last_name?.trim()
            ].filter(Boolean)
            
            const fullName = nameParts.length > 0 
              ? nameParts.join(" ") 
              : member.user?.email || "Unknown"

            return {
              id: String(member.id),
              label: fullName,
              department: member.departments?.name || "No Department",
            }
          })

        setMembers(options)
      } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred"
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [])

  // Parse date and time to DateTime
  const parseDateTime = (dateStr: string, timeStr: string): Date => {
    const [year, month, day] = dateStr.split("-")
    const [hour, minute] = timeStr.split(":")
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0
    )
  }

  // Single Mode Submit
  const onSubmitSingle = async (values: SingleFormValues) => {
    try {
      const checkInDateTime = parseDateTime(values.checkInDate, values.checkInTime)
      const checkOutDateTime = values.checkOutDate && values.checkOutTime 
        ? parseDateTime(values.checkOutDate, values.checkOutTime)
        : null

      const payload: AttendanceEntry = {
        organization_member_id: values.memberId,
        attendance_date: values.checkInDate,
        actual_check_in: toTimestampWithTimezone(checkInDateTime),
        actual_check_out: checkOutDateTime ? toTimestampWithTimezone(checkOutDateTime) : null,
        status: values.status,
        remarks: values.remarks?.trim() || undefined,
      }

      const res = await createManualAttendance(payload)

      if (res.success) {
        // Invalidate all dashboard-related queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast.success("Attendance recorded successfully")
        router.push("/attendance")
      } else {
        toast.error(res.message || "Failed to save attendance")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred"
      toast.error(message)
    }
  }

  // Batch Mode: Add Entry
  const addBatchEntry = (memberId?: string) => {
    const newEntry: BatchEntry = {
      id: Date.now().toString(),
      memberId: memberId || "",
      checkInDate: new Date().toISOString().split("T")[0],
      checkInTime: "08:00",
      checkOutTime: "17:00",
      status: "present",
      remarks: "",
    }
    setBatchEntries([...batchEntries, newEntry])
  }

  // Batch Mode: Remove Entry
  const removeBatchEntry = (id: string) => {
    setBatchEntries(batchEntries.filter((entry) => entry.id !== id))
  }

  // Batch Mode: Update Entry
  const updateBatchEntry = (id: string, field: string, value: string) => {
    setBatchEntries(
      batchEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    )
  }

  // Batch Mode: Submit All
  const onSubmitBatch = async () => {
    if (batchEntries.length === 0) {
      toast.error("Please add at least one attendance record")
      return
    }

    // Validate all entries
    for (const entry of batchEntries) {
      if (!entry.memberId || !entry.checkInDate || !entry.checkInTime) {
        toast.error(`Incomplete entry - please fill all required fields`)
        return
      }
    }

    // Check for duplicates within batch itself
    const duplicateCheck = new Map<string, string[]>()
    for (const entry of batchEntries) {
      const key = `${entry.memberId}-${entry.checkInDate}`
      if (!duplicateCheck.has(key)) {
        duplicateCheck.set(key, [])
      }
      duplicateCheck.get(key)!.push(entry.memberId)
    }

    for (const [key, memberIds] of duplicateCheck.entries()) {
      if (memberIds.length > 1) {
        const [memberId, date] = key.split("-")
        const selectedMember = members.find((m) => m.id === memberId)
        const memberName = selectedMember?.label || `Member ${memberId}`
        toast.error(`${memberName} has duplicate entries for ${date}`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      let successCount = 0
      let skipCount = 0
      const errors: string[] = []

      for (const entry of batchEntries) {
        const selectedMember = members.find((m) => m.id === entry.memberId)
        const memberName = selectedMember?.label || `Member ${entry.memberId}`

        // Check if attendance already exists for this member and date
        // Convert memberId to ensure it's a proper number
        const checkRes = await checkExistingAttendance(String(Number(entry.memberId)), entry.checkInDate)
        if (checkRes.success && checkRes.exists) {
          skipCount++
          errors.push(`${memberName} already has attendance recorded for ${entry.checkInDate}`)
          continue
        }

        const checkInDateTime = parseDateTime(entry.checkInDate, entry.checkInTime)
        const checkOutDateTime = entry.checkOutDate && entry.checkOutTime
          ? parseDateTime(entry.checkOutDate, entry.checkOutTime)
          : null

        const payload: AttendanceEntry = {
          organization_member_id: entry.memberId,
          attendance_date: entry.checkInDate,
          actual_check_in: toTimestampWithTimezone(checkInDateTime),
          actual_check_out: checkOutDateTime ? toTimestampWithTimezone(checkOutDateTime) : null,
          status: entry.status,
          remarks: entry.remarks?.trim() || undefined,
        }

        const res = await createManualAttendance(payload)
        if (res.success) {
          successCount++
        } else {
          skipCount++
          errors.push(`${memberName}: ${res.message}`)
        }
      }

      if (successCount === batchEntries.length) {
        // Invalidate dashboard cache to refresh data
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast.success(`${successCount} attendance records saved successfully`)
        router.push("/attendance")
      } else if (successCount > 0) {
        // Invalidate dashboard cache even for partial success
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast.success(`${successCount} records saved`)
        if (skipCount > 0) {
          toast.error(`${skipCount} records skipped (duplicates or errors)`)
          errors.forEach((err) => toast.info(err))
        }
        setTimeout(() => router.push("/attendance"), 2000)
      } else {
        toast.error("No records could be saved")
        errors.forEach((err) => toast.error(err))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="batch">Batch Entry</TabsTrigger>
        </TabsList>

        {/* SINGLE MODE */}
        <TabsContent value="single" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitSingle)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Single Attendance</CardTitle>
                  <CardDescription>Record attendance for one team member</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Group Filter */}
                  <div className="space-y-2">
                    <FormLabel>Filter by Group</FormLabel>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={loading}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Groups" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {availableGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Member Selection */}
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => {
                      const filteredMembers = selectedGroup === "all"
                        ? members
                        : members.filter((m) => {
                            const member = originalMembersData.find((om) => String(om.id) === m.id)
                            return member && String(member.department_id) === selectedGroup
                          })

                      return (
                        <FormItem>
                          <FormLabel>Select Member *</FormLabel>
                          <Select disabled={loading} value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={loading ? "Loading members..." : "Choose a member"}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-72">
                              {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-3">
                                      <span>{member.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({member.department})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                  {loading ? "Loading..." : selectedGroup === "all" ? "No members found" : "No members in this group"}
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {STATUSES.map((status) => (
                            <Button
                              key={status.value}
                              type="button"
                              variant={field.value === status.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => field.onChange(status.value)}
                            >
                              {status.label}
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Check-in */}
                  <div className="space-y-3">
                    <FormLabel>Check-in Date & Time *</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="checkInDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="checkInTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Check-out */}
                  <div className="space-y-3">
                    <FormLabel>Check-out Date & Time (Optional)</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="checkOutDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="checkOutTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes..."
                            rows={3}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription>Max 500 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* BATCH MODE */}
        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Batch Attendance</CardTitle>
              <CardDescription>Record attendance for multiple team members at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Group Filter for Batch Mode */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Group</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={loading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {availableGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Add Buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quick Add Members</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addBatchEntry()}
                    disabled={isSubmitting}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Empty Entry
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {(selectedGroup === "all"
                    ? members
                    : members.filter((m) => {
                        const member = originalMembersData.find((om) => String(om.id) === m.id)
                        return member && String(member.department_id) === selectedGroup
                      })
                  ).map((member) => (
                    <Button
                      key={member.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const exists = batchEntries.some((e) => e.memberId === member.id)
                        if (!exists) {
                          addBatchEntry(member.id)
                          toast.success(`${member.label} added`)
                        } else {
                          toast.info(`${member.label} already in batch`)
                        }
                      }}
                      disabled={isSubmitting}
                      className="text-left truncate"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      <span className="truncate text-xs">{member.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Batch Entries List */}
              <div className="space-y-3">
                <label className="text-sm font-medium block">
                  Attendance Records ({batchEntries.length})
                </label>

                {batchEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No entries yet. Click "Add Empty Entry" or quick add a member above.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {batchEntries.map((entry, idx) => {
                      const selectedMember = members.find((m) => m.id === entry.memberId)
                      return (
                        <Card key={entry.id} className="bg-muted/50">
                          <CardContent className="pt-6 space-y-4">
                            {/* Member & Remove */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                {selectedMember ? (
                                  <>
                                    <div className="font-semibold">{selectedMember.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {selectedMember.department}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-muted-foreground">No member selected</div>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBatchEntry(entry.id)}
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>

                            {/* Member Select */}
                            <Select
                              value={entry.memberId}
                              onValueChange={(value) =>
                                updateBatchEntry(entry.id, "memberId", value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select member" />
                              </SelectTrigger>
                              <SelectContent className="max-h-48">
                                {(selectedGroup === "all"
                                  ? members
                                  : members.filter((m) => {
                                      const member = originalMembersData.find((om) => String(om.id) === m.id)
                                      return member && String(member.department_id) === selectedGroup
                                    })
                                ).map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{member.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({member.department})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Status */}
                            <Select
                              value={entry.status}
                              onValueChange={(value) =>
                                updateBatchEntry(entry.id, "status", value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Check-in */}
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="date"
                                value={entry.checkInDate}
                                onChange={(e) =>
                                  updateBatchEntry(entry.id, "checkInDate", e.target.value)
                                }
                                disabled={isSubmitting}
                              />
                              <Input
                                type="time"
                                value={entry.checkInTime}
                                onChange={(e) =>
                                  updateBatchEntry(entry.id, "checkInTime", e.target.value)
                                }
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Check-out */}
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="date"
                                value={entry.checkOutDate || ""}
                                onChange={(e) =>
                                  updateBatchEntry(entry.id, "checkOutDate", e.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder="Optional"
                              />
                              <Input
                                type="time"
                                value={entry.checkOutTime || ""}
                                onChange={(e) =>
                                  updateBatchEntry(entry.id, "checkOutTime", e.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder="Optional"
                              />
                            </div>

                            {/* Remarks */}
                            <Input
                              type="text"
                              value={entry.remarks || ""}
                              onChange={(e) =>
                                updateBatchEntry(entry.id, "remarks", e.target.value)
                              }
                              disabled={isSubmitting}
                              placeholder="Notes (optional)"
                              maxLength={500}
                            />
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Batch Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={onSubmitBatch}
              disabled={isSubmitting || batchEntries.length === 0}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save {batchEntries.length} Records
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
