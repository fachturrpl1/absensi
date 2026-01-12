"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Plus, Trash, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
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
import { Checkbox } from "@/components/ui/checkbox"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
} from "@tanstack/react-table"

import { IWorkScheduleDetail } from "@/interface"
import {
  getWorkScheduleDetails,
  createWorkScheduleDetail,
  updateWorkScheduleDetail,
  deleteWorkScheduleDetail,
} from "@/action/schedule"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CalendarDays, TrendingUp } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatTime } from "@/utils/format-time"
import { useTimeFormat } from "@/store/time-format-store"

const timeStringToMinutes = (value?: string) => {
  if (!value) return null
  const [hh, mm] = value.split(":")
  const hours = Number(hh)
  const minutes = Number(mm)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const detailSchema = z
  .object({
    day_of_week: z.number().min(0).max(6),
    is_working_day: z.boolean(),
    flexible_hours: z.boolean(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    break_start: z.string().optional(),
    break_end: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.is_working_day) return

    const startMin = timeStringToMinutes(values.start_time)
    const endMin = timeStringToMinutes(values.end_time)
    const breakStartMin = timeStringToMinutes(values.break_start)
    const breakEndMin = timeStringToMinutes(values.break_end)

    if (startMin == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time is required",
        path: ["start_time"],
      })
    }

    if (endMin == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time is required",
        path: ["end_time"],
      })
    }

    if (startMin != null && endMin != null && endMin <= startMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be later than start time",
        path: ["end_time"],
      })
    }

    const hasBreakStart = breakStartMin != null
    const hasBreakEnd = breakEndMin != null

    if (hasBreakStart !== hasBreakEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Break start and break end must both be filled",
        path: [hasBreakStart ? "break_end" : "break_start"],
      })
      return
    }

    if (!hasBreakStart || !hasBreakEnd) return

    if (breakEndMin! <= breakStartMin!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Break end must be later than break start",
        path: ["break_end"],
      })
    }

    if (startMin != null && breakStartMin! <= startMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Break start must be after start time",
        path: ["break_start"],
      })
    }

    if (endMin != null && breakEndMin! >= endMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Break end must be before end time",
        path: ["break_end"],
      })
    }
  })

type DetailForm = z.infer<typeof detailSchema>

const dayNames = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

