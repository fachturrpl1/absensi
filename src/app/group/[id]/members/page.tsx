"use client"

import React from "react"
import { DataTable } from "@/components/tables/data-table"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getMembersByGroupId } from "@/action/group-members"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft, Users } from "lucide-react"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"

// Type yang sesuai dengan response getMembersByGroupId yang UDAH ADA
interface GroupMember {
  id: string
  user_id: string | null
  group_id: string
  user_name: string
  user_email: string
  joined_at: string
  is_active: boolean
}

const columns: ColumnDef<GroupMember>[] = [
  {
    accessorKey: "user_name",
    header: "Name",
  },
  {
    accessorKey: "user_email",
    header: "Email",
  },
  {
    accessorKey: "joined_at",
    header: "Joined",
    cell: ({ row }: { row: { original: GroupMember } }) => {
      const date = new Date(row.original.joined_at)
      return date.toLocaleDateString('id-ID')
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }: { row: { original: GroupMember } }) =>
      row.original.is_active ? (
        <Badge className="bg-green-500 text-primary-foreground">Active</Badge>
      ) : (
        <Badge variant="destructive">Inactive</Badge>
      ),
  },
]

export default function GroupMembersPage() {
  const params = useParams()
  const groupId = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => getMembersByGroupId(groupId),
  })

  // Safe extraction - sesuai response getMembersByGroupId yang udah ada
  const members = data?.success ? (data.data || []) : []

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/groups">Groups</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="text-destructive">Error loading members</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/groups">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Groups
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span>Members ({members.length})</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {members.length} members
        </Badge>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} columns={4} />
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No members</h3>
            <p className="text-muted-foreground mb-6">
              No members in this group yet.
            </p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={members as GroupMember[]} 
            showColumnToggle={false}
          />
        )}
      </div>
    </div>
  )
}
