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

import { IDepartments } from "@/interface"
import {
    createDepartments,
    deleteDepartments,
    getAllDepartments,
    updateDepartments,
} from "@/action/departement"
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

const groupSchema = z.object({
    organization_id: z.string().min(1, "Organization is required"),
    code: z.string().min(2, "min 2 characters"),
    name: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),
    is_active: z.boolean(),
})

type GroupForm = z.infer<typeof groupSchema>

export default function GroupsPage() {
    const params = useParams()
    const scheduleId = Number(params.id)

    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IDepartments | null>(null)
    const [groups, setGroups] = React.useState<IDepartments[]>([])
    const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [organizationId, setOrganizationId] = React.useState<string>("")

    const supabase = createClient()

    const fetchGroups = async () => {
        try {
            setLoading(true)
            const response = await getAllDepartments()
            if (!response.success) throw new Error(response.message)
            setGroups(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await getAllOrganization()
            if (!response.success) throw new Error(response.message)
            setOrganizations(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error')
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
            toast.error(error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error')
        }
    }

    React.useEffect(() => {
        fetchGroups()
        fetchOrganizations()
        fetchOrganizationId()
    }, [scheduleId])

    const form = useForm<GroupForm>({
        resolver: zodResolver(groupSchema),
        defaultValues: {
            organization_id: "",
            code: "",
            name: "",
            description: "",
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
    }, [organizationId])

    const handleSubmit = async (values: GroupForm) => {
        console.log("🚀 Submit values:", values)
        try {
            let res
            if (editingDetail) {
                res = await updateDepartments(editingDetail.id, values)
            } else {
                res = await createDepartments(values)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingDetail ? 'Saved successfully' : 'Department created successfully')
            setOpen(false)
            setEditingDetail(null)
            fetchGroups()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err instanceof Error ? err.message : 'Unknown error' : 'Unknown error')
        }
    }

    const handleDelete = async (scheduleId: string | number) => {
        try {
            setLoading(true)
            const response = await deleteDepartments(scheduleId)
            if (!response.success) throw new Error(response.message)
            toast.success('Department deleted successfully')
            fetchGroups()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    // --- definisi kolom ---
    const columns: ColumnDef<IDepartments>[] = [
        { accessorKey: "code", header: "Code" },
        { accessorKey: "name", header: "Department Name" },
        { accessorKey: "description", header: "Description" },
        {
            id: "actions",
            header: 'Actions',
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
        <ContentLayout title="Departments">
            <div className="w-full max-w-6xl mx-auto">
                <div className="items-center my-7">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild className="float-end ml-5">
                            <Button
                                onClick={() => {
                                    setEditingDetail(null)
                                    form.reset()
                                }}
                            >
                                Add Department <Plus className="ml-2" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingDetail ? 'Edit Department' : 'Add Department'}
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
                                        <Can permission="view_departments">
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
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Department Name</FormLabel>
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
                ) : (
                    <DataTable columns={columns} data={groups} filterColumn="name" />
                )}
            </div>
        </ContentLayout>
    )
}
