"use client"
import { useState } from "react"
import { ChevronRight } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InsightsRightSidebar({ open, onOpenChange }: Props) {
  const [teamsOpen, setTeamsOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)

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
                    <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium">Add team</button>
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
                <div id="members-section" className="px-4 py-4">
                  <div className="text-sm text-gray-600">No members to display</div>
                  <button className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium">Add member</button>
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