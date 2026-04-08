"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Search, Plus, Upload } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Custom Components
import { TableProjects } from "@/components/projects/table-projects"
import AddProjectDialog from "@/components/projects/dialogs/add-project"
import EditProjectDialog from "@/components/projects/dialogs/edit-project"
import TransferProjectDialog from "@/components/projects/dialogs/transfer-project"
import { PaginationFooter } from "@/components/customs/pagination-footer"

// Actions & Logic
import {
  getAllProjects, createProject, updateProject, deleteProject,
  archiveProject, unarchiveProject, getSimpleMembersForDropdown,
} from "@/action/projects"
import { getTeams } from "@/action/teams"
import { useOrgStore } from "@/store/org-store"
import type { ITeams, ISimpleMember, Project, NewProjectForm } from "@/interface"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectRow extends Project {
  description: string | null
  priority: "high" | "medium" | "low" | null
  lifecycleStatus: string
  isBillable: boolean
  budgetAmount: number | null
  currencyCode: string
  startDate: string | null
  endDate: string | null
  createdAt: string | null
  archived: boolean
}

const ADMIN_ROLE_CODES = ["admin", "owner", "super_admin", "administrator"]
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter()
  const { organizationId, currentRole } = useOrgStore()
  const isAdmin = Boolean(currentRole && ADMIN_ROLE_CODES.includes(currentRole.toLowerCase()))

  const [data, setData] = useState<ProjectRow[]>([])
  const [realMembers, setRealMembers] = useState<ISimpleMember[]>([])
  const [teams, setTeams] = useState<ITeams[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  // Form states
  const [form, setForm] = useState<NewProjectForm>({
    names: "", billable: true, disableActivity: false, allowTracking: true,
    disableIdle: false, members: [], teams: [], budgetType: "", budgetBasedOn: "",
    budgetCost: "", budgetNotifyMembers: false, budgetNotifyAt: "80",
    budgetNotifyWho: "", 
    startDate: (new Date().toISOString().split("T")[0] as string) || null, 
    budgetStopTimers: false, budgetStopAt: "100",
    budgetResets: "never", budgetIncludeNonBillable: false,
    memberLimits: [{ members: [], type: "", basedOn: "", cost: "", resets: "never", startDate: "" }],
    memberLimitNotifyAt: "80", memberLimitNotifyMembers: false,
  })

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [editTab, setEditTab] = useState<"general" | "members" | "budget" | "teams">("general")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferProject, setTransferProject] = useState<ProjectRow | null>(null)

  const fetchProjects = async () => {
    setIsLoading(true)
    setFetchError(null)
    if (!organizationId) { setData([]); setIsLoading(false); return }
    const res = await getAllProjects(organizationId)
    if (res.success && res.data) {
      setData(res.data.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        description: p.description ?? null,
        priority: p.priority ?? null,
        lifecycleStatus: p.lifecycle_status ?? "active",
        isBillable: p.is_billable ?? true,
        budgetAmount: p.budget_amount ? Number(p.budget_amount) : null,
        currencyCode: p.currency_code?.trim() || "USD",
        startDate: p.start_date ?? null,
        endDate: p.end_date ?? null,
        createdAt: p.created_at ?? null,
        teams: p.team_projects?.map((tp: any) => tp.teams?.name).filter(Boolean) ?? [],
        members: [], 
        taskCount: p.tasks?.[0]?.count ?? 0,
        budgetLabel: p.budget_amount ? `${p.currency_code} ${p.budget_amount}` : "No budget",
        memberLimitLabel: "0 limits",
        archived: p.lifecycle_status === "archived",
      })))
    } else {
      setFetchError(res.message || "Failed to fetch projects")
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProjects()
    if (organizationId) {
      getSimpleMembersForDropdown(organizationId).then(res => res.success && setRealMembers(res.data))
      getTeams(Number(organizationId)).then(res => res.success && setTeams(res.data))
    }
  }, [organizationId])

  const filtered = useMemo(() => {
    let result = data.filter(p => activeTab === "active" ? !p.archived : p.archived)
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    
    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else if (sortField === "priority") cmp = (PRIORITY_ORDER[a.priority ?? ""] ?? 99) - (PRIORITY_ORDER[b.priority ?? ""] ?? 99)
      else if (sortField === "lifecycleStatus") cmp = a.lifecycleStatus.localeCompare(b.lifecycleStatus)
      else if (sortField === "budgetAmount") cmp = (a.budgetAmount ?? 0) - (b.budgetAmount ?? 0)
      else if (sortField === "startDate") cmp = (a.startDate ?? "").localeCompare(b.startDate ?? "")
      else if (sortField === "endDate") cmp = (a.endDate ?? "").localeCompare(b.endDate ?? "")
      else if (sortField === "createdAt") cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [activeTab, data, search, sortField, sortDir])

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const isAllSelected = paginated.length > 0 && paginated.every(p => selectedIds.includes(p.id))

  const handleSort = (f: string) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(f); setSortDir("asc") }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projects</h1>
        </div>

        <div className="flex items-center gap-6 text-sm border-b">
          {["active", "archived"].map((tab) => (
            <button
              key={tab}
              className={`pb-2 border-b-2 transition-colors capitalize ${activeTab === tab ? "border-foreground font-medium" : "text-muted-foreground"}`}
              onClick={() => { setActiveTab(tab as any); setSelectedIds([]) }}
            >
              {tab} ({data.filter(p => tab === "active" ? !p.archived : p.archived).length})
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Upload className="mr-2 h-3.5 w-3.5" />Import</Button>
            <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-3.5 w-3.5" />Add Project</Button>
          </div>
        </div>

        <TableProjects
          isLoading={isLoading}
          fetchError={fetchError}
          data={paginated}
          selectedIds={selectedIds}
          allSelected={isAllSelected}
          isAdmin={isAdmin}
          sortField={sortField}
          sortDir={sortDir}
          activeFilterCount={search ? 1 : 0}
          onSort={handleSort}
          onClearFilters={() => setSearch("")}
          onToggleSelectAll={() => {
            if (isAllSelected) setSelectedIds(prev => prev.filter(id => !paginated.find(p => p.id === id)))
            else setSelectedIds(prev => [...new Set([...prev, ...paginated.map(p => p.id)])])
          }}
          onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          onRowClick={(p) => router.push(`/projects/${p.id}/tasks/list`)}
          onEdit={(p, t) => { setEditTab(t); setEditing(p) }}
          onArchive={async (id) => { await archiveProject(Number(id)); fetchProjects() }}
          onRestore={async (id) => { await unarchiveProject(Number(id)); fetchProjects() }}
          onDelete={(p) => { setDeleteTarget(p); setDeleteOpen(true) }}
          onTransfer={(p) => { setTransferProject(p); setTransferOpen(true) }}
        />

        <PaginationFooter
          page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
          isLoading={false} total={filtered.length} pageSize={pageSize}
          onPageSizeChange={setPageSize}
          from={(currentPage - 1) * pageSize + 1} to={Math.min(currentPage * pageSize, filtered.length)}
        />

        <AddProjectDialog
          open={addOpen} onOpenChange={setAddOpen}
          form={form} onFormChange={setForm}
          members={realMembers} teams={teams}
          onSave={async () => {
            const names = form.names.split("\n").filter(Boolean)
            for (const n of names) {
              await createProject({ ...form, name: n, teams: form.teams.map(Number) }, organizationId!)
            }
            setAddOpen(false); fetchProjects()
          }}
        />

        {editing && (
          <EditProjectDialog
            open={!!editing} onOpenChange={() => setEditing(null)}
            project={editing} initialTab={editTab as any}
            members={realMembers} teams={teams}
            onSave={async (updatedForm) => {
              await updateProject(Number(editing.id), { ...updatedForm, teams: updatedForm.teams.map(Number) })
              setEditing(null); fetchProjects()
            }}
          />
        )}

        <TransferProjectDialog open={transferOpen} onOpenChange={setTransferOpen} project={transferProject} onTransfer={fetchProjects} />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>Permanently delete {deleteTarget?.name}?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                if(deleteTarget) await deleteProject(Number(deleteTarget.id))
                setDeleteOpen(false); fetchProjects()
              }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}