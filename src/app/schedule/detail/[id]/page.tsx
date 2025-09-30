"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Check, Pencil, Plus, Trash, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Columns3Cog } from "lucide-react"

import { IWorkScheduleDetail } from "@/interface"
import {
  getWorkScheduleDetails,
  createWorkScheduleDetail,
  updateWorkScheduleDetail,
  deleteWorkScheduleDetail,
} from "@/action/schedule"
import TopBar from "@/components/top-bar"
import LoadingSkeleton from "@/components/loading-skeleton"
import { ContentLayout } from "@/components/admin-panel/content-layout"

const detailSchema = z.object({
  day_of_week: z.coerce.number().min(0).max(6),
  is_working_day: z.boolean(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  break_start: z.string().optional(),
  break_end: z.string().optional(),
})

type DetailForm = z.infer<typeof detailSchema>

const dayNames = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

// Custom DataTable with Back button in pagination
function DataTableWithBack<TData, TValue>({
  columns,
  data,
  filterColumn,
  onBackClick,
  isLoading = false,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: keyof TData
  onBackClick: () => void
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
      <div className="flex justify-end items-center gap-4">
        {/* Filter */}
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

        {/* Toggle Columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Columns3Cog />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))
            }
          </DropdownMenuContent>
        </DropdownMenu>
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
          <TableBody>
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

      {/* Pagination with Back button */}
      <div className="flex items-center justify-between space-x-2 py-4">
        {/* Back button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        {/* Pagination */}
        <div className="flex items-center space-x-2">
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
    </div>
  )
}

export default function WorkScheduleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = Number(params.id)

  const [details, setDetails] = React.useState<IWorkScheduleDetail[]>([])
  const [loading, setLoading] = React.useState(true)

  const [open, setOpen] = React.useState(false)
  const [editingDetail, setEditingDetail] = React.useState<IWorkScheduleDetail | null>(null)

  const fetchDetails = async () => {
    setLoading(true)
    const res: unknown = await getWorkScheduleDetails(scheduleId)
    if (res.success) {
      setDetails(res.data)
    } else {
      toast.error(res.message)
    }
    setLoading(false)
  }

  React.useEffect(() => {
    fetchDetails()
  }, [scheduleId])

  const form = useForm<DetailForm>({
    resolver: zodResolver(detailSchema)as unknown,
    defaultValues: {
      day_of_week: 1,
      is_working_day: true,
      start_time: "",
      end_time: "",
      break_start: "",
      break_end: "",
    },
  })

  const handleSubmit = async (values: DetailForm) => {
    try {
      let res
      if (editingDetail) {
        res = await updateWorkScheduleDetail(editingDetail.id, values)
      } else {
        res = await createWorkScheduleDetail({ ...values, work_schedule_id: scheduleId })
      }
      if (!res.success) throw new Error(res.message)
      toast.success(editingDetail ? "Updated successfully" : "Created successfully")
      setOpen(false)
      setEditingDetail(null)
      fetchDetails()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleDelete = async (showId: string) => {
    try {
      setLoading(true);
      const response = await deleteWorkScheduleDetail(showId);
      if (!response.success) throw new Error(response.message);

      toast.success("Schedule detail deleted successfully");
      fetchDetails(); // refresh list
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unknown error' || "Failed to delete schedule detail");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back()
  }

  const columns: ColumnDef<IWorkScheduleDetail>[] = [
    { accessorKey: "day_of_week", header: "Day" },
    { accessorKey: "start_time", header: "Start" },
    { accessorKey: "end_time", header: "End" },
    { accessorKey: "break_start", header: "Break Start", cell: (info) => info.getValue() ?? "-" },
    { accessorKey: "break_end", header: "Break End", cell: (info) => info.getValue() ?? "-" },
    {
      accessorKey: "is_working_day",
      header: "Working Day",
      cell: ({ row }) => (row.getValue("is_working_day") ? <Check /> : "-"),
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
              onClick={() => {
                setEditingDetail(d)
                form.reset(d)
                setOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-red-500"
              onClick={() => handleDelete(d.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <ContentLayout title="Schedule Details">
      <div className="w-full max-w-6xl mx-auto py-8">
        <div className="">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild className="float-end ml-5">
              <Button
                onClick={() => {
                  setEditingDetail(null)
                  form.reset()
                }}
              >
                Add <Plus className="ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDetail ? "Edit Detail" : "Add Detail"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="day_of_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week (0-6)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_working_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Working Day</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
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
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
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
                          <Input type="time" {...field} />
                        </FormControl>
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
                          <Input type="time" {...field} />
                        </FormControl>
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
                          <Input type="time" {...field} />
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
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <DataTableWithBack 
            columns={columns} 
            data={details} 
            filterColumn="day_of_week"
            onBackClick={handleGoBack}
          />
        )}
      </div>
    </ContentLayout>
  )
}