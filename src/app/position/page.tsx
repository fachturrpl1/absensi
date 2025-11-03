"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus, Briefcase } from "lucide-react"
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
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
    EmptyMedia,
} from "@/components/ui/empty"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getAllOrganization } from "@/action/organization"
import { createClient } from "@/utils/supabase/client"
import { Can } from "@/components/can"
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

import { logger } from '@/lib/logger';
const positionSchema = z.object({
    organization_id: z.string().min(1, "Organization is required"),
    code: z.string().min(2, "min 2 characters"),
    title: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),
    level: z.string().optional(),
    is_active: z.boolean(),
})

type PositionsForm = z.infer<typeof positionSchema>

export default function PositionsPage() {
    const params = useParams()
    const positionId = Number(params.id)

    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IPositions | null>(null)
    const [positions, setPositions] = React.useState<IPositions[]>([])
    const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [organizationId, setOrganizationId] = React.useState<string>("")

    const supabase = createClient()

    const fetchPositions = async () => {
        try {
            setLoading(true)
            const response: unknown = await getAllPositions()
            const typedResponse = response as { success: boolean; data: IPositions[]; message: string }
            if (!typedResponse.success) throw new Error(typedResponse.message)
            
            // Filter by organization if user has one
            const filteredPositions = organizationId 
                ? typedResponse.data.filter((p: IPositions) => String(p.organization_id) === organizationId)
                : typedResponse.data
            
            setPositions(filteredPositions)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response: unknown = await getAllOrganization()
            const typedResponse = response as { success: boolean; data: { id: string; name: string }[]; message: string }
            if (!typedResponse.success) throw new Error(typedResponse.message)
            setOrganizations(typedResponse.data)
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
        fetchOrganizationId()
        fetchOrganizations()
    }, [])

    React.useEffect(() => {
        if (organizationId) {
            fetchPositions()
        }
    }, [organizationId])

    const form = useForm<PositionsForm>({
        resolver: zodResolver(positionSchema),
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
        if (organizationId && !open) {
            form.reset({
                organization_id: organizationId,
                code: "",
                title: "",
                description: "",
                level: "",
                is_active: true,
            })
        }
    }, [organizationId, form, open])



    const handleSubmit = async (values: PositionsForm) => {
        logger.debug("🚀 Submit values:", values)
        try {
            let res
            if (editingDetail) {
                res = await updatePositions(editingDetail.id, values)
            } else {
                res = await createPositions(values)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingDetail ? 'Saved successfully' : 'Position created successfully')
            setOpen(false)
            setEditingDetail(null)
            fetchPositions()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleDelete = async (positionId: string | number) => {
        try {
            setLoading(true)
            const response = await deletePositions(positionId)
            if (!response.success) throw new Error(response.message)
            toast.success('Position deleted successfully')
            fetchPositions()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const handleDialogOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setEditingDetail(null)
            form.reset({
                organization_id: organizationId || "",
                code: "",
                title: "",
                description: "",
                level: "",
                is_active: true,
            })
        }
    }

    // --- definisi kolom ---
    const columns: ColumnDef<IPositions>[] = [
        { accessorKey: "code", header: "Code" },
        { accessorKey: "title", header: "Position Name" },
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
                                    <AlertDialogTitle>Delete Position</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this position?
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
                    </div>
                )
            },
        },
    ]

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="w-full max-w-6xl mx-auto">
                <div className="items-center my-7">
                    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
                            <DialogTrigger asChild className="float-end  ml-5">
                            <Button
                                onClick={() => {
                                    setEditingDetail(null)
                                    form.reset({
                                        organization_id: organizationId || "",
                                        code: "",
                                        title: "",
                                        description: "",
                                        level: "",
                                        is_active: true,
                                    })
                                    setOpen(true)
                                }}
                            >
                                Add Position <Plus className="ml-2" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingDetail ? 'Edit' : 'Add'} Position
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
                                                                    <SelectValue placeholder="Select..." />
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
                                                <FormLabel>Position Name</FormLabel>
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
                                        {editingDetail ? 'Update' : 'Create'}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                {loading ? (
                    <TableSkeleton rows={6} columns={5} />
                ) : positions.length === 0 ? (
                    <div className="mt-20">
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Briefcase className="h-14 w-14 text-muted-foreground mx-auto" />
                                </EmptyMedia>
                                <EmptyTitle>No positions yet</EmptyTitle>
                                <EmptyDescription>
                                    There are no positions for this organization. Use the &quot;Add&quot; button to create a new position.
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                <Button onClick={() => setOpen(true)}>Add Position</Button>
                            </EmptyContent>
                        </Empty>
                    </div>
                ) : (
                    <DataTable columns={columns} data={positions} />
                )}
            </div>
        </div>
    )
}
