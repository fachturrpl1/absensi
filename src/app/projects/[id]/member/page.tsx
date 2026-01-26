"use client"

import { useMemo, useState, use } from "react"
import Link from "next/link"
import { DUMMY_MEMBERS, DUMMY_PROJECTS, PROJECT_MEMBER_MAP, getTaskCountFromTasksPageByProjectId, type Member } from "@/lib/data/dummy-data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

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

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      {/* Project Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{project?.name ?? "Project"}</h1>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>Client: <span className="font-medium">{project?.clientName ?? "N/A"}</span></div>
          <div>Status: <span className="font-medium text-green-600">Active</span></div>
          <div>Budget: <span className="font-medium">{project?.budgetLabel ?? "N/A"}</span></div>
          <div className="flex items-center gap-1">
            Tasks:
            <Link
              href={`/projects/tasks/list?project=${encodeURIComponent(project?.name ?? "")}`}
              target="_blank"
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
                assignedMembers.map((m, idx) => (
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
                      <Select defaultValue={idx === 0 ? "user" : "manager"}>
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      No pay rate / No bill rate
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        Actions
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 text-sm text-muted-foreground border-t">
            Showing {assignedMembers.length} of {assignedMembers.length} members
          </div>
        </div>
      )}

      {/* Teams placeholder */}
      {activeTab === "teams" && (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">No teams configured for this project</p>
        </div>
      )}
    </div>
  )
}