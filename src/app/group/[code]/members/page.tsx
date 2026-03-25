"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, User, Search, X, Users, CheckCircle, XCircle, Activity } from "lucide-react"
import { useHydration } from "@/hooks/useHydration"
import { useDebounce } from "@/utils/debounce"
import { MembersApiPage } from "@/types/group"
import { getGroupByCode } from "@/action/groups/group"
import { computeName, computeGroupName, computeNik, MemberLike } from "@/lib/members-mapping"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/groups/cards/stats-card"
import {
  Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia,
} from "@/components/ui/empty"
import { TableSkeleton, membersColumns } from "@/components/skeleton/tables-loading"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { MembersTable } from "@/components/tables/members-table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function GroupMembersPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()   // FIX 4: tambah queryClient
  const { isHydrated, organizationId } = useHydration()
  const groupCode = decodeURIComponent(params.code as string)

  // Local state untuk search dan pagination — jangan pakai URL query params
  const [searchQuery, setSearchQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const debouncedSearch = useDebounce(searchQuery, 400)

  // Reset page ke 1 saat search berubah
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Clear search params dari URL saat mount untuk menghindari kebingungan (decoupled from URL)
  React.useEffect(() => {
    const hasParams = window.location.search !== ""
    if (hasParams) {
      const cleanPath = window.location.pathname
      router.replace(cleanPath)
    }
  }, [router])

  // ── Group resolve ──────────────────────────────────────────────────────
  const { data: groupResult, isLoading: groupLoading } = useQuery({
    queryKey: ["group-by-code", groupCode, organizationId],
    queryFn: () => getGroupByCode(groupCode, organizationId!),
    enabled: isHydrated && !!organizationId,
    staleTime: 5 * 60_000,
  })

  const group = groupResult?.data ?? null
  const groupId = group?.id ?? null
  const groupName = group?.name ?? groupCode

  // FIX 3: fallback enabled jika getGroupByCode gagal — jangan block selamanya
  const groupResolveFailed = groupResult !== undefined && !groupResult.success
  const membersEnabled = isHydrated && (
    groupCode === "no-group" ||
    !!groupId ||
    groupResolveFailed   // tetap fetch meski resolve gagal, biar API handle error-nya
  )

  // ── Fetch members ──────────────────────────────────────────────────────

  const {
    data: pageData,
    isLoading: membersLoading,
    isFetching,
    refetch,
  } = useQuery<MembersApiPage>({
    queryKey: ["members", "group", groupId ?? groupCode, debouncedSearch, page, pageSize],
    queryFn: async ({ signal }) => {
      const url = new URL("/api/members", window.location.origin)
      url.searchParams.set("limit", String(pageSize))
      url.searchParams.set("active", "all")
      url.searchParams.set("countMode", "planned")
      url.searchParams.set("page", String(page))
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch)

      url.searchParams.set(
        "departmentId",
        groupCode === "no-group" ? "null" : String(groupId)
      )

      const res = await fetch(url.toString(), { credentials: "same-origin", signal })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || "Failed to fetch members")
      return json as MembersApiPage
    },
    enabled: membersEnabled,
    staleTime: 60_000,
  })

  // ── Type-Safe Client Filter ─────────────────────────────────────────────
  const members = React.useMemo(() => {
    const rawMembers = pageData?.data ?? []

    if (!searchQuery || !searchQuery.trim()) return rawMembers

    const searchTerm = searchQuery.toLowerCase().trim()

    return rawMembers.filter((m: any) => {
      const member = m as MemberLike & {
        email?: string | null;
        employee_id?: string | null;
        positions?: any;
        role?: any;
      }

      const fullName = computeName(member).toLowerCase()
      const rawEmail = (member.email || member.user?.email || "").toLowerCase()
      const email = rawEmail && !rawEmail.endsWith("@dummy.local") ? rawEmail : ""
      const nik = (computeNik(member) || "").toLowerCase()
      const employeeId = ((member.employee_id || "") as string).toLowerCase()
      const departmentName = computeGroupName(member).toLowerCase()

      const positionName = (
        member.positions?.title ||
        (Array.isArray(member.positions) && member.positions[0]?.title) ||
        ""
      ).toLowerCase()

      const roleName = (member.role?.name || "").toLowerCase()

      return (
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        nik.includes(searchTerm) ||
        employeeId.includes(searchTerm) ||
        departmentName.includes(searchTerm) ||
        positionName.includes(searchTerm) ||
        roleName.includes(searchTerm)
      )
    })
  }, [pageData?.data, searchQuery])


  const total = pageData?.pagination?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handlePageChange = (p: number) => setPage(p)
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); }

  const handleRefresh = React.useCallback(async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["members", "group", groupId ?? groupCode],
      })
      await refetch()
      toast.success("Data refreshed!")
    } catch {
      toast.error("Failed to refresh data")
    }
  }, [queryClient, groupId, groupCode, refetch])

  const {
    data: statsData,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["group-stats", groupId ?? groupCode, organizationId],
    queryFn: async () => {
      const url = new URL("/api/groups/stats", window.location.origin)
      url.searchParams.set("groupId", groupCode === "no-group" ? "null" : String(groupId))
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      const res = await fetch(url.toString(), { credentials: "same-origin" })
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json() as Promise<{
        totalMembers: number
        todayPresent: number
        todayAbsent: number
        activeMembers: number
      }>
    },
    enabled: membersEnabled,
    staleTime: 2 * 60_000,
  })

  // ── Render ─────────────────────────────────────────────────────────────
  if (!isHydrated || (groupLoading && groupCode !== "no-group")) {
    return (
      <div className="px-6 pb-6 space-y-4 w-full mt-6">
        <div className="h-6 w-48 animate-pulse bg-muted rounded" />
        <TableSkeleton rows={8} columns={membersColumns} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{groupName} — Members</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Members"
          value={statsData?.totalMembers ?? 0}
          loading={statsLoading}
          icon={Users}
        />
        <StatsCard
          title="Today Present"
          value={statsData?.todayPresent ?? 0}
          loading={statsLoading}
          icon={CheckCircle}
        />
        <StatsCard
          title="Today Absent"
          value={statsData?.todayAbsent ?? 0}
          loading={statsLoading}
          icon={XCircle}
        />
        <StatsCard
          title="Active Members"
          value={statsData?.activeMembers ?? 0}
          loading={statsLoading}
          icon={Activity}
        />
      </div>


      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={membersLoading}
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
          onClick={handleRefresh}
          disabled={membersLoading}
          className="h-9"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${membersLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div>
        {(membersLoading || (isFetching && members.length === 0)) ? (
          <TableSkeleton rows={8} columns={membersColumns} />
        ) : members.length === 0 ? (
          <div className="py-20">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <User className="h-14 w-14 text-muted-foreground mx-auto" />
                </EmptyMedia>
                <EmptyTitle>No members</EmptyTitle>
                <EmptyDescription>
                  {searchQuery ? `No members found matching "${searchQuery}"` : "No members in this group."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <MembersTable members={members} isLoading={false} onDelete={refetch} showPagination={false} />
          </div>
        )}
      </div>

      <PaginationFooter
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={membersLoading || isFetching}
        from={total > 0 ? (page - 1) * pageSize + 1 : 0}
        to={Math.min(page * pageSize, total)}
        total={total}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 50, 100]}
      />
    </div>
  )
}