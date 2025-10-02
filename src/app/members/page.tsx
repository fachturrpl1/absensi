"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Check, X, User, PlusCircleIcon, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deleteOrganization_member, getAllOrganization_member } from "@/action/members"
import React from "react"
import { IOrganization_member, IUser } from "@/interface"
import { toast } from "sonner"
import LoadingSkeleton from "@/components/loading-skeleton"
import { getAllUsers } from "@/action/users"
import { useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout"

export default function MembersPage() {
  const [members, setMembers] = React.useState<IOrganization_member[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)

      const [memberRes, userRes] = await Promise.all([
        getAllOrganization_member(),
        getAllUsers(),
      ])

      if (!memberRes.success || !userRes.success) {
        throw new Error("Failed to fetch data")
      }

      const membersData = memberRes.data || []
      const usersData = userRes.data || []

      // join manual: tambahkan user ke setiap member
      const merged = membersData.map((m: IOrganization_member) => {
        const u = usersData.find((usr: IUser) => usr.id === m.user_id)
        return { ...m, user: u }
      })

      setMembers(merged)
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
    if (!confirm('Are you sure you want to delete this member?')) return

    const res = await deleteOrganization_member(id)
    if (res.success) {
      toast.success('Member deleted successfully')
      setMembers((prev) => prev.filter((m) => m.id !== id))
    } else {
      toast.error(res.message)
    }
  }

  // --- definisi kolom ---
  const columns: ColumnDef<IOrganization_member>[] = [
    {
      accessorKey: "user",
      header: "Members",
      cell: ({ row }) => {
        const user = row.original.user
        const fullname = user
          ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
          : "No User"
        return (
          <div className="flex gap-2 items-center">
            <User className="w-4 h-4" /> {fullname}
          </div>
        )
      },
    },
    {
      header: "Phone Number",
      cell: ({ row }) => row.original.user?.phone ?? "No Phone",
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
              onClick={() => router.push(`/members/edit/${member.id}`)}
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
    <ContentLayout title="Member List">

      <div className="w-full max-w-6xl mx-auto">
      

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div>
            <Link href="/members/add">
              <Button className="flex gap-2 float-end ml-5">
                <PlusCircleIcon className="w-5 h-5" /> Add Member
              </Button>
            </Link>
            <DataTable columns={columns} data={members} filterColumn="user" />
          </div>
        )}
      </div>
    </ContentLayout>
  )
}
