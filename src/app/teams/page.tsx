"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { Plus, Users as TeamIcon, Search, RotateCcw, X } from "lucide-react"
import {
  Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ITeams } from "@/interface"
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/action/teams"
import { TableSkeleton, groupsColumns as teamsSkeletonColumns } from "@/components/skeleton/tables-loading"
import { getCache, setCache } from "@/lib/local-cache"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useHydration } from "@/hooks/useHydration"

import { TeamsTable } from "@/components/teams/teams-table"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { TeamFormDialog, TeamForm, teamSchema } from "@/components/teams/dialogs/form-dialog"
import { TeamDeleteDialog } from "@/components/teams/dialogs/delete-dialog"

export default function TeamsPage() {
  const queryClient = useQueryClient()
  const { isHydrated, organizationId } = useHydration()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""

  // ── Data state ─────────────────────────────────────────────────────────────
  const [teams, setTeams] = React.useState<ITeams[]>([])
  const [loading, setLoading] = React.useState(true)

  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = React.useState(q)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortOrder] = React.useState("a-z")

  // ── Pagination state ───────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingTeam, setEditingTeam] = React.useState<ITeams | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ITeams | null>(null)

  // ── Form ───────────────────────────────────────────────────────────────────
  const form = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      organization_id: "",
      code: "",
      name: "",
      description: "",
      is_active: true,
      settings: "",
      metadata: "",
    },
  })

  React.useEffect(() => {
    if (organizationId && !modalOpen) {
      form.setValue("organization_id", String(organizationId))
    }
  }, [organizationId, modalOpen, form])

  // ── Filtered & sorted ──────────────────────────────────────────────────────
  const filteredTeams = React.useMemo(() => {
    let result = [...teams]
    if (searchQuery) {
      const lq = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          (t.code || "").toLowerCase().includes(lq) ||
          (t.name || "").toLowerCase().includes(lq) ||
          (t.description || "").toLowerCase().includes(lq)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((t) =>
        statusFilter === "active" ? t.is_active : !t.is_active
      )
    }
    result.sort((a, b) =>
      sortOrder === "a-z"
        ? (a.name || "").localeCompare(b.name || "")
        : (b.name || "").localeCompare(a.name || "")
    )
    return result
  }, [teams, searchQuery, statusFilter, sortOrder])

  // ── Pagination Logic ───────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredTeams.length / pageSize) || 1
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTeamsData = React.useCallback(async () => {
    if (!organizationId) return
    try {
      setLoading(true)
      const result = await getTeams(Number(organizationId))
      if (!result.success) throw new Error(result.message)
      await queryClient.invalidateQueries({ queryKey: ["teams"] })
      
      setTeams(result.data)
      setCache<ITeams[]>(`teams:${organizationId}`, result.data, 1000 * 300)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [organizationId, queryClient])

  React.useEffect(() => {
    if (!isHydrated) return
    if (!organizationId) {
      setLoading(false)
      return
    }
    const cached = getCache<ITeams[]>(`teams:${organizationId}`)
    if (cached && cached.length > 0) {
      setTeams(cached)
      setLoading(false)
      return
    }
    fetchTeamsData()
  }, [isHydrated, organizationId, fetchTeamsData])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRefresh = React.useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("teams:"))
          .forEach((k) => localStorage.removeItem(k))
      }
      await fetchTeamsData()
      await queryClient.invalidateQueries({ queryKey: ["teams"] })
      toast.success("Data has been refreshed!")
    } catch {
      toast.error("Failed to refresh data")
    }
  }, [fetchTeamsData, queryClient])

  const handleSubmit = async (values: TeamForm) => {
    try {
      // FIX: Konversi organization_id ke Number agar sesuai dengan payload API
      const payload = {
        ...values,
        organization_id: Number(values.organization_id)
      }

      const res = editingTeam
        ? await updateTeam(editingTeam.id, payload)
        : await createTeam(payload)
        
      if (!res.success) throw new Error(res.message)
      await queryClient.invalidateQueries({ queryKey: ["teams"] })
      toast.success(editingTeam ? "Saved successfully" : "Team created successfully")
      setModalOpen(false)
      setEditingTeam(null)
      fetchTeamsData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const result = await deleteTeam(deleteTarget.id)
      if (!result.success) throw new Error(result.message || "Failed to delete")
      toast.success("Team deleted successfully")
      await queryClient.invalidateQueries({ queryKey: ["teams"] })
      fetchTeamsData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setDeleteOpen(false)
      setDeleteTarget(null)
    }
  }

  const openAdd = () => {
    setEditingTeam(null)
    form.reset({
      organization_id: organizationId ? String(organizationId) : "",
      code: "", name: "", description: "", is_active: true, settings: "", metadata: "",
    })
    setModalOpen(true)
  }

  const openEdit = (team: ITeams) => {
    setEditingTeam(team)
    form.reset({
      organization_id: String(team.organization_id),
      code: team.code || "",
      name: team.name,
      description: team.description || "",
      is_active: team.is_active ?? true,
      settings: team.settings || "",
      metadata: team.metadata || "",
    })
    setModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setModalOpen(open)
    if (!open) {
      setEditingTeam(null)
      form.reset({
        organization_id: organizationId ? String(organizationId) : "",
        code: "", name: "", description: "", is_active: true, settings: "", metadata: "",
      })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Teams</h1>
        </div>
        <TableSkeleton rows={6} columns={teamsSkeletonColumns} />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Teams</h1>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset halaman saat mencari
              }}
              className="pl-10 pr-8"
              disabled={loading}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setCurrentPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select 
              value={statusFilter} 
              onValueChange={(val) => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-9"
            >
              <RotateCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <TableSkeleton rows={6} columns={teamsSkeletonColumns} />
          ) : teams.length === 0 ? (
            <div className="py-20">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TeamIcon className="h-14 w-14 text-muted-foreground mx-auto" />
                  </EmptyMedia>
                  <EmptyTitle>No teams yet</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery ? `No teams found matching "${searchQuery}"` : "There are no teams for this organization."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <TeamsTable 
                data={paginatedTeams} 
                organizationId={organizationId} 
                onEdit={openEdit} 
                onDelete={(team) => { 
                  setDeleteTarget(team)
                  setDeleteOpen(true) 
                }} 
              />
              
              <PaginationFooter
                page={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage}
                isLoading={loading} 
                total={filteredTeams.length} 
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setCurrentPage(1)
                }}
                from={(currentPage - 1) * pageSize + 1} 
                to={Math.min(currentPage * pageSize, filteredTeams.length)}
              />
            </div>
          )}
        </div>

        {/* Dialogs */}
        {modalOpen && (
          <TeamFormDialog
            open={modalOpen}
            onOpenChange={handleModalClose}
            editingId={editingTeam?.id ?? null}
            form={form}
            onSubmit={handleSubmit}
            organizationId={organizationId}
          />
        )}

        {deleteOpen && (
          <TeamDeleteDialog
            open={deleteOpen}
            onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteTarget(null) }}
            target={deleteTarget}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </>
  )
}