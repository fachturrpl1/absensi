"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus, Calendar, Check, ChevronsUpDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { cn } from "@/lib/utils"

import { IMemberSchedule, IOrganization_member, IWorkSchedule } from "@/interface"
import { useHydration } from "@/hooks/useHydration"
import { getAllOrganization_member } from "@/action/members"
import { getAllWorkSchedules } from "@/action/schedule"
import {
  getActiveMemberScheduleMemberIds,
  createMemberSchedule,
  updateMemberSchedule,
  deleteMemberSchedule
} from "@/action/members_schedule"

const memberScheduleSchema = z.object({
  organization_member_id: z.string().min(1, "Member is required"),
  work_schedule_id: z.string().min(1, "Work schedule is required"),
  shift_id: z.string().optional(),
  effective_date: z.string().min(1, "Effective date is required"),
  is_active: z.boolean(),
})

type MemberScheduleForm = z.infer<typeof memberScheduleSchema>

interface MemberSchedulesClientProps {
  initialSchedules: IMemberSchedule[]
  initialMembers: IOrganization_member[]
  initialWorkSchedules: IWorkSchedule[]
  activeMemberIds?: string[]
  isLoading?: boolean
  pageIndex?: number
  pageSize?: number
  totalRecords?: number
  onPageIndexChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRefresh?: () => void
}

