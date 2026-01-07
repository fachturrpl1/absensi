"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, ChevronRight, Plus, Calendar } from "lucide-react"
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
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { toast } from "sonner"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IWorkSchedule } from "@/interface"
import {
  createWorkSchedule,
  deleteWorkSchedule,
  updateWorkSchedule,
} from "@/action/schedule"
import { SCHEDULE_TYPES } from "@/constants/attendance-status"

const scheduleSchema = z.object({
  organization_id: z.string().min(1, "Organization is required"),
  code: z.string().min(2, "min 2 characters"),
  name: z.string().min(2, "min 2 characters"),
  description: z.string().optional(),
  schedule_type: z.string().optional(),
  is_active: z.boolean(),
})

type ScheduleForm = z.infer<typeof scheduleSchema>

interface ScheduleClientProps {
  initialSchedules: IWorkSchedule[]
  organizationId: string
  organizationName: string
}

export default function ScheduleClient({
  initialSchedules,
  organizationId,
  organizationName,
}: ScheduleClientProps) {
  const [schedules, setSchedules] = React.useState(initialSchedules)
  const [open, setOpen] = React.useState(false)
  const [editingDetail, setEditingDetail] = React.useState<IWorkSchedule | null>(null)

  // Sync state when initialSchedules changes
  React.useEffect(() => {
    setSchedules(initialSchedules)
  }, [initialSchedules, organizationId])

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      organization_id: organizationId,
      code: "",
      name: "",
      description: "",
      schedule_type: "",
      is_active: true,
    },
  })

  const handleSubmit = async (values: ScheduleForm) => {


    try {
      let res: { success: boolean; message?: string; data?: any }

      if (editingDetail) {

        res = await updateWorkSchedule(editingDetail.id, values as Partial<IWorkSchedule>)


        if (res.success && res.data) {
          toast.success(res.message || "Schedule updated successfully")
          // Optimistic update with correct data
          setSchedules((prev) =>
            prev.map((s) => (s.id === editingDetail.id ? { ...s, ...res.data } : s))
          )
        } else {
          throw new Error(res.message || "Failed to update schedule")
        }
      } else {

        res = await createWorkSchedule(values as Partial<IWorkSchedule>)


        if (res.success && res.data) {
          toast.success("Schedule created successfully")
          // Optimistic update
          setSchedules((prev) => [res.data as IWorkSchedule, ...prev])
        } else {
          throw new Error(res.message || "Failed to create schedule")
        }
      }


      handleCloseDialog()

    } catch (err: unknown) {
      // console.error('❌ Schedule operation error:', err);
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setEditingDetail(null)
    form.reset({
      organization_id: organizationId,
      code: "",
      name: "",
      description: "",
      schedule_type: "",
      is_active: true,
    })
  }

  const handleOpenDialog = (schedule?: IWorkSchedule) => {


    if (schedule) {
      setEditingDetail(schedule)
      const formValues = {
        organization_id: String(schedule.organization_id || organizationId),
        code: schedule.code || "",
        name: schedule.name || "",
        description: schedule.description || "",
        schedule_type: schedule.schedule_type || "",
        is_active: schedule.is_active ?? true,
      }

      form.reset(formValues)
    } else {
      setEditingDetail(null)
      const formValues = {
        organization_id: organizationId,
        code: "",
        name: "",
        description: "",
        schedule_type: "",
        is_active: true,
      }

      form.reset(formValues)
    }
    setOpen(true)
  }

  const handleDelete = async (scheduleId: string | number) => {
    try {
      const response = await deleteWorkSchedule(scheduleId)
      if (response.success) {
        toast.success("Schedule deleted successfully")
        // Optimistic update
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
      } else {
        throw new Error(response.message)
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unknown error")
    }
  }

  const columns: ColumnDef<IWorkSchedule>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "schedule_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("schedule_type") as string
        return (
          <div className="capitalize font-medium">{type?.replace("_", " ")}</div>
        )
      }
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500 hover:bg-green-600" : ""}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const ws = row.original
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-pointer bg-secondary border-0 p-0"
              onClick={() => handleOpenDialog(ws)}
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
                  <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this schedule?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(ws.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link href={`/schedule/detail/${ws.id}`}>
              <Button variant="outline" size="icon" className="h-9 w-9 cursor-pointer bg-secondary border-0 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full h-full">
      <Card className="h-full border-0 shadow-none">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={schedules}
            showGlobalFilter={true}
            showFilters={true}
            showColumnToggle={false}
            layout="card"
            globalFilterPlaceholder="Search schedules..."
            toolbarRight={
              <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    handleCloseDialog()
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()} className="gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDetail ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="organization_id"
                        render={({ field }) => <input type="hidden" {...field} />}
                      />
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {organizationName || "(Organization name not loaded)"}
                        </div>
                      </FormItem>

                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input type="text" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input type="text" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input type="text" {...field ?? ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="schedule_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select schedule type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SCHEDULE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Active</FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        {editingDetail ? "Update" : "Create"}
                      </Button>
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
                  <EmptyTitle>No schedules yet</EmptyTitle>
                  <EmptyDescription>
                    There are no schedules for this organization. Use the "Add Schedule" button to
                    create one.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </EmptyContent>
              </Empty>
            }
          />
        </CardContent>
      </Card>
    </div >
  )
}
