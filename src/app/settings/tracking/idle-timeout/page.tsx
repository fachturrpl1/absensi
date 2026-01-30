"use client"

import { useState } from "react"
import Link from "next/link"
import { Info, Search, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { ActivityTrackingHeader } from "@/components/settings/ActivityTrackingHeader"

const idleTimeoutOptions = [
  "5 mins",
  "10 mins",
  "15 mins",
  "20 mins",
  "25 mins",
  "30 mins",
  "45 mins",
  "60 mins",
]

export default function IdleTimeoutPage() {
  const [globalIdleTimeout, setGlobalIdleTimeout] = useState("20 mins")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberIdleTimeouts, setMemberIdleTimeouts] = useState<Record<string, string>>({})

  const filteredMembers = DUMMY_MEMBERS.filter(member => {
    const fullName = member.name.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleGlobalIdleTimeoutChange = (value: string) => {
    setGlobalIdleTimeout(value)
  }

  const handleMemberIdleTimeoutChange = (memberId: string, value: string) => {
    setMemberIdleTimeouts(prev => ({
      ...prev,
      [memberId]: value
    }))
  }

  const handleApplyToAll = () => {
    const newTimeouts: Record<string, string> = {}
    DUMMY_MEMBERS.forEach(member => {
      newTimeouts[member.id] = globalIdleTimeout
    })
    setMemberIdleTimeouts(newTimeouts)
  }

  const getMemberIdleTimeout = (memberId: string): string => {
    return memberIdleTimeouts[memberId] || globalIdleTimeout
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <ActivityTrackingHeader activeTab="tracking" />

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50">
          <div className="p-4 space-y-1">
            <Link
              href="/activity/tracking/allowed-apps"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Allowed apps
            </Link>
            <Link
              href="/activity/tracking/idle-timeout"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md"
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
          {/* Idle Timeout Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">IDLE TIMEOUT</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Control how the desktop app detects idle time.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  <Select value={globalIdleTimeout} onValueChange={handleGlobalIdleTimeoutChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {idleTimeoutOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApplyToAll}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Apply to all
                  </Button>
                </div>
              </div>
            </div>

            {/* Individual Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
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
                        Idle timeout
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
                        const memberIdleTimeout = getMemberIdleTimeout(member.id)
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
                                <Select
                                  value={memberIdleTimeout}
                                  onValueChange={(value) => handleMemberIdleTimeoutChange(member.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {idleTimeoutOptions.map(option => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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

