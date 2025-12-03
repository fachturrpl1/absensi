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
    console.log('🚀 handleSubmit called with:', values);
    console.log('📝 editingDetail:', editingDetail);
    
    try {
      let res: { success: boolean; message?: string; data?: any }
      
      if (editingDetail) {
        console.log('🔄 Updating schedule:', { id: editingDetail.id, values });
        res = await updateWorkSchedule(editingDetail.id, values as Partial<IWorkSchedule>)
        console.log('📥 Update response:', res);
        
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
        console.log('➕ Creating schedule:', values);
        res = await createWorkSchedule(values as Partial<IWorkSchedule>)
        console.log('📥 Create response:', res);
        
        if (res.success && res.data) {
          toast.success("Schedule created successfully")
          // Optimistic update
          setSchedules((prev) => [res.data as IWorkSchedule, ...prev])
        } else {
          throw new Error(res.message || "Failed to create schedule")
        }
      }
      
      console.log('✅ Operation completed successfully');
      handleCloseDialog()
      
    } catch (err: unknown) {
      console.error('❌ Schedule operation error:', err);
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
    console.log('🔓 Opening dialog:', { schedule, organizationId });
    
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
      console.log('📝 Form reset with edit values:', formValues);
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
      console.log('📝 Form reset with new values:', formValues);
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
    { accessorKey: "schedule_type", header: "Type" },
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
              className="border-0 cursor-pointer"
              onClick={() => handleOpenDialog(ws)}
            >
              <Pencil />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 border-0 cursor-pointer"
                >
                  <Trash />
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
              <Button variant="outline" className="border-0 cursor-pointer">
                <ChevronRight />
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="items-center my-7">
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              handleCloseDialog()
            }
          }}
        >
          <DialogTrigger asChild className="float-end ml-5">
            <Button onClick={() => handleOpenDialog()}>
              Add  <Plus className="ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDetail ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  console.log('📤 Form submit event triggered');
                  e.preventDefault();
                  form.handleSubmit((values) => {
                    console.log('✅ Form validation passed');
                    handleSubmit(values);
                  }, (errors) => {
                    console.error('❌ Form validation errors:', errors);
                  })(e);
                }} 
                className="space-y-4"
              >
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
                <Button 
                  type="submit" 
                  className="w-full"
                  onClick={() => {
                    console.log('🖱️ Button clicked');
                    console.log('📋 Current form values:', form.getValues());
                    console.log('⚠️ Form errors:', form.formState.errors);
                  }}
                >
                  {editingDetail ? "Update" : "Create"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {schedules.length === 0 ? (
        <div className="mt-20">
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
              <Button onClick={() => setOpen(true)}>Add Schedule</Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <DataTable columns={columns} data={schedules} />
      )}
    </div>
  )
}
