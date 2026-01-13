"use client"

import React from "react"
import { toast } from "sonner"
import { type Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
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
import { Input } from "@/components/ui/input"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

import type { IShiftAssignment } from "@/interface"
import {
  createShiftAssignment,
  deleteShiftAssignment,
  getShiftAssignmentsRange,
  ShiftAssignmentMemberOption,
  ShiftOption,
} from "@/action/shift-assignments"

const assignmentSchema = z.object({
  organization_member_ids: z.array(z.string()).min(1, "Member is required"),
  shift_id: z.string().min(1, "Shift is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  repeat: z.enum(["never", "daily", "interval", "weekly"]).default("never"),
  repeat_interval_days: z.coerce.number().int().min(1).default(1),
  repeat_weekly_days: z.array(z.number().int().min(0).max(6)).default([]),
})

type AssignmentForm = z.infer<typeof assignmentSchema>

interface ShiftAssignmentClientProps {
  organizationId: string
  initialAssignments: IShiftAssignment[]
  members: ShiftAssignmentMemberOption[]
  shifts: ShiftOption[]
  isLoading?: boolean
  pageIndex?: number
  pageSize?: number
  totalRecords?: number
  onPageIndexChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRefresh?: () => void
}

const pad2 = (n: number) => String(n).padStart(2, "0")

const toISODate = (d: Date) => {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

const addDays = (d: Date, days: number) => {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + days)
  return dt
}

const startOfWeekMonday = (d: Date) => {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  const day = dt.getDay() // 0=Sun ... 6=Sat
  const diff = (day + 6) % 7 // convert so Monday=0
  dt.setDate(dt.getDate() - diff)
  return dt
}

const formatWeekRangeLabel = (weekStart: Date) => {
  const weekEnd = addDays(weekStart, 6)
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
  const start = weekStart.toLocaleDateString(undefined, options)
  const end = weekEnd.toLocaleDateString(undefined, options)
  return `${start} - ${end}`
}

const toMemberLabel = (m: ShiftAssignmentMemberOption) => {
  const u = (m as any).user
  const fullName = [u?.first_name, u?.middle_name, u?.last_name]
    .filter((p: any) => p && String(p).trim() !== "")
    .join(" ")

  const name = fullName || u?.display_name || u?.email || m.employee_id || `Member ${m.id}`
  const suffix = m.employee_id ? ` (${m.employee_id})` : ""
  return `${name}${suffix}`
}

const toShiftLabel = (s: ShiftOption) => {
  const time = s.start_time && s.end_time ? ` ${String(s.start_time).slice(0, 5)}-${String(s.end_time).slice(0, 5)}` : ""
  return `${s.name || s.code || s.id}${time}`
}

const toShiftShortLabel = (s?: ShiftOption) => {
  if (!s) return "Shift"
  const time = s.start_time && s.end_time ? `${String(s.start_time).slice(0, 5)} - ${String(s.end_time).slice(0, 5)}` : ""
  const name = s.name || s.code || "Shift"
  return time ? `${name}\n${time}` : name
}

const colorFromString = (input?: string) => {
  const v = String(input || "")
  let hash = 0
  for (let i = 0; i < v.length; i++) hash = (hash * 31 + v.charCodeAt(i)) | 0
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 85% 45%)`
}

export default function ShiftAssignmentClient({
  organizationId,
  initialAssignments,
  members,
  shifts,
  isLoading = false,
  onRefresh,
}: ShiftAssignmentClientProps) {
  const [assignments, setAssignments] = React.useState<IShiftAssignment[]>(initialAssignments)
  const [open, setOpen] = React.useState(false)
  const [calendarLoading, setCalendarLoading] = React.useState(false)
  const [weekStart, setWeekStart] = React.useState<Date>(() => startOfWeekMonday(new Date()))
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>("all")
  const [membersOpen, setMembersOpen] = React.useState(false)

  const shiftsById = React.useMemo(() => {
    const m = new Map<string, ShiftOption>()
    for (const s of shifts) m.set(s.id, s)
    return m
  }, [shifts])

  React.useEffect(() => {
    setAssignments(initialAssignments)
  }, [initialAssignments])

  const fetchWeekAssignments = React.useCallback(
    async (ws: Date) => {
      try {
        setCalendarLoading(true)
        const startDate = toISODate(ws)
        const endDate = toISODate(addDays(ws, 6))
        const res = await getShiftAssignmentsRange(organizationId, startDate, endDate)
        if (!res?.success) throw new Error((res as any)?.message || "Failed to load assignments")
        setAssignments(Array.isArray((res as any).data) ? ((res as any).data as IShiftAssignment[]) : [])
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load assignments")
        setAssignments([])
      } finally {
        setCalendarLoading(false)
      }
    },
    [organizationId],
  )

  React.useEffect(() => {
    fetchWeekAssignments(weekStart)
  }, [fetchWeekAssignments, weekStart])

  const form = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema) as unknown as Resolver<AssignmentForm>,
    defaultValues: {
      organization_member_ids: [],
      shift_id: "",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      start_time: "09:00",
      end_time: "17:00",
      repeat: "never",
      repeat_interval_days: 1,
      repeat_weekly_days: [],
    },
  })

  const closeDialog = () => {
    setOpen(false)
    form.reset({
      organization_member_ids: [],
      shift_id: "",
      start_date: toISODate(weekStart),
      end_date: toISODate(weekStart),
      start_time: "09:00",
      end_time: "17:00",
      repeat: "never",
      repeat_interval_days: 1,
      repeat_weekly_days: [],
    })
  }

  const handleSubmit = async (values: AssignmentForm) => {
    try {
      const start = new Date(values.start_date)
      const end = new Date(values.end_date)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Invalid date")
      if (end < start) throw new Error("End date must be after start date")

      const repeat = values.repeat || "never"
      const stepDays = repeat === "interval" ? Math.max(1, Number(values.repeat_interval_days) || 1) : 1

      const allDates: string[] = []
      let cursor = new Date(start)
      cursor.setHours(0, 0, 0, 0)
      const endDt = new Date(end)
      endDt.setHours(0, 0, 0, 0)

      if (repeat === "never") {
        allDates.push(toISODate(cursor))
      } else if (repeat === "weekly") {
        const allowed = new Set<number>(Array.isArray(values.repeat_weekly_days) ? values.repeat_weekly_days : [])
        while (cursor <= endDt) {
          if (allowed.size === 0 || allowed.has(cursor.getDay())) {
            allDates.push(toISODate(cursor))
          }
          cursor = addDays(cursor, 1)
        }
      } else {
        while (cursor <= endDt) {
          allDates.push(toISODate(cursor))
          cursor = addDays(cursor, stepDays)
        }
      }

      const memberIds = Array.isArray(values.organization_member_ids) ? values.organization_member_ids : []
      if (memberIds.length === 0) throw new Error("Member is required")

      const created: IShiftAssignment[] = []
      for (const memberId of memberIds) {
        for (const dateStr of allDates) {
          const res = await createShiftAssignment({
            organization_member_id: memberId,
            shift_id: values.shift_id,
            assignment_date: dateStr,
          })
          if (!res.success || !res.data) throw new Error(res.message || "Failed to assign")
          created.push(res.data as IShiftAssignment)
        }
      }

      toast.success(created.length > 1 ? "Shifts created" : "Shift assigned")
      setAssignments((prev) => [...created, ...prev])
      onRefresh?.()
      await fetchWeekAssignments(weekStart)
      closeDialog()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteShiftAssignment(id)
      if (!res.success) throw new Error(res.message || "Failed to delete")

      toast.success(res.message || "Assignment deleted")
      setAssignments((prev) => prev.filter((a) => a.id !== id))
      onRefresh?.()
      await fetchWeekAssignments(weekStart)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const days = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const assignmentsByMemberDate = React.useMemo(() => {
    const map = new Map<string, IShiftAssignment[]>()
    for (const a of assignments) {
      const key = `${a.organization_member_id}__${a.assignment_date}`
      const list = map.get(key)
      if (list) list.push(a)
      else map.set(key, [a])
    }
    return map
  }, [assignments])

  const anyAssignmentsByDate = React.useMemo(() => {
    const set = new Set<string>()
    for (const a of assignments) set.add(a.assignment_date)
    return set
  }, [assignments])

  const visibleMembers = React.useMemo(() => {
    if (selectedMemberId === "all") return members
    return members.filter((m) => m.id === selectedMemberId)
  }, [members, selectedMemberId])

  return (
    <div className="w-full h-full">
      <Card className="h-full border-0 shadow-none">
        <CardContent className="p-0">
          <div className="w-full">
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setWeekStart((d) => addDays(d, -7))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setWeekStart((d) => addDays(d, 7))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setWeekStart(startOfWeekMonday(new Date()))}>
                    Today
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4 opacity-70" />
                        <span className="text-sm tabular-nums">{formatWeekRangeLabel(weekStart)}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={weekStart}
                        onSelect={(d) => {
                          if (!d) return
                          setWeekStart(startOfWeekMonday(d))
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All members</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {toMemberLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog
                    open={open}
                    onOpenChange={(isOpen) => {
                      if (isOpen) {
                        setOpen(true)
                        const presetMemberIds = selectedMemberId !== "all" ? [selectedMemberId] : []
                        form.reset({
                          organization_member_ids: presetMemberIds,
                          shift_id: "",
                          start_date: toISODate(weekStart),
                          end_date: toISODate(weekStart),
                          start_time: "09:00",
                          end_time: "17:00",
                          repeat: "never",
                          repeat_interval_days: 1,
                          repeat_weekly_days: [],
                        })
                      } else {
                        closeDialog()
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={() => setOpen(true)} className="gap-2 whitespace-nowrap">
                        <Plus className="h-4 w-4" />
                        Create shift
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create shift</DialogTitle>
                      </DialogHeader>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="organization_member_ids"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Member</FormLabel>
                                <Popover open={membersOpen} onOpenChange={setMembersOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button type="button" variant="outline" className="w-full justify-between">
                                        <span className="truncate">
                                          {Array.isArray(field.value) && field.value.length > 0
                                            ? `${field.value.length} member(s)`
                                            : "Select member(s)"}
                                        </span>
                                        <span className="text-muted-foreground">Search</span>
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[320px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search member..." />
                                      <CommandList>
                                        <CommandEmpty>No member found.</CommandEmpty>
                                        <ScrollArea className="max-h-[260px]">
                                          {members.map((m) => {
                                            const checked = Array.isArray(field.value) ? field.value.includes(m.id) : false
                                            return (
                                              <CommandItem
                                                key={m.id}
                                                value={toMemberLabel(m)}
                                                onSelect={() => {
                                                  const current = Array.isArray(field.value) ? field.value : []
                                                  const next = checked ? current.filter((id) => id !== m.id) : [...current, m.id]
                                                  field.onChange(next)
                                                }}
                                              >
                                                <Checkbox checked={checked} className="mr-2" />
                                                <span className="truncate">{toMemberLabel(m)}</span>
                                              </CommandItem>
                                            )
                                          })}
                                        </ScrollArea>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="shift_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shift</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(v) => {
                                    field.onChange(v)
                                    const s = shiftsById.get(v)
                                    const st = s?.start_time ? String(s.start_time).slice(0, 5) : "09:00"
                                    const et = s?.end_time ? String(s.end_time).slice(0, 5) : "17:00"
                                    form.setValue("start_time", st)
                                    form.setValue("end_time", et)
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select shift" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {shifts.map((s) => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {toShiftLabel(s)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="start_date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="start_time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="end_time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="end_date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="repeat"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Repeat</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Repeat" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="never">Never</SelectItem>
                                      <SelectItem value="daily">Every day</SelectItem>
                                      <SelectItem value="interval">Every N days</SelectItem>
                                      <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="repeat_interval_days"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Interval (days)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min={1} step={1} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {form.watch("repeat") === "weekly" && (
                            <FormField
                              control={form.control}
                              name="repeat_weekly_days"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Days of week</FormLabel>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { d: 1, label: "Mon" },
                                      { d: 2, label: "Tue" },
                                      { d: 3, label: "Wed" },
                                      { d: 4, label: "Thu" },
                                      { d: 5, label: "Fri" },
                                      { d: 6, label: "Sat" },
                                      { d: 0, label: "Sun" },
                                    ].map((it) => {
                                      const current = Array.isArray(field.value) ? field.value : []
                                      const active = current.includes(it.d)
                                      return (
                                        <Button
                                          key={it.d}
                                          type="button"
                                          variant={active ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => {
                                            const next = active ? current.filter((x) => x !== it.d) : [...current, it.d]
                                            field.onChange(next)
                                          }}
                                        >
                                          {it.label}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={closeDialog}>
                              Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div className="w-full overflow-auto">
              <div className="min-w-[980px]">
                <div className="grid" style={{ gridTemplateColumns: "260px repeat(7, minmax(140px, 1fr))" }}>
                  <div className="sticky left-0 z-10 bg-background border-b border-r px-3 py-3 text-sm font-medium">
                    Members
                  </div>
                  {days.map((d) => {
                    const dateStr = toISODate(d)
                    const hasAny = anyAssignmentsByDate.has(dateStr)
                    return (
                      <div
                        key={dateStr}
                        className={`border-b border-r px-3 py-3 ${hasAny ? "bg-muted/40" : "bg-background"}`}
                      >
                        <div className="text-xs text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}</div>
                        <div className="text-2xl leading-none font-semibold tabular-nums">{d.getDate()}</div>
                      </div>
                    )
                  })}

                  {(calendarLoading || isLoading) && (
                    <div className="col-span-8 border-b p-6 text-sm text-muted-foreground">Loading schedules...</div>
                  )}

                  {!calendarLoading && !isLoading && visibleMembers.length === 0 && (
                    <div className="col-span-8 border-b p-6 text-sm text-muted-foreground">No members.</div>
                  )}

                  {!calendarLoading && !isLoading &&
                    visibleMembers.map((m) => {
                      return (
                        <React.Fragment key={m.id}>
                          <div className="sticky left-0 z-10 bg-background border-b border-r px-3 py-3">
                            <div className="text-sm font-medium">{toMemberLabel(m)}</div>
                          </div>
                          {days.map((d) => {
                            const dateStr = toISODate(d)
                            const key = `${m.id}__${dateStr}`
                            const cellAssignments = assignmentsByMemberDate.get(key) || []

                            return (
                              <div key={key} className="border-b border-r px-2 py-2 align-top">
                                <div className="flex flex-col gap-2">
                                  {cellAssignments.map((a) => {
                                    const shift = shiftsById.get(a.shift_id)
                                    const bg = (shift as any)?.color_code || colorFromString(a.shift_id)
                                    const label = toShiftShortLabel(shift)
                                    return (
                                      <div
                                        key={a.id}
                                        className="rounded-md px-2 py-2 text-xs whitespace-pre-line text-white"
                                        style={{ backgroundColor: bg }}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="font-medium leading-tight">{label}</div>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-white/90 hover:text-white"
                                              >
                                                <Trash className="h-3.5 w-3.5" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Delete shift</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to delete this shift assignment?
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(a.id)}>Delete</AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
