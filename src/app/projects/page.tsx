"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Search, Pencil, Plus, Upload } from "lucide-react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import AddProjectDialog from "@/components/projects/AddProjectDialog"
import EditProjectDialog from "@/components/projects/EditProjectDialog"
import TransferProjectDialog from "@/components/projects/TransferProjectDialog"
import type { Project, NewProjectForm } from "@/components/projects/types"
import { getAllProjects, createProject, updateProject, deleteProject, archiveProject, unarchiveProject, IProject, getSimpleMembersForDropdown } from "@/action/projects"
import { getClients } from "@/action/client"
import { getAllGroups } from "@/action/group"
import { useOrgStore } from "@/store/org-store"
import { IClient, IGroup } from "@/interface"

import { PaginationFooter } from "@/components/tables/pagination-footer"

function mapProjectData(p: IProject): Project {
    // Build members list from real team_members data
    const memberMap = new Map<string, { id: string; name: string; avatarUrl: string | null }>();

    if (p.team_projects && Array.isArray(p.team_projects)) {
        p.team_projects.forEach((tp: any) => {
            if (tp.teams?.team_members && Array.isArray(tp.teams.team_members)) {
                tp.teams.team_members.forEach((tm: any) => {
                    const profile = tm.organization_members?.user_profiles;
                    if (profile) {
                        const uid = profile.id || tm.organization_members?.user_id;
                        if (!memberMap.has(uid)) {
                            const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown";
                            memberMap.set(uid, { id: uid, name: fullName, avatarUrl: profile.profile_photo_url || null });
                        }
                    }
                });
            }
        });
    }
    const realMembers = Array.from(memberMap.values());

    const tNames = p.team_projects
        ? p.team_projects.map((tp: any) => tp.teams?.name).filter(Boolean)
        : [];

    const clientName: string | null =
        (p as any).client_projects?.[0]?.clients?.name ?? null;

    return {
        id: String(p.id),
        name: p.name,
        clientName,
        teams: tNames,
        members: realMembers,
        taskCount: (p as any).tasks?.[0]?.count ?? 0,
        budgetLabel: p.metadata?.budgetType === 'cost' ? `$${p.metadata?.budgetCost ?? 0}` : `${p.metadata?.budgetCost ?? 0} hours`,
        memberLimitLabel: p.metadata?.memberLimits ? `${p.metadata.memberLimits.length} limits` : '0 limits',
        archived: p.status === 'archived',
    }
}

function initialsFromName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ""
    const second = parts[1]?.[0] ?? ""
    return (first + second).toUpperCase()
}

