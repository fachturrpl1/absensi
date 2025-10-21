"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Check, X, User, PlusCircleIcon, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deleteOrganization_member, getAllOrganization_member } from "@/action/members"
import { getAllGroups } from "@/action/group"
import React from "react"
import { IOrganization_member, IUser } from "@/interface"
import { toast } from "sonner"
import LoadingSkeleton from "@/components/loading-skeleton"
import { getAllUsers } from "@/action/users"
import { useRouter } from "next/navigation"
import { ContentLayout } from "@/components/admin-panel/content-layout"
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

export default function MembersPage() {
  const [members, setMembers] = React.useState<IOrganization_member[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)

      const [memberRes, userRes, deptRes] = await Promise.all([
        getAllOrganization_member(),
        getAllUsers(),
        getAllGroups(),
      ])



      if (!memberRes.success) {
        throw new Error(memberRes.message || 'Failed to fetch members')
      }

      if (!userRes.success) {
        throw new Error(userRes.message || 'Failed to fetch users')
      }

      const membersData = memberRes.data || []
      const usersData = userRes.data || []
      const groupsData = deptRes?.data || []

      const groupMap = new Map<string, string>()
      groupsData.forEach((g: any) => {
        if (g && g.id) groupMap.set(String(g.id), g.name)
      })

      // manual join: attach user to each member
      const merged = membersData.map((m: IOrganization_member) => {
        const u = usersData.find((usr: IUser) => usr.id === m.user_id)
        const groupName = groupMap.get(String(m.department_id)) || (m.groups && (m.groups as any).name) || (m.departments && (m.departments as any).name) || ""
        return { ...m, user: u, groupName }
      })

      setMembers(merged)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'An error occurred'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  async function handleDelete(id: string) {
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
      id: "userFullName",
      accessorFn: (row) => {
        const user = (row as any).user as IUser | undefined
        if (!user) return ""
        const parts = [user.first_name, user.middle_name, user.last_name]
          .filter((part): part is string => Boolean(part && part.trim()))
        return parts.length ? parts.join(" ") : ""
      },
      header: "Members",
      cell: ({ row }) => {
        const user = row.original.user
        const fullname = user
          ? ([user.first_name, user.middle_name, user.last_name]
              .filter((part) => part && part.trim() !== "")
              .join(" ") || user.display_name || user.email || "No User")
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
      header: "Group",
      accessorFn: (row) => (row as any).groupName || row.departments?.name || "-",
      cell: ({ row }) => (row.original as any).groupName || row.original.departments?.name || "-",
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
              onClick={() => router.push(`/members/${member.id}`)}
              className="cursor-pointer bg-secondary border-0 shadow-0 p-0 m-0"
              title="View Profile"
            >
              <User />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 cursor-pointer bg-secondary border-0  p-0 m-0 "
                >
                  <Trash />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this member? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (member.id) {
                        await handleDelete(member.id)
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
    <ContentLayout title="Member List">
      <div className="w-full max-w-6xl mx-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div>
            {/* Add Member feature temporarily disabled */}
            {members.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No members found for this organization.</div>
            ) : (
              <DataTable columns={columns} data={members} />
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  )
}
