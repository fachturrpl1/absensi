"use client"

import React, { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IGroup } from "@/interface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash, ChevronRight } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/tables/data-table"

// Helper slug dipindah ke sini agar komponen mandiri
function getGroupSlug(group: IGroup): string {
  if (group.id === "no-group") return "no-group"
  return encodeURIComponent(group.code ?? group.id)
}

interface GroupsTableProps {
  data: IGroup[]
  organizationId: string | number | null | undefined
  onEdit: (group: IGroup) => void
  onDelete: (group: IGroup) => void
}

export function GroupsTable({ data, organizationId, onEdit, onDelete }: GroupsTableProps) {
  // Definisi kolom dimasukkan ke dalam komponen tabel
  const columns = useMemo<ColumnDef<IGroup>[]>(() => [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        const slug = getGroupSlug(row.original)
        return (
          <Link href={`/groups/${slug}/members`} className="hover:underline text-sm font-mono">
            {row.original.code}
          </Link>
        )
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const slug = getGroupSlug(row.original)
        return (
          <Link href={`/groups/${slug}/members`} className="hover:underline font-medium">
            {row.original.name}
          </Link>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.description}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.is_active
              ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 font-medium"
              : "bg-red-50 text-red-600 border-red-200 hover:bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 font-medium"
          }
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isNoGroup = row.original.id === "no-group"
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              disabled={isNoGroup}
              onClick={() => { if (!isNoGroup) onEdit(row.original) }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Link href={`/groups/move?id=${row.original.id}${isNoGroup ? `&orgId=${organizationId}` : ""}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:cursor-pointer"
                title="Move member(s)">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost" size="icon"
              disabled={isNoGroup}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { if (!isNoGroup) onDelete(row.original) }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ], [organizationId, onEdit, onDelete]) // Dependency array memastikan render efisien

  return (
    <DataTable columns={columns} data={data} showColumnToggle={false} />
  )
}