export default function ProjectsPage() {
    const searchParams = useSearchParams()
    const urlClientName = searchParams.get("client")
    const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
    const [search, setSearch] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [data, setData] = useState<Project[]>([])
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [realMembers, setRealMembers] = useState<{ id: string; name: string }[]>([])
    const [clients, setClients] = useState<IClient[]>([])
    const [groups, setGroups] = useState<IGroup[]>([])

    const { organizationId } = useOrgStore()

    const fetchProjects = async () => {
        setIsLoading(true);
        setFetchError(null);
        if (!organizationId) {
            setFetchError("No organization active");
            setData([]);
            setIsLoading(false);
            return;
        }
        const res = await getAllProjects(organizationId);
        if (res.success && res.data) {
            setData((res.data as IProject[]).map(mapProjectData));
        } else {
            console.error("fetchProjects failed:", res.message);
            setFetchError(res.message || "Failed to fetch projects");
        }
        setIsLoading(false);
    }

    React.useEffect(() => {
        fetchProjects();
        if (organizationId) {
            getSimpleMembersForDropdown(organizationId)
                .then(res => { if (res.success) setRealMembers(res.data); });
            getClients(String(organizationId))
                .then(res => { if (res.success) setClients(res.data); });
            getAllGroups(Number(organizationId))
                .then(res => { if (res.success) setGroups(res.data); });
        }
    }, [organizationId]);
    // dialogs
    const [addOpen, setAddOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)

    // delete confirm state
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

    // add project form state
    const [form, setForm] = useState<NewProjectForm>({
        names: "",
        billable: true,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        clientId: null,
        members: [],
        teams: [],
        // Budget fields
        budgetType: "",
        budgetBasedOn: "",
        budgetCost: "",
        budgetNotifyMembers: false,
        budgetNotifyAt: "80",
        budgetNotifyWho: "",
        budgetStopTimers: false,
        budgetStopAt: "100",
        budgetResets: "never",
        budgetStartDate: null,
        budgetIncludeNonBillable: false,
        // Member limits - initialize with one default limit
        memberLimits: [{
            members: [],
            type: '',
            basedOn: '',
            cost: '',
            resets: 'never',
            startDate: null
        }],
        memberLimitNotifyAt: "80",
        memberLimitNotifyMembers: false,
    })

    // edit dialog state
    const [editing, setEditing] = useState<Project | null>(null)
    const [editTab, setEditTab] = useState<"general" | "members" | "budget" | "teams">("general")

    // batch edit dialog state
    const [batchOpen, setBatchOpen] = useState(false)
    const [batchBillable, setBatchBillable] = useState(true)
    const [batchDisableActivity, setBatchDisableActivity] = useState(false)
    const [batchAllowTracking, setBatchAllowTracking] = useState(true)

    // archive confirm state (shared: row & batch)
    const [archiveOpen, setArchiveOpen] = useState(false)
    const [archiveTargets, setArchiveTargets] = useState<string[]>([])

    // transfer project state
    const [transferOpen, setTransferOpen] = useState(false)
    const [transferProject, setTransferProject] = useState<Project | null>(null)

    const filtered = useMemo(() => {
        let result = data.filter(p => (activeTab === "active" ? !p.archived : p.archived))

        const q = search.trim().toLowerCase()
        if (q) {
            result = result.filter(p => p.name.toLowerCase().includes(q))
        }

        if (urlClientName) {
            result = result.filter(p => p.clientName?.toLowerCase() === urlClientName.toLowerCase())
        }

        return result
    }, [activeTab, data, search, urlClientName])

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filtered.slice(start, end)
    }, [filtered, currentPage, pageSize])

    const totalPages = Math.ceil(filtered.length / pageSize) || 1

    const allSelected = paginated.length > 0 && paginated.every(p => selectedIds.includes(p.id))

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !paginated.find(p => p.id === id)))
        } else {
            const newIds = [...selectedIds]
            paginated.forEach(p => { if (!newIds.includes(p.id)) newIds.push(p.id) })
            setSelectedIds(newIds)
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
    }

    const handleDelete = async () => {
        if (deleteTarget) {
            await deleteProject(Number(deleteTarget.id));
            setData(prev => prev.filter(p => p.id !== deleteTarget.id))
            setDeleteOpen(false)
            setDeleteTarget(null)
            if (selectedIds.includes(deleteTarget.id)) {
                setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
            }
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Projects</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 text-sm">
                <button
                    className={`pb-2 border-b-2 ${activeTab === "active" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setActiveTab("active"); setSelectedIds([]) }}
                >
                    ACTIVE ({data.filter(p => !p.archived).length})
                </button>
                <button
                    className={`pb-2 border-b-2 ${activeTab === "archived" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setActiveTab("archived"); setSelectedIds([]) }}
                >
                    ARCHIVED ({data.filter(p => p.archived).length})
                </button>
            </div>

            <div>
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between flex-gap-3">
                        {/* Search */}
                        <div className="w-full sm:w-auto min-w-[260px] max-w-[360px] relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search projects"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-10 pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="px-3 hidden md:inline-flex" onClick={() => setImportOpen(true)}>
                                <Upload />
                                Import
                            </Button>
                            <Button className="px-3" onClick={() => setAddOpen(true)}>
                                <Plus />Add
                            </Button>
                        </div>
                    </div>

                    {/* Batch Actions + Selected Count */}
                    <div className="flex items-center gap-3 text-sm">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="px-3" disabled={selectedIds.length === 0}>
                                    Batch actions
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onSelect={() => setBatchOpen(true)}>Edit Projects</DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        const first = data.find(d => d.id === selectedIds[0]) || null
                                        setEditTab("budget")
                                        setEditing(first)
                                    }}
                                >
                                    Edit Budget
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setArchiveTargets(selectedIds); setArchiveOpen(true) }}>
                                    Archive
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <span className="text-sm text-muted-foreground min-w-[90px] text-right">
                            {selectedIds.length}/ {filtered.length} selected
                        </span>
                    </div>

                    <Separator className="my-4" />

                    {/* Table */}
                    <div className="mt-4 md:mt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300"
                                        />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Teams</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Tasks</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                                            {fetchError ? (
                                                <div className="text-red-500 font-medium">Error loading projects: {fetchError}</div>
                                            ) : (
                                                isLoading ? "Loading projects..." : "No projects found"
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="align-top">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(p.id)}
                                                    onChange={() => toggleSelect(p.id)}
                                                    className="rounded border-gray-300"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-gray-100 text-gray-700">{initialsFromName(p.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <Link href={`/projects/${p.id}/member`} className="font-medium text-sm hover:underline block truncate">
                                                            {p.name}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {p.clientName ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {p.teams.length === 0 ? "None" : p.teams.join(", ")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex -space-x-2">
                                                    {p.members.slice(0, 3).map((m) => (
                                                        <Avatar key={m.id} className="h-6 w-6 ring-2 ring-background">
                                                            <AvatarFallback className="text-[10px] bg-gray-100 text-gray-700">
                                                                {initialsFromName(m.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                    {p.members.length > 3 && (
                                                        <div className="h-6 w-6 rounded-full bg-muted text-xs grid place-items-center ring-2 ring-background">
                                                            +{p.members.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {p.taskCount}
                                            </TableCell>
                                            {/* <TableCell className="text-muted-foreground">{p.memberLimitLabel}</TableCell> */}
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="px-3">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        {!p.archived ? (
                                                            <>
                                                                <DropdownMenuItem onSelect={() => { setEditTab("general"); setEditing(p) }}>Edit project</DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => { setEditTab("members"); setEditing(p) }}>Manage members</DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => { setEditTab("budget"); setEditing(p) }}>Edit budget</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem>Duplicate project</DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => { setArchiveTargets([p.id]); setArchiveOpen(true) }}>
                                                                    Archive project
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() => {
                                                                        setTransferProject(p);
                                                                        setTransferOpen(true)
                                                                    }}
                                                                >
                                                                    Transfer
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onSelect={() => {
                                                                        setDeleteTarget(p)
                                                                        setDeleteOpen(true)
                                                                    }}
                                                                >
                                                                    Delete project
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem disabled>Edit project</DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => { setEditTab("members"); setEditing(p) }}>Manage members</DropdownMenuItem>
                                                                <DropdownMenuItem disabled>Duplicate project</DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={async () => {
                                                                        await unarchiveProject(Number(p.id));
                                                                        setData(prev => prev.map(it => it.id === p.id ? { ...it, archived: false } : it))
                                                                        setSelectedIds(prev => prev.filter(id => id !== p.id))
                                                                        setActiveTab("active")
                                                                    }}
                                                                >
                                                                    Restore project
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem disabled>Transfer</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onSelect={() => {
                                                                        setDeleteTarget(p)
                                                                        setDeleteOpen(true)
                                                                    }}
                                                                >
                                                                    Delete project
                                                                </DropdownMenuItem>
                                                            </>

                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationFooter
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        isLoading={false}
                        from={paginated.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                        to={Math.min(currentPage * pageSize, filtered.length)}
                        total={filtered.length}
                        pageSize={pageSize}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                    />

                    {/* New Project Dialog (refactored) */}
                    <AddProjectDialog
                        open={addOpen}
                        onOpenChange={setAddOpen}
                        form={form}
                        onFormChange={setForm}
                        members={realMembers}
                        clients={clients}
                        groups={groups}
                        onSave={async () => {
                            const names = form.names.split('\n').map(n => n.trim()).filter(Boolean);
                            const clientName = clients.find(c => String(c.id) === form.clientId)?.name || null;
                            for (const name of names) {
                                await createProject({
                                    name,
                                    is_billable: form.billable,
                                    teams: form.teams.map(t => parseInt(t.replace(/\D/g, ''))).filter(t => !isNaN(t)),
                                    metadata: { ...form, names: undefined, teams: undefined, clientName }
                                }, organizationId || undefined);
                            }
                            await fetchProjects();
                            setAddOpen(false);
                            setForm({ ...form, names: "" });
                        }}
                    />

                    <EditProjectDialog
                        open={Boolean(editing)}
                        onOpenChange={(o: boolean) => { if (!o) setEditing(null) }}
                        project={editing}
                        initialTab={editTab}
                        members={realMembers}
                        clients={clients}
                        groups={groups}
                        onSave={async (updatedForm) => {
                            if (editing) {
                                await updateProject(Number(editing.id), {
                                    name: updatedForm.names,
                                    is_billable: updatedForm.billable,
                                    teams: updatedForm.teams.map(t => parseInt(t.replace(/\D/g, ''))).filter(t => !isNaN(t)),
                                    status: editing.archived ? 'archived' : 'active',
                                    metadata: { ...updatedForm, names: undefined, teams: undefined, clientName: clients.find(c => String(c.id) === updatedForm.clientId)?.name || null }
                                });
                                await fetchProjects();
                            }
                            setEditing(null);
                        }}
                    />


                    {/* Batch Edit Projects Dialog */}
                    <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit project ({selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""})</DialogTitle>
                                <DialogDescription>Editing the selected project will override the existing settings.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <label className="flex items-center justify-between gap-3">
                                    <span className="text-sm">Billable</span>
                                    <Switch checked={batchBillable} onCheckedChange={(v) => setBatchBillable(v)} />
                                </label>
                                <label className="flex items-center justify-between gap-3 opacity-50 pointer-events-none">
                                    <span className="text-sm">Disable activity</span>
                                    <Switch checked={batchDisableActivity} onCheckedChange={(v) => setBatchDisableActivity(v)} />
                                </label>
                                <label className="flex items-center justify-between gap-3">
                                    <span className="text-sm">Allow project tracking</span>
                                    <Switch checked={batchAllowTracking} onCheckedChange={(v) => setBatchAllowTracking(v)} />
                                </label>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setBatchOpen(false)}>Cancel</Button>
                                <Button onClick={() => { /* apply settings if diperlukan nantinya */ setBatchOpen(false) }}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Archive Confirm Dialog (shared for single & batch) */}
                    <Dialog open={archiveOpen} onOpenChange={(o: boolean) => { setArchiveOpen(o); if (!o) setArchiveTargets([]) }}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {archiveTargets.length <= 1 ? "Archive project?" : `Archive ${archiveTargets.length} projects?`}
                                </DialogTitle>
                                <DialogDescription>
                                    This will move {archiveTargets.length <= 1 ? "the project" : "the selected projects"} to Archived. You can unarchive later.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setArchiveOpen(false); setArchiveTargets([]) }}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={async () => {
                                        if (archiveTargets.length > 0) {
                                            for (const id of archiveTargets) {
                                                await archiveProject(Number(id));
                                            }
                                            setData(prev => prev.map(it => archiveTargets.includes(it.id) ? { ...it, archived: true } : it))
                                            setSelectedIds(prev => prev.filter(id => !archiveTargets.includes(id)))
                                            setActiveTab("archived")
                                        }
                                        setArchiveOpen(false)
                                        setArchiveTargets([])
                                    }}
                                >
                                    Archive
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteTarget(null) }}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the project
                                    {deleteTarget && <span className="font-semibold text-foreground"> {deleteTarget.name}</span>} and remove all associated data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) setImportFile(null) }}>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Import projects</DialogTitle>
                                <DialogDescription />
                            </DialogHeader>

                            <div className="space-y-3">
                                <div className="border-2 border-dashed rounded-md p-6 grid place-items-center bg-muted/30">
                                    <div className="space-y-2 text-center">
                                        <input
                                            id="projects-file"
                                            type="file"
                                            accept=".csv,.xls,.xlsx"
                                            className="hidden"
                                            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                                        />
                                        <Button variant="outline" onClick={() => document.getElementById("projects-file")?.click()}>
                                            Browse files
                                        </Button>
                                        <div className="text-xs text-muted-foreground">
                                            Accepted file formats: <span className="font-medium">.CSV, .XLS, .XLSX</span>
                                        </div>
                                        {importFile && (
                                            <div className="text-xs text-foreground">
                                                Selected: <span className="font-medium">{importFile.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="text-sm text-primary hover:cursor-pointer hover:underline underline-offset-4"
                                    onClick={() => { }}
                                >
                                    Download the template here
                                </button>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setImportOpen(false); setImportFile(null) }}>Cancel</Button>
                                <Button
                                    onClick={() => { setImportOpen(false); setImportFile(null) }}
                                    disabled={!importFile}
                                >
                                    Import
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <TransferProjectDialog
                        open={transferOpen}
                        onOpenChange={(o) => { setTransferOpen(o); if (!o) setTransferProject(null) }}
                        project={transferProject}
                        onTransfer={(orgId) => {
                            console.log(`Transferring project ${transferProject?.id} to organization ${orgId}`)
                            // In real implementation, call API to transfer project
                            // Then remove from current data
                            if (transferProject) {
                                setData(prev => prev.filter(p => p.id !== transferProject.id))
                                setTransferProject(null)
                            }
                        }}
                    />

                </div>
            </div>
        </div>
    )
}