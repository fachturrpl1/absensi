"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { DataTable } from "@/components/data-table"
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
import { Plus, Trash } from "lucide-react"

import type { IShiftAssignment } from "@/interface"
import {
  createShiftAssignment,
  deleteShiftAssignment,
  ShiftAssignmentMemberOption,
  ShiftOption,
} from "@/action/shift-assignments"

const assignmentSchema = z.object({
  organization_member_id: z.string().min(1, "Member is required"),
  shift_id: z.string().min(1, "Shift is required"),
  assignment_date: z.string().min(1, "Date is required"),
})

type AssignmentForm = z.infer<typeof assignmentSchema>

interface ShiftAssignmentClientProps {
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

export default function ShiftAssignmentClient({
  initialAssignments,
  members,
  shifts,
  isLoading = false,
  pageIndex,
  pageSize,
  totalRecords,
  onPageIndexChange,
  onPageSizeChange,
  onRefresh,
}: ShiftAssignmentClientProps) {
  const [assignments, setAssignments] = React.useState<IShiftAssignment[]>(initialAssignments)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setAssignments(initialAssignments)
  }, [initialAssignments])

  const form = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      organization_member_id: "",
      shift_id: "",
      assignment_date: new Date().toISOString().slice(0, 10),
    },
  })

  const closeDialog = () => {
    setOpen(false)
    form.reset({
      organization_member_id: "",
      shift_id: "",
      assignment_date: new Date().toISOString().slice(0, 10),
    })
  }

  const handleSubmit = async (values: AssignmentForm) => {
    try {
      const res = await createShiftAssignment(values)
      if (!res.success || !res.data) throw new Error(res.message || "Failed to assign")

      toast.success(res.message || "Shift assigned")
      setAssignments((prev) => [res.data as IShiftAssignment, ...prev])
      onRefresh?.()
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const columns: ColumnDef<IShiftAssignment>[] = [
    {
      id: "member",
      header: "Member",
      cell: ({ row }) => {
        const a: any = row.original
        const m = a.organization_member
        const u = m?.user
        const fullName = [u?.first_name, u?.middle_name, u?.last_name]
          .filter((p: any) => p && String(p).trim() !== "")
          .join(" ")
        return <div className="font-medium">{fullName || u?.display_name || u?.email || m?.employee_id || "-"}</div>
      },
    },
    {
      id: "shift",
      header: "Shift",
      cell: ({ row }) => {
        const a: any = row.original
        const s = a.shift
        const time = s?.start_time && s?.end_time ? ` ${String(s.start_time).slice(0, 5)}-${String(s.end_time).slice(0, 5)}` : ""
        return <div className="font-medium">{s?.name || s?.code || "-"}{time}</div>
      },
    },
    {
      accessorKey: "assignment_date",
      header: "Date",
      cell: ({ row }) => {
        const v = row.getValue("assignment_date") as string
        return <div className="tabular-nums">{v}</div>
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const a = row.original
        return (
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
                <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this assignment?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(a.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
            data={assignments}
            isLoading={isLoading}
            showGlobalFilter={true}
            showFilters={true}
            showColumnToggle={false}
            layout="card"
            globalFilterPlaceholder="Search assignments..."
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
                  if (!isOpen) closeDialog()
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setOpen(true)} className="gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Shift</DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="organization_member_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Member</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {members.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {toMemberLabel(m)}
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
                        name="shift_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shift</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
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

                      <FormField
                        control={form.control}
                        name="assignment_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assignment Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDialog}>
                          Cancel
                        </Button>
                        <Button type="submit">Assign</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
