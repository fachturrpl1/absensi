"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity, Info, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"

export default function ScreenshotSettingsPage() {
  const [globalFrequency, setGlobalFrequency] = useState("1x")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberFrequencies, setMemberFrequencies] = useState<Record<string, string>>({})

  const frequencyOptions = ["1x", "2x", "3x", "4x", "5x", "6x"]

  const filteredMembers = DUMMY_MEMBERS.filter(member => {
    const fullName = member.name.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleGlobalFrequencyChange = (value: string) => {
    setGlobalFrequency(value)
  }

  const handleMemberFrequencyChange = (memberId: string, value: string) => {
    setMemberFrequencies(prev => ({
      ...prev,
      [memberId]: value
    }))
  }

  const handleApplyToAll = () => {
    const newFrequencies: Record<string, string> = {}
    DUMMY_MEMBERS.forEach(member => {
      newFrequencies[member.id] = globalFrequency
    })
    setMemberFrequencies(newFrequencies)
  }

  const getMemberFrequency = (memberId: string) => {
    return memberFrequencies[memberId] || globalFrequency
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
            href="#"
            className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            TIME & TRACKING
          </Link>
          <Link
            href="/activity/screenshots/setting"
            className="px-4 py-3 text-sm font-medium text-slate-900 border-b-2 border-slate-900 transition-colors"
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
              href="/activity/screenshots/setting"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md"
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
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Delete screenshots
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Screenshot Frequency Section */}
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">SCREENSHOT FREQUENCY</h2>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Control the number of screenshots taken in a 10 minute period.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">GLOBAL:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  <Select value={globalFrequency} onValueChange={handleGlobalFrequencyChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map(option => (
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
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Individual settings</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Override the organization default for specific members
                  </p>
                </div>
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
                        Frequency
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
                        const memberFrequency = getMemberFrequency(member.id)
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
                                  value={memberFrequency}
                                  onValueChange={(value) => handleMemberFrequencyChange(member.id, value)}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {frequencyOptions.map(option => (
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

