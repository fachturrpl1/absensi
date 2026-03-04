"use client"

import React, { useState, useEffect } from "react"
import { Search, Lightbulb, Info, Globe, Monitor, X } from "lucide-react"
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

export default function AppUrlPage() {
    const [urls, setUrls] = useState<UrlEntry[]>(DUMMY_URLS)
    const [searchQuery, setSearchQuery] = useState("")
    const [jobType, setJobType] = useState("all")
    const [sortBy, setSortBy] = useState("most-common")
    const [showFilterDialog, setShowFilterDialog] = useState(false)

    // Handle ESC key to close dialog
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && showFilterDialog) {
                setShowFilterDialog(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [showFilterDialog])
    const [filterClassification, setFilterClassification] = useState("")
    const [filterTypeOfItems, setFilterTypeOfItems] = useState("")

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
                <Lightbulb className="w-5 h-5 text-gray-900" />
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
                <p className="text-sm text-gray-600 mb-4">
                    Classify apps & URLs for different job roles across your organization. Default ratings can be overridden at the job title level.
                </p>

                {/* Notice & Search Row */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                        </div>
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
                            className="pl-9 h-10 border-gray-300 rounded-full bg-white"
                        />
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-8">
                        {/* Job Type Filter */}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                                JOB TYPE
                                <Info className="w-3 h-3" />
                            </span>
                            <Select value={jobType} onValueChange={setJobType}>
                                <SelectTrigger className="w-[180px] h-10 border-gray-300 bg-white">
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
                            <span className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">
                                SORT BY
                            </span>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[180px] h-10 border-gray-300 bg-white">
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
                    <Button
                        variant="outline"
                        className="h-10 px-6 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-full font-medium"
                        onClick={() => setShowFilterDialog(true)}
                    >
                        Filters
                    </Button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-600 uppercase">App/URL</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase text-center">Classification</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase text-right flex items-center justify-end gap-1">
                        Category
                        <Info className="w-3 h-3 text-gray-400" />
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
                            <div key={url.id} className="grid grid-cols-3 gap-4 py-5 items-center hover:bg-gray-50">
                                {/* App/URL Column */}
                                <div className="flex items-center gap-3">
                                    {url.icon === "globe" ? (
                                        <Globe className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <Monitor className="w-5 h-5 text-gray-400" />
                                    )}
                                    <span className="text-sm text-gray-900">{url.name}</span>
                                </div>

                                {/* Classification Column */}
                                <div className="flex justify-center">
                                    <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                                        <button
                                            onClick={() => handleClassificationChange(url.id, "core")}
                                            className={`px-5 py-2 text-xs font-medium rounded-full transition-all ${url.classification === "core"
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Core work
                                        </button>
                                        <button
                                            onClick={() => handleClassificationChange(url.id, "non-core")}
                                            className={`px-5 py-2 text-xs font-medium rounded-full transition-all ${url.classification === "non-core"
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Non-core work
                                        </button>
                                        <button
                                            onClick={() => handleClassificationChange(url.id, "unproductive")}
                                            className={`px-5 py-2 text-xs font-medium rounded-full transition-all ${url.classification === "unproductive"
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Unproductive
                                        </button>
                                    </div>
                                </div>

                                {/* Category Column */}
                                <div className="flex justify-end">
                                    <Select defaultValue={url.category}>
                                        <SelectTrigger className="w-[180px] h-10 border-gray-300 bg-white">
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

            {/* Filter Dialog */}
            {showFilterDialog && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/30 z-40"
                        style={{ top: '56px' }}
                        onClick={() => setShowFilterDialog(false)}
                    />
                    {/* Sidebar */}
                    <div
                        className="fixed right-0 bottom-0 bg-white shadow-xl p-8 overflow-y-auto z-50"
                        style={{ top: '64px', width: '500px' }}
                    >
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">FILTERS</span>
                                <div className="w-16 h-0.5 bg-gray-400 mt-2"></div>
                            </div>
                            <button
                                onClick={() => setShowFilterDialog(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Classification Filter */}
                        <div className="mb-6">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                                CLASSIFICATION
                            </span>
                            <Select value={filterClassification} onValueChange={setFilterClassification}>
                                <SelectTrigger className="w-full h-11 border-gray-300 bg-white">
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="core">Core work</SelectItem>
                                    <SelectItem value="non-core">Non-core work</SelectItem>
                                    <SelectItem value="unproductive">Unproductive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type of Items Filter */}
                        <div className="mb-8">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                                TYPE OF ITEMS
                            </span>
                            <Select value={filterTypeOfItems} onValueChange={setFilterTypeOfItems}>
                                <SelectTrigger className="w-full h-11 border-gray-300 bg-white">
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="apps">Apps</SelectItem>
                                    <SelectItem value="urls">URLs</SelectItem>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Clear Filters Button */}
                        <Button
                            variant="outline"
                            className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                            onClick={() => {
                                setFilterClassification("")
                                setFilterTypeOfItems("")
                            }}
                        >
                            Clear filters
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
