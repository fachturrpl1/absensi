"use client"

import { useMemo, useState, use } from "react"
import Link from "next/link"
import { DUMMY_MEMBERS, DUMMY_PROJECTS, PROJECT_MEMBER_MAP, getTaskCountFromTasksPageByProjectId, type Member } from "@/lib/data/dummy-data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pencil } from "lucide-react"
import { PaginationFooter } from "@/components/tables/pagination-footer"

function initialsFromName(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const second = parts[1]?.[0] ?? ""
  return (first + second).toUpperCase()
}

export default function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const project = useMemo(() => DUMMY_PROJECTS.find(p => p.id === id), [id])
  const [activeTab, setActiveTab] = useState<"members" | "teams">("members")

  const taskCount = useMemo(() => project ? getTaskCountFromTasksPageByProjectId(project.id) : 0, [project])

  const memberIds = PROJECT_MEMBER_MAP[id] ?? []
  const assignedMembers: Member[] = useMemo(() => {
    return DUMMY_MEMBERS.filter(m => memberIds.includes(m.id))
  }, [memberIds])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filtered/Paginated Data
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return assignedMembers.slice(start, end)
  }, [assignedMembers, currentPage, pageSize])

  const totalPages = Math.ceil(assignedMembers.length / pageSize) || 1

  // Dialog States
  const [editRateMember, setEditRateMember] = useState<Member | null>(null)
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null)
  const [payRate, setPayRate] = useState("")
  const [billRate, setBillRate] = useState("")

  const handleOpenEditRate = (member: Member) => {
    setEditRateMember(member)
    setPayRate("")
    setBillRate("")
  }

  const handleSaveRates = () => {
    // In a real app, save to backend
    console.log("Saving rates for", editRateMember?.name, { payRate, billRate })
    setEditRateMember(null)
  }

  const handleDeleteMember = () => {
    // In a real app, verify and delete
    console.log("Deleting member", deleteMemberId)
    setDeleteMemberId(null)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{project?.name ?? "Project"}</h1>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>Client: <span className="font-medium">{project?.clientName ?? "N/A"}</span></div>
          <div>Status: <span className="font-medium text-green-600">Active</span></div>
          {/* <div>Budget: <span className="font-medium">{project?.budgetLabel ?? "N/A"}</span></div> */}
          <div className="flex items-center gap-1">
            Tasks:
            <Link
              href={`/projects/tasks/list?project=${encodeURIComponent(project?.name ?? "")}`}
              className="font-medium hover:underline text-primary cursor-pointer"
            >
              {taskCount} tasks
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 text-sm border-b">
        <button
          className={`pb-3 border-b-2 font-medium ${activeTab === "members"
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          onClick={() => setActiveTab("members")}
        >
          MEMBERS
        </button>
        <button
          className={`pb-3 border-b-2 font-medium ${activeTab === "teams"
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          onClick={() => setActiveTab("teams")}
        >
          TEAMS
        </button>
      </div>

      {/* Members Table */}
      {activeTab === "members" && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">Name</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Role</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Pay rate/ Bill rate ⓘ</th>
                <th className="p-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignedMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No members assigned
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-400 text-white text-xs font-medium">
                            {initialsFromName(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className="text-gray-900">User</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      No pay rate / No bill rate
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditRate(m)}>
                            Edit project rates
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteMemberId(m.id)} className="text-red-600">
                            Remove member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {activeTab === "members" && (
        <div className="mt-4">
          <PaginationFooter
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={false}
            from={paginatedMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            to={Math.min(currentPage * pageSize, assignedMembers.length)}
            total={assignedMembers.length}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
          />
        </div>
      )}

      {/* Teams placeholder */}
      {activeTab === "teams" && (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">No teams configured for this project</p>
        </div>
      )}
      {/* Edit Rates Dialog */}
      <Dialog open={!!editRateMember} onOpenChange={(open) => !open && setEditRateMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit project rates</DialogTitle>
            <DialogDescription>
              View and edit {editRateMember?.name}&apos;s project hourly rates for {project?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium text-gray-500 uppercase">MEMBER</div>
              <div className="font-medium text-base">{editRateMember?.name}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 uppercase">PAY RATE</div>
              <div className="text-sm text-gray-600 mb-1">The amount used to pay {editRateMember?.name} for their work on the project.</div>
              <div className="flex rounded-md shadow-sm">
                <Input
                  className="rounded-r-none focus-visible:ring-0 border-r-0"
                  placeholder="Enter amount"
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                />
                <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground flex items-center">
                  USD/hr
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 uppercase">BILL RATE</div>
              <div className="text-sm text-gray-600 mb-1">The amount used to bill clients for {editRateMember?.name}&apos;s work on the project.</div>
              <div className="flex rounded-md shadow-sm">
                <Input
                  className="rounded-r-none focus-visible:ring-0 border-r-0"
                  placeholder="Enter amount"
                  value={billRate}
                  onChange={(e) => setBillRate(e.target.value)}
                />
                <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground flex items-center">
                  USD/hr
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRateMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRates}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteMemberId} onOpenChange={(open) => !open && setDeleteMemberId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the project?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMemberId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}