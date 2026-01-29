"use client"

import React, { useState } from "react"
import { Search, Lightbulb, Info, Globe, Monitor, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UrlEntry {
  id: string
  name: string
  icon: "globe" | "monitor"
  classification: "core" | "non-core" | "unproductive"
  category: string
}

// Data dummy untuk tampilan
const DUMMY_URLS: UrlEntry[] = [
  {
    id: "1",
    name: "www.youtube.com",
    icon: "globe",
    classification: "core",
    category: "Entertainment"
  },
  {
    id: "2",
    name: "Antigravity",
    icon: "monitor",
    classification: "core",
    category: "Uncategorized"
  },
  {
    id: "3",
    name: "www.github.com",
    icon: "globe",
    classification: "core",
    category: "Development"
  },
  {
    id: "4",
    name: "www.slack.com",
    icon: "globe",
    classification: "core",
    category: "Communication"
  },
  {
    id: "5",
    name: "www.figma.com",
    icon: "globe",
    classification: "core",
    category: "Design"
  }
]

export default function UrlsPage() {
  const [urls, setUrls] = useState<UrlEntry[]>(DUMMY_URLS)
  const [searchQuery, setSearchQuery] = useState("")
  const [jobType, setJobType] = useState("all")
  const [sortBy, setSortBy] = useState("most-common")

  // Filter data berdasarkan search query
  const filteredUrls = urls.filter(url =>
    url.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle classification change
  const handleClassificationChange = (id: string, newClassification: "core" | "non-core" | "unproductive") => {
    setUrls(prev =>
      prev.map(url =>
        url.id === id ? { ...url, classification: newClassification } : url
      )
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
        <Lightbulb className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-semibold text-gray-900">Insights</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        {/* Section Title */}
        <div className="mb-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            APP/URL CLASSIFICATION
          </span>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-3">
          Classify apps & URLs for different job roles across your organization. Default ratings can be overridden at the job title level.
        </p>

        {/* Notice & Search Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-blue-600">
            <Info className="w-4 h-4" />
            <span className="text-sm">
              You&apos;ll be notified via Email about any fake activity generator apps or URLs being used
            </span>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search apps & URLs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-gray-300 rounded-full"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            {/* Job Type Filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                JOB TYPE
                <Info className="w-3 h-3" />
              </span>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="w-[160px] h-9 border-gray-300">
                  <SelectValue placeholder="All job types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All job types</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 uppercase mb-1">
                SORT BY
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] h-9 border-gray-300">
                  <SelectValue placeholder="Most common" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-common">Most common</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="recently-added">Recently added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters Button */}
          <Button variant="outline" className="h-9 px-4 border-blue-500 text-blue-500 hover:bg-blue-50 rounded-full">
            Filters
          </Button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-600 uppercase">App/URL</span>
          <span className="text-xs font-semibold text-gray-600 uppercase text-center">Classification</span>
          <span className="text-xs font-semibold text-gray-600 uppercase text-right flex items-center justify-end gap-1">
            Category
            <Info className="w-3 h-3" />
          </span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredUrls.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No apps or URLs found matching your search.
            </div>
          ) : (
            filteredUrls.map((url) => (
              <div key={url.id} className="grid grid-cols-3 gap-4 py-4 items-center hover:bg-gray-50">
                {/* App/URL Column */}
                <div className="flex items-center gap-3">
                  {url.icon === "globe" ? (
                    <Globe className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Monitor className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-900">{url.name}</span>
                </div>

                {/* Classification Column */}
                <div className="flex justify-center">
                  <div className="inline-flex rounded-full border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => handleClassificationChange(url.id, "core")}
                      className={`px-4 py-2 text-xs font-medium transition-colors ${
                        url.classification === "core"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Core work
                    </button>
                    <button
                      onClick={() => handleClassificationChange(url.id, "non-core")}
                      className={`px-4 py-2 text-xs font-medium border-x border-gray-300 transition-colors ${
                        url.classification === "non-core"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Non-core work
                    </button>
                    <button
                      onClick={() => handleClassificationChange(url.id, "unproductive")}
                      className={`px-4 py-2 text-xs font-medium transition-colors ${
                        url.classification === "unproductive"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Unproductive
                    </button>
                  </div>
                </div>

                {/* Category Column */}
                <div className="flex justify-end">
                  <Select defaultValue={url.category}>
                    <SelectTrigger className="w-[180px] h-9 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Communication">Communication</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Productivity">Productivity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>
    </div>
  )
}