"use client"

import { useMemo, useState, use } from "react"
import { DUMMY_MEMBERS, DUMMY_PROJECTS, PROJECT_MEMBER_MAP, type Member } from "@/lib/data/dummy-data"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const project = useMemo(() => DUMMY_PROJECTS.find(p => p.id === id), [id])
  const [query, setQuery] = useState("")

  const memberIds = PROJECT_MEMBER_MAP[id] ?? []
  const assignedMembers: Member[] = useMemo(() => {
    const base = DUMMY_MEMBERS.filter(m => memberIds.includes(m.id))
    if (!query.trim()) return base
    const q = query.toLowerCase()
    return base.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
  }, [memberIds, query])

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-bold">{project ? `${project.name} Members` : "Project Members"}</h1>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 font-medium text-muted-foreground w-1/3">Nickname</th>
              <th className="p-4 font-medium text-muted-foreground">Full Name</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assignedMembers.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-6 text-center text-muted-foreground">
                  No members assigned
                </td>
              </tr>
            ) : (
              assignedMembers.map(m => (
                <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 align-top">{m.name.split(" ")[0]}</td>
                  <td className="p-4 align-top uppercase">{m.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}