"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Check, X, User, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteOrganization_member } from "@/action/members"
import { IOrganization_member } from "@/interface"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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

interface MembersClientProps {
  initialMembers: IOrganization_member[]
}

export default function MembersClient({ initialMembers }: MembersClientProps) {
  const [members, setMembers] = React.useState(initialMembers)
  const router = useRouter()

  async function handleDelete(id: string) {
    try {
      const res = await deleteOrganization_member(id)
      if (res.success) {
        toast.success("Member deleted successfully")
        // Optimistic update
        setMembers((prev) => prev.filter((m) => m.id !== id))
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const columns: ColumnDef<IOrganization_member>[] = [
    {
      id: "userFullName",
      accessorFn: (row) => {
        const user = (row as any).user
        if (!user) return ""
        const parts = [user.first_name, user.middle_name, user.last_name].filter(
          (part: any) => Boolean(part && part.trim())
        )
        return parts.length ? parts.join(" ") : ""
      },
      header: "Members",
      cell: ({ row }) => {
        const user = (row.original as any).user
        const fullname = user
          ? [user.first_name, user.middle_name, user.last_name]
              .filter((part: any) => part && part.trim() !== "")
              .join(" ") ||
            user.display_name ||
            user.email ||
            "No User"
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
      cell: ({ row }) => (row.original as any).user?.phone ?? "No Phone",
    },
    {
      header: "Group",
      accessorFn: (row) => (row as any).groupName || "-",
      cell: ({ row }) => (row.original as any).groupName || "-",
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
                  className="text-red-500 cursor-pointer bg-secondary border-0 p-0 m-0"
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
                  <AlertDialogAction onClick={() => handleDelete(member.id)}>
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
    <div className="w-full max-w-6xl mx-auto">
      {members.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          No members found for this organization.
        </div>
      ) : (
        <DataTable columns={columns} data={members} />
      )}
    </div>
  )
}