export default function MemberSchedulesClient({
  initialSchedules,
  initialMembers,
  initialWorkSchedules,
  activeMemberIds: initialActiveMemberIds,
  isLoading = false,
  pageIndex,
  pageSize,
  totalRecords,
  onPageIndexChange,
  onPageSizeChange,
  onRefresh,
}: MemberSchedulesClientProps) {
  const router = useRouter()
  const { organizationId, isReady } = useHydration()
  const [schedules, setSchedules] = React.useState(initialSchedules)
  const [open, setOpen] = React.useState(false)
  const [editingSchedule, setEditingSchedule] = React.useState<IMemberSchedule | null>(null)
  const [members, setMembers] = React.useState<IOrganization_member[]>(initialMembers)
  const [workSchedules, setWorkSchedules] = React.useState<IWorkSchedule[]>(initialWorkSchedules)
  const [activeMemberIds, setActiveMemberIds] = React.useState<string[]>(initialActiveMemberIds || [])
  const [lookupsLoading, setLookupsLoading] = React.useState(false)
  const [memberQuery, setMemberQuery] = React.useState("")
  const [memberPopoverOpen, setMemberPopoverOpen] = React.useState(false)
  const [membersFetched, setMembersFetched] = React.useState(initialMembers.length > 0)
  const [workSchedulesFetched, setWorkSchedulesFetched] = React.useState(initialWorkSchedules.length > 0)
  const [activeIdsFetched, setActiveIdsFetched] = React.useState((initialActiveMemberIds || []).length > 0)
  const lookupsInFlightRef = React.useRef(false)
  const prevOrgIdRef = React.useRef<number | null>(null)

  // Sync state when props change (user login/logout/switch org)
  React.useEffect(() => {
    setSchedules(initialSchedules)
  }, [initialSchedules])

  React.useEffect(() => {
    if (initialMembers.length === 0) return
    setMembers(initialMembers)
    setMembersFetched(true)
  }, [initialMembers])

  React.useEffect(() => {
    if (initialWorkSchedules.length === 0) return
    setWorkSchedules(initialWorkSchedules)
    setWorkSchedulesFetched(true)
  }, [initialWorkSchedules])

  React.useEffect(() => {
    if (!initialActiveMemberIds || initialActiveMemberIds.length === 0) return
    setActiveMemberIds(initialActiveMemberIds)
    setActiveIdsFetched(true)
  }, [initialActiveMemberIds])

  React.useEffect(() => {
    if (!isReady) return
    if (organizationId === null) return

    const prev = prevOrgIdRef.current
    if (prev !== null && prev === organizationId) return

    prevOrgIdRef.current = organizationId
    setMembers([])
    setWorkSchedules([])
    setActiveMemberIds([])
    setMembersFetched(false)
    setWorkSchedulesFetched(false)
    setActiveIdsFetched(false)
  }, [isReady, organizationId])

  React.useEffect(() => {
    if (!isReady) return
    if (organizationId === null) return
    if (lookupsInFlightRef.current) return

    const shouldFetchMembers = !membersFetched
    const shouldFetchWorkSchedules = !workSchedulesFetched
    const shouldFetchActiveIds = !activeIdsFetched
    if (!shouldFetchMembers && !shouldFetchWorkSchedules && !shouldFetchActiveIds) return

    const fetchLookups = async () => {
      try {
        lookupsInFlightRef.current = true
        setLookupsLoading(true)
        const [membersRes, workSchedulesRes, activeIdsRes] = await Promise.all([
          shouldFetchMembers ? getAllOrganization_member(organizationId) : Promise.resolve(null),
          shouldFetchWorkSchedules ? getAllWorkSchedules(organizationId) : Promise.resolve(null),
          shouldFetchActiveIds ? getActiveMemberScheduleMemberIds(organizationId) : Promise.resolve(null),
        ])

        if (membersRes && (membersRes as any)?.success && Array.isArray((membersRes as any).data)) {
          setMembers((membersRes as any).data as IOrganization_member[])
        }
        if (shouldFetchMembers) setMembersFetched(true)

        if (workSchedulesRes && (workSchedulesRes as any)?.success && Array.isArray((workSchedulesRes as any).data)) {
          setWorkSchedules((workSchedulesRes as any).data as IWorkSchedule[])
        }
        if (shouldFetchWorkSchedules) setWorkSchedulesFetched(true)

        if (activeIdsRes && (activeIdsRes as any)?.success && Array.isArray((activeIdsRes as any).data)) {
          setActiveMemberIds((activeIdsRes as any).data as string[])
        }
        if (shouldFetchActiveIds) setActiveIdsFetched(true)
      } catch {
        if (shouldFetchMembers) setMembersFetched(true)
        if (shouldFetchWorkSchedules) setWorkSchedulesFetched(true)
        if (shouldFetchActiveIds) setActiveIdsFetched(true)
        // ignore; dialog can still render with limited options
      } finally {
        setLookupsLoading(false)
        lookupsInFlightRef.current = false
      }
    }

    fetchLookups()
  }, [isReady, organizationId, membersFetched, workSchedulesFetched, activeIdsFetched])

  const membersWithActiveSchedule = React.useMemo(() => {
    return new Set<string>((activeMemberIds || []).map((id) => String(id)))
  }, [activeMemberIds])

  const getMemberDisplayName = React.useCallback((member: IOrganization_member) => {
    const user = member.user as
      | { first_name?: string; middle_name?: string; last_name?: string; email?: string }
      | undefined
    const name = user
      ? [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") || user.email
      : "Unknown"
    return name || "Unknown"
  }, [])

  const membersSorted = React.useMemo(() => {
    return [...members].sort((a, b) => {
      const nameA = getMemberDisplayName(a).toLowerCase()
      const nameB = getMemberDisplayName(b).toLowerCase()
      return nameA.localeCompare(nameB, "id")
    })
  }, [members, getMemberDisplayName])

  const form = useForm<MemberScheduleForm>({
    resolver: zodResolver(memberScheduleSchema),
    defaultValues: {
      organization_member_id: "",
      work_schedule_id: "",
      shift_id: "",
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true,
    },
    mode: "onChange",
  })

  const onSubmit = async (values: MemberScheduleForm) => {
    const payload = {
      organization_member_id: values.organization_member_id,
      work_schedule_id: values.work_schedule_id,
      effective_date: values.effective_date,
      is_active: values.is_active,
      ...(values.shift_id && values.shift_id.trim() !== "" ? { shift_id: values.shift_id } : {}),
    }

    try {
      if (editingSchedule) {
        const result = await updateMemberSchedule(editingSchedule.id, payload)
        if (result.success) {
          toast.success("Schedule updated successfully")
          // Optimistic update
          setSchedules((prev) =>
            prev.map((s) => (s.id === editingSchedule.id ? { ...s, ...payload } : s))
          )
          setActiveIdsFetched(false)
          onRefresh?.()
        } else {
          toast.error(result.message)
        }
      } else {
        const result = await createMemberSchedule(payload)
        if (result.success && result.data) {
          toast.success("Schedule assigned successfully")
          // Optimistic update
          setSchedules((prev) => [result.data as IMemberSchedule, ...prev])
          setActiveIdsFetched(false)
          onRefresh?.()
        } else {
          toast.error(result.message)
        }
      }
      handleCloseDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const resetForCreate = () => {
    setEditingSchedule(null)
    setMemberQuery("")
    setMemberPopoverOpen(false)
    form.reset({
      organization_member_id: "",
      work_schedule_id: "",
      shift_id: "",
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true,
    })
  }

  const handleEdit = (schedule: IMemberSchedule) => {
    setEditingSchedule(schedule)
    form.reset({
      organization_member_id: String(schedule.organization_member_id),
      work_schedule_id: String(schedule.work_schedule_id),
      shift_id: schedule.shift_id || "",
      effective_date: schedule.effective_date,
      is_active: schedule.is_active,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteMemberSchedule(id)
      if (result.success) {
        toast.success("Schedule deleted successfully")
        // Optimistic update
        setSchedules((prev) => prev.filter((s) => s.id !== id))
        setActiveIdsFetched(false)
        onRefresh?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setMemberQuery("")
    setMemberPopoverOpen(false)
    form.reset({
      organization_member_id: "",
      work_schedule_id: "",
      shift_id: "",
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true,
    })
    setEditingSchedule(null)
  }

  const getMemberName = (schedule: IMemberSchedule) => {
    const member = schedule.organization_member as { user?: { first_name?: string; middle_name?: string; last_name?: string; email?: string } }
    if (!member?.user) return "Unknown Member"
    const { first_name, middle_name, last_name, email } = member.user
    const parts = [first_name, middle_name, last_name].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : email || "Unknown"
  }

  const getScheduleName = (schedule: IMemberSchedule) => {
    const workSchedule = schedule.work_schedule as { name?: string }
    return workSchedule?.name || "Unknown Schedule"
  }

  const columns: ColumnDef<IMemberSchedule>[] = [
    {
      header: "Member",
      accessorFn: (row) => getMemberName(row),
      cell: ({ row }) => {
        const schedule = row.original
        const member = schedule.organization_member as any
        const user = member?.user
        const name = getMemberName(schedule)
        const memberId = String(schedule.organization_member_id || member?.id || "")

        return (
          <div className="flex gap-3 items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.profile_photo_url} alt={name} />
              <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!memberId) return
                  router.push(`/members/${memberId}`)
                }}
                disabled={!memberId}
                className="text-left text-sm font-medium leading-none hover:underline disabled:no-underline disabled:cursor-default"
              >
                {name}
              </button>
            </div>
          </div>
        )
      },
    },
    {
      header: "Work Schedule",
      accessorFn: (row) => getScheduleName(row),
      cell: ({ row }) => getScheduleName(row.original),
    },
    {
      header: "Effective Date",
      accessorKey: "effective_date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("effective_date"))
        return date.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      },
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean
        return (
          <Badge variant={active ? "default" : "secondary"} className={active ? "bg-green-500 hover:bg-green-600" : ""}>
            {active ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const schedule = row.original
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEdit(schedule)}
              className="h-9 w-9 cursor-pointer bg-secondary border-0 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-red-500 cursor-pointer bg-secondary border-0 p-0"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Schedule Assignment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this schedule assignment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(schedule.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full h-full">
      <DataTable
        columns={columns}
        data={schedules}
        isLoading={isLoading}
        showGlobalFilter={true}
        showFilters={true}
        showColumnToggle={false}
        layout="card"
        globalFilterPlaceholder="Search member schedules..."
        manualPagination={typeof pageIndex === "number" && typeof pageSize === "number"}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageIndexChange={onPageIndexChange}
        onPageSizeChange={onPageSizeChange}
        toolbarRight={
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                handleCloseDialog()
                return
              }

              resetForCreate()
              setOpen(true)
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForCreate()
                  setOpen(true)
                }}
                className="gap-2 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Assign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? "Edit Schedule" : "Assign Schedule"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="organization_member_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member</FormLabel>
                        <FormControl>
                          <Popover
                            open={memberPopoverOpen}
                            onOpenChange={(next) => {
                              setMemberPopoverOpen(next)
                              if (next) setMemberQuery("")
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={memberPopoverOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                                type="button"
                              >
                                {field.value
                                  ? getMemberDisplayName(
                                      members.find((m) => String(m.id) === String(field.value)) ||
                                        ({ id: field.value, user: undefined } as any)
                                    )
                                  : "Select member..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[--radix-popover-trigger-width] p-0"
                              align="start"
                            >
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Search member..."
                                  value={memberQuery}
                                  onValueChange={setMemberQuery}
                                />
                                <CommandList className="max-h-[220px] overflow-y-auto">
                                  {(() => {
                                    const q = memberQuery.trim().toLowerCase()
                                    const filtered = q.length === 0
                                      ? membersSorted
                                      : membersSorted.filter((member) => {
                                          const name = getMemberDisplayName(member)
                                          const nameLower = name.toLowerCase()
                                          const user = member.user as { email?: string } | undefined
                                          const emailLower = (user?.email ?? "").toLowerCase()

                                          if (nameLower.includes(q)) return true
                                          if (emailLower.includes(q)) return true
                                          return false
                                        })

                                    if (lookupsLoading && members.length === 0) {
                                      return (
                                        <CommandGroup>
                                          <CommandItem value="loading" disabled>
                                            Loading...
                                          </CommandItem>
                                        </CommandGroup>
                                      )
                                    }

                                    if (!lookupsLoading && filtered.length === 0) {
                                      return <CommandEmpty>No results.</CommandEmpty>
                                    }

                                    return (
                                      <CommandGroup>
                                        {filtered.map((member) => {
                                          const name = getMemberDisplayName(member)
                                          const hasActiveSchedule = membersWithActiveSchedule.has(String(member.id))
                                          const isSelected = String(field.value) === String(member.id)

                                          return (
                                            <CommandItem
                                              key={member.id}
                                              value={name}
                                              disabled={hasActiveSchedule}
                                              onSelect={() => {
                                                field.onChange(String(member.id))
                                                setMemberPopoverOpen(false)
                                                setMemberQuery("")
                                              }}
                                            >
                                              <Check
                                                className={
                                                  isSelected
                                                    ? "mr-2 h-4 w-4 opacity-100"
                                                    : "mr-2 h-4 w-4 opacity-0"
                                                }
                                              />
                                              <span className="truncate">
                                                {name} {hasActiveSchedule ? "(Has active schedule)" : ""}
                                              </span>
                                            </CommandItem>
                                          )
                                        })}
                                      </CommandGroup>
                                    )
                                  })()}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="work_schedule_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Schedule</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select work schedule" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workSchedules.map((schedule) => (
                              <SelectItem key={schedule.id} value={String(schedule.id)}>
                                {schedule.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="effective_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={lookupsLoading}>
                      {editingSchedule ? "Update" : "Assign"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
        emptyState={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Calendar className="h-14 w-14 text-muted-foreground mx-auto" />
              </EmptyMedia>
              <EmptyTitle>No member schedules</EmptyTitle>
              <EmptyDescription>
                Get started by assigning a work schedule to a member.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => {
                  resetForCreate()
                  setOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Assign
              </Button>
            </EmptyContent>
          </Empty>
        }
      />
    </div>
  )
}