const calculateWorkingHours = (start?: string, end?: string, breakStart?: string, breakEnd?: string) => {
  if (!start || !end) return "-"

  const startTime = new Date(`2000-01-01T${start}`)
  const endTime = new Date(`2000-01-01T${end}`)
  let totalMinutes = (endTime.getTime() - startTime.getTime()) / 1000 / 60

  if (breakStart && breakEnd) {
    const breakStartTime = new Date(`2000-01-01T${breakStart}`)
    const breakEndTime = new Date(`2000-01-01T${breakEnd}`)
    const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / 1000 / 60
    totalMinutes -= breakMinutes
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

// Custom DataTable with Back button in pagination
function DataTableWithBack<TData, TValue>({
  columns,
  data,
  filterColumn,
  isLoading = false,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: keyof TData
  isLoading?: boolean
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-4">
        {filterColumn && (
          <Input
            placeholder={`Filter ${String(filterColumn)}...`}
            value={
              (table.getColumn(String(filterColumn))?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(String(filterColumn))?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? "Loading..." : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage() || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage() || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default function WorkScheduleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = Number(params.id)
  const { format: timeFormat } = useTimeFormat()

  const [details, setDetails] = React.useState<IWorkScheduleDetail[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [open, setOpen] = React.useState(false)
  const [editingDetail, setEditingDetail] = React.useState<IWorkScheduleDetail | null>(null)

  // Format time range with organization's time format
  const formatTimeRange = (start?: string, end?: string) => {
    if (!start || !end) return "-"
    return `${formatTime(start, timeFormat)} - ${formatTime(end, timeFormat)}`
  }

  const fetchDetails = async () => {
    setLoading(true)
    const res: unknown = await getWorkScheduleDetails(scheduleId)
    const typedRes = res as { success: boolean; data: IWorkScheduleDetail[]; message: string }
    if (typedRes.success) {
      setDetails(typedRes.data)
    } else {
      toast.error(typedRes.message)
    }
    setLoading(false)
  }

  React.useEffect(() => {
    fetchDetails()
  }, [scheduleId])

  const form = useForm<DetailForm>({
    resolver: zodResolver(detailSchema),
    defaultValues: {
      day_of_week: 1,
      is_working_day: true,
      flexible_hours: false,
      start_time: undefined,
      end_time: undefined,
      break_start: undefined,
      break_end: undefined,
    },
  })

  const handleSubmit = async (values: DetailForm) => {
    if (isSubmitting) return
    form.clearErrors(["start_time", "end_time", "break_start", "break_end"])

    const dayExists = details.some((d) => {
      if (editingDetail && String(d.id) === String(editingDetail.id)) return false
      return Number(d.day_of_week) === Number(values.day_of_week)
    })

    if (dayExists) {
      const dayLabel = dayNames[values.day_of_week]
      form.setError("day_of_week", { message: `Jadwal untuk ${dayLabel} sudah ada. Silakan edit.` })
      toast.warning(`Jadwal untuk ${dayLabel} sudah ada. Silakan edit jadwal yang sudah dibuat.`)
      return
    }

    if (values.is_working_day) {
      const startMin = timeStringToMinutes(values.start_time)
      const endMin = timeStringToMinutes(values.end_time)
      const breakStartMin = timeStringToMinutes(values.break_start)
      const breakEndMin = timeStringToMinutes(values.break_end)

      let hasError = false

      if (startMin == null) {
        form.setError("start_time", { message: "Start time is required" })
        hasError = true
      }

      if (endMin == null) {
        form.setError("end_time", { message: "End time is required" })
        hasError = true
      }

      if (startMin != null && endMin != null && endMin <= startMin) {
        form.setError("end_time", { message: "End time must be later than start time" })
        hasError = true
      }

      const hasBreakStart = breakStartMin != null
      const hasBreakEnd = breakEndMin != null

      if (hasBreakStart !== hasBreakEnd) {
        form.setError(hasBreakStart ? "break_end" : "break_start", {
          message: "Break start and break end must both be filled",
        })
        hasError = true
      }

      if (hasBreakStart && hasBreakEnd) {
        if (breakEndMin! <= breakStartMin!) {
          form.setError("break_end", { message: "Break end must be later than break start" })
          hasError = true
        }

        if (startMin != null && breakStartMin! <= startMin) {
          form.setError("break_start", { message: "Break start must be after start time" })
          hasError = true
        }

        if (endMin != null && breakEndMin! >= endMin) {
          form.setError("break_end", { message: "Break end must be before end time" })
          hasError = true
        }
      }

      if (hasError) return
    }

    setIsSubmitting(true)
    try {
      let res
      if (editingDetail) {
        res = await updateWorkScheduleDetail(editingDetail.id, values)
      } else {
        res = await createWorkScheduleDetail({ ...values, work_schedule_id: scheduleId })
      }

      if (!res?.success) {
        const raw = String(res?.message || "")
        const lower = raw.toLowerCase()

        const isUniqueDay = lower.includes("work_schedule_details_work_schedule_id_day_of_week_key")

        if (isUniqueDay) {
          const dayLabel = dayNames[values.day_of_week]
          toast.warning(`Jadwal untuk ${dayLabel} sudah ada. Silakan edit jadwal yang sudah dibuat.`)
        } else {
          const isValidation =
            lower.includes("duplicate") ||
            lower.includes("already") ||
            lower.includes("exists") ||
            lower.includes("unique") ||
            lower.includes("validation")
          if (isValidation) toast.warning(raw || "Data tidak valid")
          else toast.error(raw || "Gagal menyimpan jadwal")
        }

        return
      }

      toast.success(editingDetail ? "Updated successfully" : "Created successfully")
      handleCloseDialog()
      fetchDetails()
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Unknown error"
      toast.error(raw)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setEditingDetail(null)
    form.reset({
      day_of_week: 1,
      is_working_day: true,
      flexible_hours: false,
      start_time: undefined,
      end_time: undefined,
      break_start: undefined,
      break_end: undefined,
    })
  }

  const handleOpenDialog = (detail?: IWorkScheduleDetail) => {
    if (detail) {
      setEditingDetail(detail)
      form.reset(detail)
    } else {
      setEditingDetail(null)
      form.reset({
        day_of_week: 1,
        is_working_day: true,
        flexible_hours: false,
        start_time: undefined,
        end_time: undefined,
        break_start: undefined,
        break_end: undefined,
      })
    }
    setOpen(true)
  }

  const handleDelete = async (detailId: string) => {
    try {
      setLoading(true);
      const response = await deleteWorkScheduleDetail(detailId);
      if (!response.success) throw new Error(response.message);

      toast.success("Schedule detail deleted successfully");
      fetchDetails(); // refresh list
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete schedule detail");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back()
  }

  // Calculate summary statistics
  const calculateSummary = () => {
    const workingDays = details.filter(d => d.is_working_day)
    const totalWorkingDays = workingDays.length

    let totalMinutes = 0
    workingDays.forEach(day => {
      if (day.start_time && day.end_time) {
        const start = new Date(`2000-01-01T${day.start_time}`)
        const end = new Date(`2000-01-01T${day.end_time}`)
        let minutes = (end.getTime() - start.getTime()) / 1000 / 60

        if (day.break_start && day.break_end) {
          const breakStart = new Date(`2000-01-01T${day.break_start}`)
          const breakEnd = new Date(`2000-01-01T${day.break_end}`)
          minutes -= (breakEnd.getTime() - breakStart.getTime()) / 1000 / 60
        }
        totalMinutes += minutes
      }
    })

    const totalHours = Math.floor(totalMinutes / 60)
    const avgHoursPerDay = totalWorkingDays > 0 ? (totalMinutes / 60 / totalWorkingDays).toFixed(1) : "0"

    return {
      totalWorkingDays,
      totalHours,
      avgHoursPerDay
    }
  }

  const summary = calculateSummary()

  const columns: ColumnDef<IWorkScheduleDetail>[] = [
    {
      accessorKey: "day_of_week",
      header: "Day",
      cell: ({ row }) => {
        const dayNum = row.getValue("day_of_week") as number
        const isWorking = row.original.is_working_day
        const isFlexible = row.original.flexible_hours
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{dayNames[dayNum]}</span>
            {isWorking ? (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                Working
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs rounded-full">
                Off
              </span>
            )}
            {isFlexible && isWorking && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">
                Flexible
              </span>
            )}
          </div>
        )
      }
    },
    {
      id: "work_hours",
      header: "Work Hours",
      cell: ({ row }) => {
        const start = row.original.start_time
        const end = row.original.end_time
        const isWorking = row.original.is_working_day
        const isFlexible = row.original.flexible_hours

        if (!isWorking) {
          return (
            <span className="text-sm text-muted-foreground italic">
              Off Day
            </span>
          )
        }

        return (
          <div className="flex flex-col">
            <span className="font-mono text-sm font-medium">
              {formatTimeRange(start, end)}
            </span>
            {isFlexible && (
              <span className="text-xs text-muted-foreground italic">
                Adjustable hours
              </span>
            )}
          </div>
        )
      }
    },
    {
      id: "break_time",
      header: "Break Time",
      cell: ({ row }) => {
        const breakStart = row.original.break_start
        const breakEnd = row.original.break_end
        const isWorking = row.original.is_working_day

        if (!isWorking) {
          return <span className="text-xs text-muted-foreground">-</span>
        }

        const range = formatTimeRange(breakStart, breakEnd)
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {range}
          </span>
        )
      }
    },
    {
      id: "total_hours",
      header: "Total Hours",
      cell: ({ row }) => {
        const isWorking = row.original.is_working_day

        if (!isWorking) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        const hours = calculateWorkingHours(
          row.original.start_time,
          row.original.end_time,
          row.original.break_start,
          row.original.break_end
        )

        return (
          <span className="font-bold text-sm">{hours}</span>
        )
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const d = row.original
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleOpenDialog(d)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Schedule Detail</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this schedule detail?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await handleDelete(d.id)
                    }}
                  >
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
    <div className="flex flex-1 flex-col gap-4">
      <div className="w-full max-w-6xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={handleGoBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                handleCloseDialog()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDetail ? "Edit Detail" : "Add Detail"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="day_of_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dayNames.map((day, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {day}
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
                    name="is_working_day"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Working Day</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="flexible_hours"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Flexible Hours</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Allow adjustable work hours for this day
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="break_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Break Start</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="break_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Break End</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : (editingDetail ? "Update" : "Create")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        {!loading && details.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Working Days
                </CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalWorkingDays}</div>
                <p className="text-xs text-muted-foreground">
                  per week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Hours
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalHours}h</div>
                <p className="text-xs text-muted-foreground">
                  per week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Hours
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avgHoursPerDay}h</div>
                <p className="text-xs text-muted-foreground">
                  per working day
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={10} columns={7} />
        ) : (
          <DataTableWithBack
            columns={columns}
            data={details}
            filterColumn="day_of_week"
          />
        )}
      </div>
    </div>
  )
}