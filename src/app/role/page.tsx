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

import { IRole } from "@/interface"
import {
    createDepartments,
    deleteDepartments,
    getAllDepartments,
    updateDepartments,
} from "@/action/departement"
import LoadingSkeleton from "@/components/loading-skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllOrganization } from "@/action/organization"
import { createRole, deleteRole, getAllRole, updateRole } from "@/action/role"
import { ContentLayout } from "@/components/admin-panel/content-layout"

const roleSchema = z.object({
    code: z.string().min(2, "min 2 characters"),
    name: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),

})

type RoleForm = z.infer<typeof roleSchema>

export default function RolesPage() {
    const params = useParams()
    const roleId = Number(params.id)

    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IRole | null>(null)
    const [roles, setroles] = React.useState<IRole[]>([])

    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchroles = async () => {
        try {
            setLoading(true)
            const response: unknown = await getAllRole()
            if (!response.success) throw new Error(response.message)
            setroles(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchroles()

    }, [roleId])

    const form = useForm<RoleForm>({
        resolver: zodResolver(roleSchema) as unknown,
        defaultValues: {

            code: "",
            name: "",
            description: "",

        },
    })

    const handleSubmit = async (values: RoleForm) => {
        try {
            let res
            if (editingDetail) {
                res = await updateRole(editingDetail.id, values as unknown)
            } else {
                res = await createRole(values as unknown)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingDetail ? "Updated successfully" : "Created successfully")
            setOpen(false)
            setEditingDetail(null)
            fetchroles()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleDelete = async (roleId: string | number) => {
        try {
            setLoading(true)
            const response = await deleteRole(roleId)
            if (!response.success) throw new Error(response.message)
            toast.success("role deleted successfully")
            fetchroles()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }


    // --- definisi kolom ---
    const columns: ColumnDef<IRole>[] = [
        { accessorKey: "code", header: "Code" },
        { accessorKey: "name", header: "Name" },
        { accessorKey: "description", header: "Description" },


        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const ws = row.original
                return (
                    <div className="flex gap-2 justify-end items-end">
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
                        <Link href={`/role/role-permission/${ws.id}`}>
                            <Button variant={"outline"} className="border-2 cursor-pointer">
                                 Permission<ChevronRight/>
                            </Button>
                        </Link>

                    </div>
                )
            },
        },
    ]

    return (
        <ContentLayout title="Role">
            
            <div className="w-full max-w-6xl mx-auto">
                <div className=" items-center my-7">
                   
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
                    <DataTable columns={columns} data={roles} filterColumn="name" />
                )}
            </div>
        </ContentLayout>
    )
}
