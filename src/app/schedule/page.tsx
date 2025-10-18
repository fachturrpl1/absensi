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
    Calendar,
} from "lucide-react"
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
import { createClient } from "@/utils/supabase/client"
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
    const [organizationId, setOrganizationId] = React.useState<string>("")
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchSchedules = async (orgId?: string) => {
        try {
            setLoading(true)
            const response: unknown = await getAllWorkSchedules(orgId)
            const typedResponse = response as { success: boolean; data: IWorkSchedule[]; message: string }
            if (!typedResponse.success) throw new Error(typedResponse.message)
            setSchedules(typedResponse.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }
    const fetchOrganizations = async () => {
        try {
            const response: unknown = await getAllOrganization()
            const typedResponse = response as { success: boolean; data: { id: string, name: string }[]; message: string }
            if (!typedResponse.success) throw new Error(typedResponse.message)
            setOrganizations(typedResponse.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        }
    }
    const supabase = createClient()

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
    React.useEffect(() => {
        fetchOrganizations()
        fetchOrganizationId()
    }, [scheduleId])

    React.useEffect(() => {
        if (organizationId) {
            fetchSchedules(organizationId)
        }
    }, [organizationId])

    const form = useForm<ScheduleForm>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            organization_id: "",
            code: "",
            name: "",
            description: "",
            schedule_type: "",
            is_active: true,
        },
    })

    // sync organizationId into the form when available
    React.useEffect(() => {
        if (organizationId) {
            form.reset({
                ...form.getValues(),
                organization_id: organizationId,
            })
        }
    }, [organizationId])

    // resolve organization name from loaded organizations when organizationId is present
    const organizationName = React.useMemo(() => {
        if (!organizationId) return ""
        const found = organizations.find((o) => String(o.id) === String(organizationId))
        return found ? found.name : ""
    }, [organizationId, organizations])

    const handleSubmit = async (values: ScheduleForm) => {
        try {
            let res
            if (editingDetail) {
                res = await updateWorkSchedule(editingDetail.id, values as Partial<IWorkSchedule>)
            } else {
                res = await createWorkSchedule(values as Partial<IWorkSchedule>)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingDetail ? 'Schedule updated successfully' : 'Schedule created successfully')
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
            toast.success('Schedule deleted successfully')
            fetchSchedules()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

Select
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
                                    <AlertDialogAction
                                        onClick={async () => {
                                            if (ws.id) {
                                                await handleDelete(ws.id)
                                            }
                                        }}
                                    >
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
        <ContentLayout title="Work Schedules">
        
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
                                Add Schedule <Plus className="ml-2" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingDetail ? 'Edit Schedule' : 'Add Schedule'}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(handleSubmit)}
                                    className="space-y-4"
                                >
                                    {/* If we already know user's organization, hide the select and use a hidden input.
                                        Otherwise fall back to showing the organization selector. */}
                                    {organizationId ? (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="organization_id"
                                                render={({ field }) => (
                                                    <input
                                                        type="hidden"
                                                        value={organizationId}
                                                        onChange={field.onChange}
                                                    />
                                                )}
                                            />
                                            {/* Show organization name as plain text so user knows which org will be used */}
                                            <FormItem>
                                                <FormLabel>Organization</FormLabel>
                                                <div className="text-sm text-muted-foreground">
                                                    {organizationName || "(Organization name not loaded)"}
                                                </div>
                                            </FormItem>
                                        </>
                                    ) : (
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
                                                                <SelectValue placeholder="Select Organization" />
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
                                    )}
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
                                        {editingDetail ? 'Update' : 'Create'}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                {loading ? (
                    <LoadingSkeleton />
                ) : schedules.length === 0 ? (
                    <div className="mt-20">
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Calendar className="h-14 w-14 text-muted-foreground mx-auto" />
                                </EmptyMedia>
                                <EmptyTitle>No schedules yet</EmptyTitle>
                                <EmptyDescription>
                                    There are no schedules for this organization. Use the "Add Schedule" button to create one.
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
        </ContentLayout>
    )
}
