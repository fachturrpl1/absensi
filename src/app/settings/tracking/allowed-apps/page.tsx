"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity, Info, Search, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"

type AllowedAppsOption = "all" | "desktop" | "mobile"

export default function AllowedAppsPage() {
  const [globalAllowedApps, setGlobalAllowedApps] = useState<AllowedAppsOption>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberAllowedApps, setMemberAllowedApps] = useState<Record<string, AllowedAppsOption>>({})

  const filteredMembers = DUMMY_MEMBERS.filter(member => {
    const fullName = member.name.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleGlobalAllowedAppsChange = (value: AllowedAppsOption) => {
    setGlobalAllowedApps(value)
  }

  const handleMemberAllowedAppsChange = (memberId: string, value: AllowedAppsOption) => {
    setMemberAllowedApps(prev => ({
      ...prev,
      [memberId]: value
    }))
  }

  const getMemberAllowedApps = (memberId: string): AllowedAppsOption => {
    return memberAllowedApps[memberId] || globalAllowedApps
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 w-full">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-900">Activity & tracking</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-200 w-full">
        <div className="flex gap-8">
          <Link
            href="/activity"
            className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            ACTIVITY
          </Link>
          <Link
            href="#"
            className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            TIMESHEETS
          </Link>
          <Link
            href="/activity/tracking/allowed-apps"
            className="px-4 py-3 text-sm font-medium text-slate-900 border-b-2 border-slate-900 transition-colors"
          >
            TIME & TRACKING
          </Link>
          <Link
            href="/activity/screenshots/setting"
            className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            SCREENSHOTS
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50">
          <div className="p-4 space-y-1">
            <Link
              href="/activity/tracking/allowed-apps"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md"
            >
              Allowed apps
            </Link>
            <Link
              href="/activity/tracking/idle-timeout"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Idle timeout
            </Link>
            <Link
              href="/activity/tracking/keep-idle-time"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Keep idle time
            </Link>
            <Link
              href="#"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Automatic tracking policy
              <Star className="h-3 w-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Allowed Apps Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">ALLOWED APPS</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Control which timer apps the team member can use.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  {/* Toggle Switch with All apps, Desktop only, Mobile only */}
                  <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1">
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("all")}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        globalAllowedApps === "all"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-600"
                      }`}
                    >
                      All apps
                    </button>
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("desktop")}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        globalAllowedApps === "desktop"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-600"
                      }`}
                    >
                      Desktop only
                    </button>
                    <button
                      onClick={() => handleGlobalAllowedAppsChange("mobile")}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        globalAllowedApps === "mobile"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-600"
                      }`}
                    >
                      Mobile only
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search members"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
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
                        Allowed apps
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
                        const memberAllowedAppsValue = getMemberAllowedApps(member.id)
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
                                {/* Toggle Switch with All apps, Desktop only, Mobile only */}
                                <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1">
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "all")}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                      memberAllowedAppsValue === "all"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "bg-transparent text-slate-600"
                                    }`}
                                  >
                                    All apps
                                  </button>
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "desktop")}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                      memberAllowedAppsValue === "desktop"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "bg-transparent text-slate-600"
                                    }`}
                                  >
                                    Desktop only
                                  </button>
                                  <button
                                    onClick={() => handleMemberAllowedAppsChange(member.id, "mobile")}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                      memberAllowedAppsValue === "mobile"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "bg-transparent text-slate-600"
                                    }`}
                                  >
                                    Mobile only
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

