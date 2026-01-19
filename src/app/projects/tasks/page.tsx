"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
    Search, 
    Plus, 
    Copy, 
    Pencil, 
    Trash2,
    ChevronDown
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Dummy data
const todos = [
    {
        id: 1,
        title: "m",
        assignee: {
            name: "Muhammad Ma'Arif",
            initials: "MM"
        },
        type: "Task",
        created: "Mon, Jan 19, 2026 9:16 am"
    }
]

export default function TasksPage() {
    const [showCompleted, setShowCompleted] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full bg-background pr-6">
            <div className="w-full max-w-[900px] ml-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pr-6">
                    <h1 className="text-3xl font-normal text-foreground">Tasks</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                Add integration
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Integration 1</DropdownMenuItem>
                            <DropdownMenuItem>Integration 2</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-end gap-6">
                    {/* Project Filter */}
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Project
                        </span>
                        <Select defaultValue="muhammads-org">
                            <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="muhammads-org">Muhammad&apos;s Organization</SelectItem>
                                <SelectItem value="project-2">Project 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Assignee Filter */}
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Assignee
                        </span>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="muhammad">Muhammad Ma’Arif</SelectItem>
                                <SelectItem value="user-2">User 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 ml-auto">
                    <Button variant="outline" className="w-auto px-5 py-2.5 text-sm gap-2">
                        <Copy className="h-4 w-4" />
                        Duplicate project
                    </Button>
                    <Button variant="outline" className="w-auto px-6 py-2.5 gap-2 border border-muted-foreground/40 bg-white text-foreground hover:border-muted-foreground">
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                </div>
            </div>

            {/* Show Completed Toggle & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showCompleted}
                        onChange={(e) => setShowCompleted(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Show completed tasks
                    </span>
                </label>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search tasks"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white shadow-sm w-full overflow-hidden max-w-[900px] ml-auto">
                <div className="overflow-hidden">
                    <Table className="w-full table-fixed text-sm">
                        <TableHeader>
                            <TableRow className="bg-muted/30 border-b">
                                <TableHead className="px-3 py-2 text-left uppercase tracking-wide text-xs text-muted-foreground">
                                    To-do
                                </TableHead>
                                <TableHead className="px-3 py-2 text-left uppercase tracking-wide text-xs text-muted-foreground">
                                    Assignee
                                </TableHead>
                                <TableHead className="px-3 py-2 text-left uppercase tracking-wide text-xs text-muted-foreground">
                                    To-do type
                                </TableHead>
                                <TableHead className="px-3 py-2 text-left uppercase tracking-wide text-xs text-muted-foreground">
                                    Created
                                </TableHead>
                                <TableHead className="px-3 py-2 text-right uppercase tracking-wide text-xs text-muted-foreground pr-10">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {todos.map((todo) => (
                                <TableRow key={todo.id} className="hover:bg-muted/50">
                                    <TableCell className="px-3 py-3 font-semibold">{todo.title}</TableCell>
                                    <TableCell className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8 bg-blue-500">
                                                <AvatarFallback className="bg-blue-500 text-white text-xs">
                                                    {todo.assignee.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{todo.assignee.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                                            {todo.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-3 py-3 text-muted-foreground">
                                        {todo.created}
                                    </TableCell>
                                    <TableCell className="px-3 py-3 text-right pr-10">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Footer */}
            <div className="text-sm text-muted-foreground">
                Showing {todos.length} of {todos.length} tasks
            </div>
        </div>
    </div>
    )
}
