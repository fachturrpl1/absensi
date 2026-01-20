"use client"
import { useState, useMemo } from "react"
import { ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Member } from "@/lib/data/dummy-insights"
import type { SelectedFilter } from "@/components/insights/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  members?: Member[]
  selectedFilter?: SelectedFilter
  onSelectedFilterChange?: (filter: SelectedFilter) => void
}

export function InsightsRightSidebar({ open, onOpenChange, members, selectedFilter, onSelectedFilterChange }: Props) {
  const [teamsOpen, setTeamsOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [memberQuery, setMemberQuery] = useState("")
  const filteredMembers = useMemo(
    () => (members ?? []).filter(m => m.name.toLowerCase().includes(memberQuery.toLowerCase())),
    [members, memberQuery]
  )
  const activeMemberId = selectedFilter?.type === "members" && !selectedFilter.all ? selectedFilter.id : undefined

  return (
    <div className={`border-l border-gray-200 overflow-hidden transition-[width] duration-300 ease-in-out ${open ? "w-80" : "w-10"}`}>
      {open ? (
        <aside className="p-6 h-full flex flex-col">
          <div className="space-y-6 flex-1">
            {/* Teams */}
            <div className="border border-gray-200 rounded-md">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                onClick={() => setTeamsOpen(o => !o)}
                aria-expanded={teamsOpen}
                aria-controls="teams-section"
              >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Teams</span>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${teamsOpen ? "rotate-90" : ""}`} />
              </button>
              {teamsOpen && (
                <div id="teams-section" className="px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-600">Engagement</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded" />
                    </div>
                    <h4 className="font-semibold mb-2">No teams to display</h4>
                    <p className="text-sm text-gray-600 mb-4">Add teams to your organization to view metrics about their performance</p>
                    <button className="w-full px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 font-medium">Add team</button>
                  </div>
                </div>
              )}
            </div>

            {/* Members */}
            <div className="border border-gray-200 rounded-md">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                onClick={() => setMembersOpen(o => !o)}
                aria-expanded={membersOpen}
                aria-controls="members-section"
              >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Members</span>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${membersOpen ? "rotate-90" : ""}`} />
              </button>
              {membersOpen && (
                <div id="members-section" className="px-4 py-4 space-y-3">
                  <Input
                    placeholder="Search members"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    className="h-8"
                  />



                  {filteredMembers.length > 0 ? (
                    <ul className="space-y-2">
                      {filteredMembers.map(m => {
                        const initials = m.name.split(" ").map(s => s[0]).slice(0, 2).join("")
                        const active = activeMemberId === m.id
                        return (
                          <li key={m.id}>
                            <button
                              className={`w-full flex items-center justify-between px-2 py-2 rounded ${active ? "bg-zinc-100 text-zinc-900" : "hover:bg-gray-50"}`}
                              onClick={() => onSelectedFilterChange?.({ type: "members", all: false, id: m.id })}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                  {initials}
                                </div>
                                <span className="text-sm truncate">{m.name}</span>
                              </div>
                              <span className="text-xs text-gray-500">{m.activityScore}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-600">No members to display</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      ) : (
        <div className="h-full flex items-center justify-center">
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={() => onOpenChange(true)}
            aria-label="Show sidebar"
            title="Show sidebar"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  )
}