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

import {IPermission, ApiResponse} from "@/interface"

import { TableSkeleton } from "@/components/ui/loading-skeleton"

import { createPermission, deletePermission, getAllPermission, updatePermission } from "@/action/permission"

const permissionSchema = z.object({
    code: z.string().min(2, "min 2 characters"),
    name: z.string().min(2, "min 2 characters"),
    module:z.string().min(2, "min 2 characters"),
    description: z.string().optional(),

})

type PermissionForm = z.infer<typeof permissionSchema>

export default function RolesPage() {
    const params = useParams()
    const roleId = Number(params.id)

    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IPermission | null>(null)
    const [permissions, setpermissions] = React.useState<IPermission[]>([])
   
    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchpermissions = async () => {
        try {
            setLoading(true)
            const response: ApiResponse<IPermission[]> = await getAllPermission()
            if (!response.success) throw new Error(response.message)
            setpermissions(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }
   
    React.useEffect(() => {
        fetchpermissions()
           
    }, [roleId])

    const form = useForm<PermissionForm>({
        resolver: zodResolver(permissionSchema),
        defaultValues: {
        
            code: "",
            module:"",
            name: "",
            description: "",
         
        },
    })

    const handleSubmit = async (values: PermissionForm) => {
        try {
            let res
            if (editingDetail) {
                res = await updatePermission(editingDetail.id, values)
            } else {
                res = await createPermission(values)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingDetail ? 'Permission updated successfully' : 'Permission created successfully')
            setOpen(false)
            setEditingDetail(null)
            fetchpermissions()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleDelete = async (roleId: string | number) => {
        try {
            setLoading(true)
            const response = await deletePermission(roleId)
            if (!response.success) throw new Error(response.message)
            toast.success('Permission deleted successfully')
            fetchpermissions()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    // --- definisi kolom ---
    const columns: ColumnDef<IPermission>[] = [
        { accessorKey: "code", header: "Code" },
        {accessorKey:"module",header: "Module"},
        { accessorKey: "name", header: "Name" },
        { accessorKey: "description", header: "Description" },
      

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
                                    <AlertDialogTitle>Delete Permission</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this permission?
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
                <div className=" items-center my-7">
                    
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild className="float-end  ml-5">
                            <Button
                                onClick={() => {
                                    setEditingDetail(null)
                                    form.reset()
                                }}
                            >
                                Add Permission <Plus className="ml-2" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingDetail ? "Edit Permission" : "Add Permission"}
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
                                        name="module"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Module</FormLabel>
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
                    <TableSkeleton rows={6} columns={5} />
                ) : (
                    <DataTable columns={columns} data={permissions} />
                )}
            </div>
        </div>
    )
}
