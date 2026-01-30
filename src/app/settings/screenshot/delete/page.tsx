"use client"

import { useState } from "react"
import Link from "next/link"
import { Info, Search } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { ActivityTrackingHeader } from "@/components/settings/ActivityTrackingHeader"

export default function ScreenshotDeletePage() {
  const [globalDelete, setGlobalDelete] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [memberDeletes, setMemberDeletes] = useState<Record<string, boolean>>({})

  const filteredMembers = DUMMY_MEMBERS.filter(member => {
    const fullName = member.name.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleMemberDeleteChange = (memberId: string, checked: boolean) => {
    setMemberDeletes(prev => ({
      ...prev,
      [memberId]: checked
    }))
  }

  const getMemberDelete = (memberId: string) => {
    return memberDeletes[memberId] !== undefined ? memberDeletes[memberId] : globalDelete
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <ActivityTrackingHeader activeTab="screenshots" />

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50">
          <div className="p-4 space-y-1">
            <Link
              href="/activity/screenshots/setting"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Screenshot frequency
            </Link>
            <Link
              href="/activity/screenshots/setting/blur"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Screenshot blur
            </Link>
            <Link
              href="/activity/screenshots/setting/delete"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md"
            >
              Delete screenshots
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Delete Screenshots Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">DELETE SCREENSHOTS</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                This setting allows Owners, Organization managers, Team leads with permission and Project managers to delete screenshots for themselves and other team members.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  {/* Toggle Switch with Off/On labels */}
                  <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1">
                    <button
                      onClick={() => setGlobalDelete(false)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!globalDelete
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setGlobalDelete(true)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${globalDelete
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      On
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Individual settings</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Override the organization default for specific members
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search members"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                          No members found
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => {
                        const memberDelete = getMemberDelete(member.id)
                        return (
                          <tr key={member.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-slate-900">
                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </span>
                                </div>
                                <span className="text-sm text-slate-900">
                                  {member.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                {/* Toggle Switch with Off/On labels */}
                                <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1">
                                  <button
                                    onClick={() => handleMemberDeleteChange(member.id, false)}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!memberDelete
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "bg-transparent text-slate-600"
                                      }`}
                                  >
                                    Off
                                  </button>
                                  <button
                                    onClick={() => handleMemberDeleteChange(member.id, true)}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${memberDelete
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "bg-transparent text-slate-600"
                                      }`}
                                  >
                                    On
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

