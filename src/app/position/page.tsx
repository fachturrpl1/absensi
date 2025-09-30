"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus } from "lucide-react"
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
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IPositions } from "@/interface"
import {
    createPositions,
    deletePositions,
    getAllPositions,
    updatePositions,
} from "@/action/position"
import LoadingSkeleton from "@/components/loading-skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getAllOrganization } from "@/action/organization"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { createClient } from "@/utils/supabase/client"
import { Can } from "@/components/can"

const positionSchema = z.object({
    organization_id: z.string().min(1, "Organization is required"),
    code: z.string().min(2, "min 2 characters"),
    title: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),
    level: z.string().optional(),
    is_active: z.boolean(),
})

type PositionsForm = z.infer<typeof positionSchema>

export default function WorkSchedulesPage() {
    const params = useParams()
    const scheduleId = Number(params.id)

    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IPositions | null>(null)
    const [schedules, setSchedules] = React.useState<IPositions[]>([])
    const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [organizationId, setOrganizationId] = React.useState<string>("")

    const supabase = createClient()

    const fetchSchedules = async () => {
        try {
            setLoading(true)
            const response: unknown = await getAllPositions()
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
        fetchSchedules()
        fetchOrganizations()
        fetchOrganizationId()
    }, [scheduleId])

    const form = useForm<PositionsForm>({
        resolver: zodResolver(positionSchema) as unknown,
        defaultValues: {
            organization_id: "",
            code: "",
            title: "",
            description: "",
            level: "",
            is_active: true,
        },
    })

    // sinkronkan orgId ke form setelah didapat dari supabase
    React.useEffect(() => {
        if (organizationId) {
            form.reset({
                ...form.getValues(),
                organization_id: organizationId,
            })
        }
    }, [organizationId]) // <--- HANYA organizationId



    const handleSubmit = async (values: PositionsForm) => {
        console.log("🚀 Submit values:", values)
        try {
            let res
            if (editingDetail) {
                res = await updatePositions(editingDetail.id, values as unknown)
            } else {
                res = await createPositions(values as unknown)
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
            const response = await deletePositions(scheduleId)
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
    const columns: ColumnDef<IPositions>[] = [
        { accessorKey: "code", header: "Code" },
        { accessorKey: "title", header: "Title" },
        { accessorKey: "description", header: "Description" },
        { accessorKey: "level", header: "Level" },
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
                    </div>
                )
            },
        },
    ]

    return (
        <ContentLayout title="Position">
            <div className="w-full max-w-6xl mx-auto">
                <div className="items-center my-7">
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
                        <DialogContent aria-describedby={undefined}>
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
                                    {/* Organization field */}
                                    {organizationId ? (
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
                                    ) : (
                                        <Can permission="view_positions">
                                            <FormField
                                                control={form.control}
                                                name="organization_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Organization</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
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
                                        </Can>
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
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
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
                                        name="level"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Level</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field ?? ""} />
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
                    <DataTable columns={columns} data={schedules} filterColumn="title" />
                )}
            </div>
        </ContentLayout>
    )
}
