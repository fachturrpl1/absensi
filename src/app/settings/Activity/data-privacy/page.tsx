"use client"

import { useState } from "react"

import { Info, Search } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { ActivityTrackingHeader } from "@/components/settings/ActivityTrackingHeader"
import { ActivitySidebar } from "@/components/settings/ActivitySidebar"

export default function DataPrivacyPage() {
  const [globalDataPrivacy, setGlobalDataPrivacy] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [memberDataPrivacy, setMemberDataPrivacy] = useState<Record<string, boolean>>({})

  const filteredMembers = DUMMY_MEMBERS.filter(member => {
    const fullName = member.name.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleGlobalDataPrivacyChange = (value: boolean) => {
    setGlobalDataPrivacy(value)
  }

  const handleMemberDataPrivacyChange = (memberId: string, value: boolean) => {
    setMemberDataPrivacy(prev => ({
      ...prev,
      [memberId]: value
    }))
  }

  const getMemberDataPrivacy = (memberId: string): boolean => {
    return memberDataPrivacy[memberId] !== undefined ? memberDataPrivacy[memberId] : globalDataPrivacy
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <ActivityTrackingHeader activeTab="activity" />

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <ActivitySidebar activeItem="data-privacy" />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Data Privacy Section */}
          <div className="space-y-6">
            {/* Information Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-slate-600 flex items-center justify-center">
                  <Info className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-900">
                Apps & URLs data will be visible when looking at All members or Teams data.
              </p>
            </div>

            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">DATA PRIVACY</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Turning this setting on will blur individual members apps and URLs info on dashboards. Apps & URLs reports and activity pages will be hidden.
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
                      onClick={() => handleGlobalDataPrivacyChange(false)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!globalDataPrivacy
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => handleGlobalDataPrivacyChange(true)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${globalDataPrivacy
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
                        Data privacy
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
                        const memberDataPrivacyValue = getMemberDataPrivacy(member.id)
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
                                    onClick={() => handleMemberDataPrivacyChange(member.id, false)}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!memberDataPrivacyValue
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "bg-transparent text-slate-600"
                                      }`}
                                  >
                                    Off
                                  </button>
                                  <button
                                    onClick={() => handleMemberDataPrivacyChange(member.id, true)}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${memberDataPrivacyValue
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

