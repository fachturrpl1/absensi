"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import TopBar from "@/components/top-bar"
import { Check, X, User, MoreHorizontal, PlusCircleIcon, Trash2, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deleteOrganization_member, getAllOrganization_member } from "@/action/members"
import React from "react"
import { IUser } from "@/interface"
import { toast } from "sonner"
import LoadingSkeleton from "@/components/loading-skeleton"
import { deleteUsers, getAllUsers } from "@/action/users"
import { useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout"

export default function UsersPage() {
    const [Users, setUsers] = React.useState<IUser[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const router = useRouter()

    const fetchData = async () => {
        try {
            setLoading(true)

            const response: unknown = await getAllUsers()
            if (!response.success) throw new Error(response.message)
            setUsers(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [])

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this user?')) return

        const res = await deleteUsers(id)
        if (res.success) {
            toast.success('User deleted successfully')
            setUsers((prev) => prev.filter((m) => m.id !== id))
        } else {
            toast.error(res.message)
        }
    }

    // --- definisi kolom ---
    const columns: ColumnDef<IUser>[] = [
       
        {
            accessorKey: "first_name",
            header: "First Name",

        },
        {
            accessorKey: "last_name",
            header: "Last Name",

        },
        {
            accessorKey: "phone",
            header: "Phone Number",

        },
        {
            accessorKey: "gender",
            header: "Gender",

        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const active = row.getValue("is_active") as boolean
                return active ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                        <Check className="w-3 h-3 mr-1" /> Active
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-black">
                        <X className="w-3 h-3 mr-1" /> Inactive
                    </span>
                )
            },
        },

        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const member = row.original
                return (
                    <div className="flex gap-2">

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/users/edit/${member.id}`)}
                            className="cursor-pointer bg-secondary border-0 shadow-0 p-0 m-0"
                        >
                            <Edit />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 cursor-pointer bg-secondary border-0  p-0 m-0 "
                            onClick={() => handleDelete(member.id!)}
                        >
                            <Trash />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <ContentLayout title="Users">

            <div className="w-full max-w-6xl mx-auto">


                {loading ? (
                    <LoadingSkeleton />
                ) : (
                    <div>
                      
                        <DataTable columns={columns} data={Users} filterColumn="first_name" />
                    </div>
                )}
            </div>
        </ContentLayout>
    )
}
