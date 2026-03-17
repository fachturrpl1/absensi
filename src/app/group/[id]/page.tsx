"use client"

import React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Search,
  RefreshCw,
  User,
  Loader2,
  Settings
} from "lucide-react"

import { useHydration } from "@/hooks/useHydration"
import { useDebounce } from "@/utils/debounce"
import { IOrganization_member, IMemberInvitation } from "@/interface"
import { getGroupById } from "@/action/group"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { MembersTable } from "@/components/tables/members-table"
import { InvitationsTable } from "@/components/tables/invitations-table"
import { getAllInvitations } from "@/action/invitations"
import { toast } from "sonner"

export default function GroupMembersPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const { isHydrated, organizationId } = useHydration()

  const groupId = String(params.id)

  const [activeTab, setActiveTab] = React.useState("members")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [inviteSearchQuery, setInviteSearchQuery] = React.useState<string>("")
  const [page, setPage] = React.useState<number>(1)
  const [pageSize, setPageSize] = React.useState<number>(10)
  const debouncedSearch = useDebounce(searchQuery, 400)

  // Fetch group details to get the name
  const { data: groupResult, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupById(groupId),
    enabled: isHydrated && groupId !== 'no-group',
  })

  const groupName = groupId === 'no-group' ? 'No Group' : groupResult?.data?.name || 'Group'

  interface MembersApiPage {
    success: boolean
    data: IOrganization_member[]
    pagination: { cursor: string | null; limit: number; hasMore: boolean; total: number }
  }

  // Fetch members for this group/department
  const { data: pageData, isLoading: loading, isFetching, refetch } = useQuery<MembersApiPage>({
    queryKey: ["members", "paged", organizationId, groupId, debouncedSearch, page, pageSize],
    queryFn: async ({ signal }) => {
      const url = new URL('/api/members', window.location.origin)
      url.searchParams.set('limit', String(pageSize))
      url.searchParams.set('active', 'all')
      url.searchParams.set('countMode', 'planned')
      url.searchParams.set('page', String(page))
      if (organizationId) url.searchParams.set('organizationId', String(organizationId))
      if (debouncedSearch) url.searchParams.set('search', debouncedSearch)

      // Handle 'no-group' specifically (maps to department_id = null in DB)
      const deptId = groupId === 'no-group' ? 'null' : groupId
      url.searchParams.set('departmentId', deptId)

      const res = await fetch(url.toString(), { credentials: 'same-origin', signal })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Failed to fetch members')
      return json as MembersApiPage
    },
    // Wait for organizationId to be ready if possible, but at least wait for hydration
    enabled: isHydrated,
    staleTime: 60_000,
  })

  // Fetch invitations
  const { data: invitationsResult, refetch: refetchInvitations, isLoading: invitesLoading } = useQuery({
    queryKey: ["invitations", organizationId],
    queryFn: () => getAllInvitations(),
    enabled: isHydrated,
  })

  const members: IOrganization_member[] = React.useMemo(() => {
    return pageData?.data ?? []
  }, [pageData?.data])

  const total: number = pageData?.pagination?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)))

  React.useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success("Data has been refreshed!")
      await queryClient.invalidateQueries({ queryKey: ['members', 'paged', organizationId, groupId] })
    } catch (error) {
      toast.error("Failed to refresh data")
    }
  }

  if (!isHydrated || (groupLoading && groupId !== 'no-group')) {
    return (
      <div className="px-6 pb-6 space-y-6 w-full mt-6">
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="px-6 pb-6 space-y-6 w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="space-y-4">
          {/* Header Area */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {groupName} - members
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {activeTab === 'invites' && (
                  <Link href="/settings" className="text-sm font-medium flex items-center gap-1">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Tabs List */}
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto">
            <TabsTrigger
              value="members"
              className="rounded-none border-b-2 border-transparent px-4 py-2 uppercase text-xs font-semibold"
            >
              MEMBERS ({total})
            </TabsTrigger>
            <TabsTrigger
              value="invites"
              className="rounded-none border-b-2 border-transparent px-4 py-2 uppercase text-xs font-semibold"
            >
              INVITES ({invitationsResult?.data?.filter((inv: any) => {
                const invDeptId = inv.department_id ? String(inv.department_id) : 'no-group'
                return invDeptId === groupId
              }).length || 0})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-10 bg-background"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-start xl:justify-end items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="h-11"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div>
            {isFetching && !pageData ? (
              <div>
                <TableSkeleton />
              </div>
            ) : members.length === 0 ? (
              <div className="py-20">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <User className="h-14 w-14 text-muted-foreground mx-auto" />
                    </EmptyMedia>
                    <EmptyTitle>No members yet</EmptyTitle>
                    <EmptyDescription>
                      {searchQuery
                        ? `No members found matching "${searchQuery}"`
                        : "There are no members for this group."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            ) : (
              <div className="min-w-full overflow-x-auto relative">
                {isFetching && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <MembersTable
                  members={members}
                  isLoading={false}
                  onDelete={() => { refetch() }}
                  showPagination={false}
                />
              </div>
            )}
          </div>

          <PaginationFooter
            page={page}
            totalPages={totalPages || 1}
            onPageChange={(p: number) => setPage(Math.max(1, Math.min(p, Math.max(1, totalPages))))}
            isLoading={loading || isFetching}
            from={total > 0 ? (page - 1) * pageSize + 1 : 0}
            to={Math.min(page * pageSize, total)}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={(size: number) => { setPageSize(size); setPage(1); }}
            pageSizeOptions={[10, 50, 100]}
          />
        </TabsContent>

        <TabsContent value="invites" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start lg:items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              <Input
                placeholder="Search invites"
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                className="h-11 pl-10 bg-background"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <InvitationsTable
              invitations={invitationsResult?.data?.filter((inv: IMemberInvitation) => {
                const matchesSearch = inviteSearchQuery ?
                  inv.email?.toLowerCase().includes(inviteSearchQuery.toLowerCase()) :
                  true
                const invDeptId = inv.department_id ? String(inv.department_id) : 'no-group'
                const matchesGroup = invDeptId === groupId
                return matchesSearch && matchesGroup
              }) || []}
              isLoading={invitesLoading}
              onUpdate={refetchInvitations}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}