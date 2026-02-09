"use client"

import { useState } from "react"

import { Info, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { useBlurSettings } from "../blur-context"
import { ActivityTrackingHeader } from "@/components/settings/ActivityTrackingHeader"
import { ScreenshotsSidebar } from "@/components/settings/ScreenshotsSidebar"

export default function ScreenshotBlurPage() {
  const members = DUMMY_MEMBERS
  const loading = false
  const { blurSettings, setGlobalBlur, setMemberBlur, getMemberBlur } = useBlurSettings()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredMembers = members.filter(member => {
    const fullName = member.name.toLowerCase()
    const blurStatus = getMemberBlur(member.id) ? "on" : "off"
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || blurStatus.includes(query)
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }


  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <ActivityTrackingHeader activeTab="screenshots" />

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        {/* Left Sidebar */}
        <ScreenshotsSidebar activeItem="blur" />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Screenshot Blur Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">SCREENSHOT BLUR</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Control whether the desktop app blurs screenshots for security and privacy.
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
                      onClick={() => setGlobalBlur(false)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!blurSettings.globalBlur
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setGlobalBlur(true)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${blurSettings.globalBlur
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
                    onChange={(e) => handleSearchChange(e.target.value)}
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
                        Blur
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading members...
                          </div>
                        </td>
                      </tr>
                    ) : filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                          No members found
                        </td>
                      </tr>
                    ) : (
                      paginatedMembers.map((member) => {
                        const memberBlur = getMemberBlur(member.id)
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
                                    onClick={() => {
                                      console.log("Setting blur OFF for member:", member.id, member.name)
                                      setMemberBlur(member.id, false)
                                    }}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!memberBlur
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "bg-transparent text-slate-600"
                                      }`}
                                  >
                                    Off
                                  </button>
                                  <button
                                    onClick={() => {
                                      console.log("Setting blur ON for member:", member.id, member.name)
                                      setMemberBlur(member.id, true)
                                    }}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${memberBlur
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

              {/* Pagination */}
              {!loading && filteredMembers.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-slate-700">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

