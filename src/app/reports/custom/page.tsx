"use client"

import React, { useState, useMemo } from "react"
import { DUMMY_CUSTOM_REPORTS, type CustomReport } from "@/lib/data/dummy-data"
import { PaginationFooter } from "@/components/pagination-footer"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Pencil, Trash } from "lucide-react"
import { EditScheduleDialog } from "@/components/report/EditScheduleDialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"

export default function CustomizedReportsPage() {
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [data, setData] = useState(DUMMY_CUSTOM_REPORTS)
    const [editScheduleOpen, setEditScheduleOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null)
    const [reportToDelete, setReportToDelete] = useState<CustomReport | null>(null)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Filter Logic
    const filteredData = useMemo(() => {
        let filtered = data

        // 1. Filter by Status
        if (filter !== "all") {
            filtered = filtered.filter(item => item.status.toLowerCase() === filter)
        }

        // 2. Filter by Search
        if (search.trim()) {
            const q = search.toLowerCase()
            filtered = filtered.filter(item => item.name.toLowerCase().includes(q))
        }

        return filtered
    }, [filter, search, data])

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredData.slice(start, end)
    }, [filteredData, currentPage, pageSize])

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <h1 className="text-2xl font-bold">Customized reports</h1>

            {/* Filter & Search */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative w-full sm:w-auto min-w-[260px] max-w-[360px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search reports"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 border-gray-300"
                        />
                    </div>

                    <div className="w-[180px]">
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="All reports" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All reports</SelectItem>
                                <SelectItem value="active">Active schedules</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                        <tr>
                            <th className="p-4 w-10"></th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Report Type</th>
                            <th className="p-4">Date Last Modified</th>
                            <th className="p-4">Schedule Details</th>
                            <th className="p-4">Schedule Status</th>
                            <th className="p-4 w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-muted-foreground">No reports found</td>
                            </tr>
                        ) : (
                            paginatedData.map((report) => (
                                <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4 text-center">
                                    </td>
                                    <td className="p-4 font-medium text-gray-600 hover:underline cursor-pointer">
                                        {report.name}
                                    </td>
                                    <td className="p-4 text-gray-700">{report.type}</td>
                                    <td className="p-4 text-gray-700">{report.lastModified}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{report.scheduleMeta}</span>
                                            <span className="text-xs text-gray-500">{report.nextSchedule}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {report.status === "Active" ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {report.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500kj">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit report</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedReport(report)
                                                        setEditScheduleOpen(true)
                                                    }}>
                                                        Edit schedule
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setData(prev => prev.map(item =>
                                                            item.id === report.id
                                                                ? { ...item, status: item.status === 'Active' ? 'Paused' : 'Active' }
                                                                : item
                                                        ))
                                                    }}>
                                                        {report.status === 'Active' ? "Pause delivery" : "Resume delivery"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                                onClick={() => setReportToDelete(report)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="border-t pt-2">
                    <PaginationFooter
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        from={paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                        to={Math.min(currentPage * pageSize, filteredData.length)}
                        total={filteredData.length}
                        pageSize={pageSize}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                        className="border-x-0 shadow-none rounded-none bg-transparent"
                    />
                </div>
            </div>

            <EditScheduleDialog
                key={selectedReport?.id || "edit-dialog"}
                open={editScheduleOpen}
                onOpenChange={setEditScheduleOpen}
                initialData={selectedReport}
                onSave={(newData) => {
                    console.log("Saving schedule", newData)
                    // Update logic would go here
                }}
            />

            <Dialog open={Boolean(reportToDelete)} onOpenChange={(open) => !open && setReportToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete report</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{reportToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (reportToDelete) {
                                    setData(prev => prev.filter(item => item.id !== reportToDelete.id))
                                }
                                setReportToDelete(null)
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
