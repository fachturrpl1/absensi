  "use client"

  import React, { useEffect, useMemo, useState } from 'react'
  import { DataTable } from "@/components/tables/data-table"
  import { ColumnDef } from "@tanstack/react-table"
  import { TableSkeleton, membersColumns } from "@/components/skeleton/tables-loading"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Search, X, RotateCcw } from 'lucide-react'
  import { usePathname } from 'next/navigation'
  import { getPositionById } from '@/action/position'
  import { getMembersByPositionId } from '@/action/members'
  import { IPositions, IOrganization_member } from '@/interface'
  import { toast } from 'sonner'

  export default function PositionDetailPage() {
    const pathname = usePathname()
    const positionId = pathname.split('/').pop()

    const [position, setPosition] = useState<IPositions | null>(null)
    const [members, setMembers] = useState<IOrganization_member[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
      const fetchData = async () => {
        if (!positionId) {
          toast.error('Position ID is missing')
          setLoading(false)
          return
        }

        try {
          setLoading(true)
          const positionRes = await getPositionById(positionId)
          if (!positionRes.success || !positionRes.data) throw new Error(positionRes.message)
          setPosition(positionRes.data)

          const membersRes = await getMembersByPositionId(positionId)
          if (!membersRes.success || !membersRes.data) throw new Error(membersRes.message)
          setMembers(membersRes.data)

        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to fetch data')
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }, [positionId])

    const filteredMembers = useMemo(() => {
      let result = [...members]
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase()
        result = result.filter(
          (member) => {
            const displayName = member.user?.display_name || `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim()
            return (
              displayName.toLowerCase().includes(lowercasedQuery) ||
              (member.user?.email?.toLowerCase() || "").includes(lowercasedQuery)
            )
          }
        )
      }
      return result
    }, [members, searchQuery])

    const columns = useMemo<ColumnDef<IOrganization_member>[]>(
      () => [
        {
          accessorKey: "nickname",
          header: "Nickname",
          cell: ({ row }) => (
            <div className="text-primary hover:underline cursor-pointer">
              {row.original.user?.first_name || '-'}
            </div>
          ),
        },
        {
          id: "fullName",
          header: "Full Name",
          cell: ({ row }) => {
            const fullName = `${row.original.user?.first_name || ''} ${row.original.user?.last_name || ''}`.trim()
            return (
              <div className="text-primary hover:underline cursor-pointer">
                {fullName || '-'}
              </div>
            )
          },
        },
      ],
      []
    )

    return (
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{position?.title || 'Position'} Members</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="pl-10 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Simplified refresh logic for now as per minimal changes
              const fetchData = async () => {
                if (positionId) {
                  try {
                    setLoading(true)
                    const membersRes = await getMembersByPositionId(positionId)
                    if (membersRes.success && membersRes.data) setMembers(membersRes.data)
                  } finally {
                    setLoading(false)
                  }
                }
              }
              fetchData()
            }}
            disabled={loading}
            className="h-9"
          >
            <RotateCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div>
          {loading ? (
            <TableSkeleton rows={8} columns={membersColumns} />
          ) : (
            <DataTable
              columns={columns}
              data={filteredMembers}
              showPagination={false}
              showColumnToggle={false}
            />
          )}
        </div>
      </div>
    )
  }
