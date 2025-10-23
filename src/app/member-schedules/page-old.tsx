"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus, Calendar } from "lucide-react"
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

import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IMemberSchedule } from "@/interface"
import { useMembers } from "@/hooks/use-members"
import { useWorkSchedules } from "@/hooks/use-work-schedules"
import { 
  useMemberSchedules,
  useCreateMemberSchedule,
  useDeleteMemberSchedule,
  useUpdateMemberSchedule
} from "@/hooks/use-member-schedules"
import LoadingSkeleton from "@/components/loading-skeleton"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { createClient } from "@/utils/supabase/client"

const memberScheduleSchema = z.object({
  organization_member_id: z.string().min(1, "Member is required"),
  work_schedule_id: z.string().min(1, "Work schedule is required"),
  shift_id: z.string().optional(),
  effective_date: z.string().min(1, "Effective date is required"),
  is_active: z.boolean(),
})

type MemberScheduleForm = z.infer<typeof memberScheduleSchema>

export default function MemberSchedulesPage() {
  const [open, setOpen] = React.useState(false)
  const [editingSchedule, setEditingSchedule] = React.useState<IMemberSchedule | null>(null)
  const [organizationId, setOrganizationId] = React.useState<string>("")

  const supabase = createClient()

  // Fetch organization ID once
  React.useEffect(() => {
    const fetchOrganizationId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)

        if (error) throw error
        if (data && data.length > 0) {
          setOrganizationId(String(data[0].organization_id))
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    fetchOrganizationId()
  }, [supabase])

  // Use React Query hooks - automatic caching & deduplication!
  const { data: schedules = [], isLoading: schedulesLoading } = useMemberSchedules(organizationId)
  const { data: members = [] } = useMembers()
  const { data: workSchedules = [] } = useWorkSchedules(organizationId)

  // Mutations
  const createMutation = useCreateMemberSchedule()
  const updateMutation = useUpdateMemberSchedule()
  const deleteMutation = useDeleteMemberSchedule()

  // Track members with active schedules (memoized)
  const membersWithActiveSchedule = React.useMemo(() => {
    const activeIds = new Set<string>()
    schedules.forEach((schedule) => {
      if (schedule.is_active) {
        activeIds.add(schedule.organization_member_id)
      }
    })
    return activeIds
  }, [schedules])

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

    if (editingSchedule) {
      await updateMutation.mutateAsync({ id: editingSchedule.id, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    
    handleCloseDialog()
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
    await deleteMutation.mutateAsync(id)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    form.reset({
      organization_member_id: "",
      work_schedule_id: "",
      shift_id: "",
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true,
    })
    setEditingSchedule(null)
  }

  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      handleCloseDialog()
    }
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
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          <Calendar className="w-4 h-4" />
          {getMemberName(row.original)}
        </div>
      ),
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
        return active ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-black">
            Inactive
          </span>
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
              className="cursor-pointer bg-secondary border-0 shadow-0 p-0 m-0"
            >
              <Pencil />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 cursor-pointer bg-secondary border-0 p-0 m-0"
                >
                  <Trash />
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
    <ContentLayout title="Member Schedules">
      <div className="w-full max-w-6xl mx-auto">
        <div className="items-center my-7">
          <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild className="float-end ml-5">
              <Button onClick={() => setEditingSchedule(null)}>
                Assign Schedule <Plus className="ml-2 h-4 w-4" />
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
                  {editingSchedule ? (
                    <div className="rounded-lg bg-secondary/50 px-4 py-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member</p>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary/20">
                          <AvatarImage 
                            src={
                              (editingSchedule.organization_member as { user?: { profile_photo_url?: string | null } })?.user?.profile_photo_url || undefined
                            } 
                            alt={getMemberName(editingSchedule)} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getMemberName(editingSchedule).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold text-foreground">
                            {getMemberName(editingSchedule)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(editingSchedule.organization_member as { user?: { email?: string } })?.user?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="organization_member_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Member</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select member" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {members.map((member) => {
                                const user = member.user as { first_name?: string; middle_name?: string; last_name?: string; email?: string } | undefined
                                const name = user
                                  ? [user.first_name, user.middle_name, user.last_name]
                                      .filter(Boolean)
                                      .join(" ") || user.email
                                  : "Unknown"
                                const hasActiveSchedule = membersWithActiveSchedule.has(String(member.id))
                                
                                return (
                                  <SelectItem 
                                    key={member.id} 
                                    value={String(member.id)}
                                    disabled={hasActiveSchedule}
                                  >
                                    {name} {hasActiveSchedule ? "(Has active schedule)" : ""}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {editingSchedule ? (
                    <div className="rounded-lg bg-secondary/50 px-4 py-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Effective Date</p>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(editingSchedule.effective_date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  ) : (
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
                  )}

                  <FormField
                    control={form.control}
                    name="work_schedule_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Schedule</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingSchedule ? "Update" : "Assign"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {schedulesLoading ? (
          <LoadingSkeleton />
        ) : schedules.length === 0 ? (
          <Empty>
            <EmptyMedia>
              <Calendar className="w-16 h-16 text-muted-foreground" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No member schedules</EmptyTitle>
              <EmptyDescription>
                Get started by assigning a work schedule to a member
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Schedule
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <DataTable columns={columns} data={schedules} />
        )}
      </div>
    </ContentLayout>
  )
}
