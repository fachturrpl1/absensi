"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Search, Pencil } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import AddProjectDialog from "@/components/projects/AddProjectDialog"
import EditProjectDialog from "@/components/projects/EditProjectDialog"
import type { Project, NewProjectForm } from "@/components/projects/types"

const INITIAL_DATA: Project[] = [
  {
    id: "p1",
    name: "Acme Organization’s Project",
    teams: [],
    members: [
      { id: "u1", name: "Alice A", avatarUrl: null },
      { id: "u2", name: "Bob B", avatarUrl: null },
      { id: "u3", name: "Chloe C", avatarUrl: null },
    ],
    todosLabel: "No to-dos",
    budgetLabel: "Budget: none",
    memberLimitLabel: "None",
    archived: false,
  },
]

function initialsFromName(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const second = parts[1]?.[0] ?? ""
  return (first + second).toUpperCase()
}

 export default function Page() {
   const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
   const [search, setSearch] = useState("")
   const [selectedIds, setSelectedIds] = useState<string[]>([])
   const [data, setData] = useState<Project[]>(INITIAL_DATA)
 
   // dialogs
   const [addOpen, setAddOpen] = useState(false)
   const [importOpen, setImportOpen] = useState(false)
 
   // add project form state
   const [form, setForm] = useState<NewProjectForm>({
     names: "",
     billable: true,
     disableActivity: false,
     allowTracking: true,
     disableIdle: false,
     clientId: null
   })

  // edit dialog state
  const [editing, setEditing] = useState<Project | null>(null)
  const [editTab, setEditTab] = useState<"general"|"members"|"budget"|"teams">("general")

  // batch edit dialog state
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchBillable, setBatchBillable] = useState(true)
  const [batchDisableActivity, setBatchDisableActivity] = useState(false)
  const [batchAllowTracking, setBatchAllowTracking] = useState(true)

  // archive confirm state (shared: row & batch)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiveTargets, setArchiveTargets] = useState<string[]>([])

  const filtered = useMemo(() => {
    const byTab = data.filter(p => (activeTab === "active" ? !p.archived : p.archived))
    const q = search.trim().toLowerCase()
    if (!q) return byTab
    return byTab.filter(p => p.name.toLowerCase().includes(q))
  }, [activeTab, data, search])

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(filtered.map(p => p.id))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
         <div className="flex items-center gap-2">
           <Button variant="outline" className="px-3 hidden md:inline-flex" onClick={() => setImportOpen(true)}>
             Import projects
           </Button>
           <Button className="px-3" onClick={() => setAddOpen(true)}>
             Add project
           </Button>
        </div>
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

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          {/* Toolbar */}
           <div className="flex items-center gap-2 flex-wrap justify-between">
             {/* Search */}
             <div className="w-full sm:w-auto min-w-[260px] max-w-[360px] relative">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
               <Input
                 placeholder="Search projects"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-10 border-gray-300"
               />
              </div>
            </div>

            {/* Batch Actions + Selected Count */}
            <div className="flex items-center gap-2">
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

          <Separator className="my-6" />

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[880px]">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium">Name</th>
                  <th className="p-3 text-left text-xs font-medium">Teams</th>
                  <th className="p-3 text-left text-xs font-medium">Members</th>
                  <th className="p-3 text-left text-xs font-medium">To-dos</th>
                  <th className="p-3 text-left text-xs font-medium">Budget</th>
                  <th className="p-3 text-left text-xs font-medium">Member limits</th>
                  <th className="p-3 text-left text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="[&>tr:nth-child(even)]:bg-muted/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-3 align-top">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={undefined} />
                            <AvatarFallback>{initialsFromName(p.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <Link href={`/projects/${p.id}`} className="font-medium text-sm hover:underline block truncate">
                                  {p.name}
                                </Link>
                              </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {p.teams.length === 0 ? "None" : p.teams.join(", ")}
                      </td>
                      <td className="p-3">
                        <div className="flex -space-x-2">
                          {p.members.slice(0, 3).map((m) => (
                            <Avatar key={m.id} className="h-6 w-6 ring-2 ring-background">
                              <AvatarImage src={m.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-[10px]">
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
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{p.todosLabel}</td>
                      <td className="p-3 text-sm text-muted-foreground">{p.budgetLabel}</td>
                      <td className="p-3 text-sm text-muted-foreground">{p.memberLimitLabel}</td>
                       <td className="p-3">
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
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">Delete project</DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem disabled>Edit project</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => { setEditTab("members"); setEditing(p) }}>Manage members</DropdownMenuItem>
                                  <DropdownMenuItem disabled>Duplicate project</DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setData(prev => prev.map(it => it.id === p.id ? { ...it, archived: false } : it))
                                      setSelectedIds(prev => prev.filter(id => id !== p.id))
                                      setActiveTab("active")
                                    }}
                                  >
                                    Restore project
                                  </DropdownMenuItem>
                                  <DropdownMenuItem disabled>Transfer</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">Delete project</DropdownMenuItem>
                                </>
                                
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="text-sm text-muted-foreground mt-4">
            Showing {filtered.length} of {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </div>

       {/* New Project Dialog (refactored) */}
       <AddProjectDialog
         open={addOpen}
         onOpenChange={setAddOpen}
         form={form}
         onFormChange={setForm}
         onSave={() => setAddOpen(false)}
       />

      <EditProjectDialog
          open={Boolean(editing)}
          onOpenChange={(o: boolean) => { if (!o) setEditing(null) }}
          project={editing}
          initialTab={editTab}
          onSave={() => setEditing(null)}
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
              onClick={() => {
                if (archiveTargets.length > 0) {
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

            {/* Import Projects Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import projects</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div className="space-y-3">
            <div className="border-2 border-dashed rounded-md p-6 grid place-items-center bg-muted/30">
              <div className="space-y-2 text-center">
                {/* <input
                  id="projects-file"
                  type="file"
                  accept=\".csv,.xls,.xlsx\"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
                    // Anda bisa menyimpan ke state bila perlu
                    // setImportFile(f)
                  }}
                /> */}
                {/* <Button variant="outline" onClick={() => document.getElementById("projects-file")?.click()}>
                  Browse files
                </Button> */}
                <div className="text-xs text-muted-foreground">
                  Accepted file formats: <span className="font-medium">.CSV, .XLS, .XLSX</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="text-sm text-primary underline underline-offset-4"
              onClick={() => { /* download template */ }}
            >
              Download the template here
            </button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={() => setImportOpen(false)}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
        </CardContent>
      </Card>
    </div>
  )
}