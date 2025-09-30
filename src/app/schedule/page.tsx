"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import TopBar from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import {
    Trash,
    Pencil,
    ChevronRight,
    Plus,
} from "lucide-react"
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

import { toast } from "sonner"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IWorkSchedule } from "@/interface"
import {
    createWorkSchedule,
    deleteWorkSchedule,
    getAllWorkSchedules,
    updateWorkSchedule,
} from "@/action/schedule"
import LoadingSkeleton from "@/components/loading-skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllOrganization } from "@/action/organization"
import { ContentLayout } from "@/components/admin-panel/content-layout"

const scheduleSchema = z.object({
    organization_id: z.string().min(1, "Organization is required"),
    code: z.string().min(2, "min 2 characters"),
    name: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),
    schedule_type: z.string().optional(),
    is_active: z.boolean(),
})

type ScheduleForm = z.infer<typeof scheduleSchema>

export default function WorkSchedulesPage() {
    const params = useParams()
    const scheduleId = Number(params.id)

    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IWorkSchedule | null>(null)
    const [schedules, setSchedules] = React.useState<IWorkSchedule[]>([])
    const [organizations, setOrganizations] = React.useState<{ id: string, name: string }[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchSchedules = async () => {
        try {
            setLoading(true)
            const response: unknown = await getAllWorkSchedules()
            if (!response.success) throw new Error(response.message)
            setSchedules(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }
    const fetchOrganizations = async () => {
        try {
            const response: unknown = await getAllOrganization()
            if (!response.success) throw new Error(response.message)
            setOrganizations(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        }
    }
    React.useEffect(() => {
        fetchSchedules(),
            fetchOrganizations()
    }, [scheduleId])

    const form = useForm<ScheduleForm>({
        resolver: zodResolver(scheduleSchema) as unknown,
        defaultValues: {
            organization_id: "",
            code: "",
            name: "",
            description: "",
            schedule_type: "",
            is_active: true,
        },
    })

    const handleSubmit = async (values: ScheduleForm) => {
        try {
            let res
            if (editingDetail) {
                res = await updateWorkSchedule(editingDetail.id, values as unknown)
            } else {
                res = await createWorkSchedule(values as unknown)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingDetail ? "Updated successfully" : "Created successfully")
            setOpen(false)
            setEditingDetail(null)
            fetchSchedules()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleDelete = async (scheduleId: string | number) => {
        try {
            setLoading(true)
            const response = await deleteWorkSchedule(scheduleId)
            if (!response.success) throw new Error(response.message)
            toast.success("Schedule deleted successfully")
            fetchSchedules()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }


    // --- definisi kolom ---
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
                            onClick={() => {
                                setEditingDetail(ws)
                                form.reset(ws)
                                setOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 border-0 cursor-pointer"
                            onClick={() => handleDelete(ws.id)}
                        >
                            <Trash />
                        </Button>
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
        <ContentLayout title="Schedules">
        
            <div className="w-full max-w-6xl mx-auto">
                <div className=" items-center my-7">
                 
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild className="float-end  ml-5">
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
                                        name="organization_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Organization</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select organization" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {organizations.map((org) => (
                                                            <SelectItem key={org.id} value={String(org.id)}>
                                                                {org.name}
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
                                                <FormControl>
                                                    <Input type="text" {...field} />
                                                </FormControl>
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
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
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
                    <DataTable columns={columns} data={schedules} filterColumn="name" />
                )}
            </div>
        </ContentLayout>
    )
}
