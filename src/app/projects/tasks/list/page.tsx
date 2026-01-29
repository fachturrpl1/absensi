"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
// import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Pencil, Trash2, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { DUMMY_MEMBERS, DUMMY_PROJECTS, DUMMY_TASKS, DUMMY_GLOBAL_TASKS, DUMMY_TEAMS, getClientNameByProjectName } from "@/lib/data/dummy-data"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import type { RowSelectionState } from "@tanstack/react-table"

// Helper for initials
function initialsFromName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ""
    const second = parts[1]?.[0] ?? ""
    return (first + second).toUpperCase()
}

type TaskRow = typeof DUMMY_TASKS[number]

export default function ListView() {
    const searchParams = useSearchParams()
    const initialProject = searchParams.get("project")

    const [tasks, setTasks] = useState<TaskRow[]>(DUMMY_TASKS)
    const [activeTab, setActiveTab] = useState<"active" | "completed">("active")
    const [searchQuery, setSearchQuery] = useState("")


    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)

    const [taskToDelete, setTaskToDelete] = useState<TaskRow | null>(null)
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null)

    // Form states
    const [editedTitle, setEditedTitle] = useState("")
    const [editedAssignee, setEditedAssignee] = useState("")
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskAssignee, setNewTaskAssignee] = useState("")
    const [newTaskProject, setNewTaskProject] = useState("")
    const [newTaskTeams, setNewTaskTeams] = useState<string[]>([])

    const [editedTeams, setEditedTeams] = useState<string[]>([])

    // Filter states
    const [selectedProject, setSelectedProject] = useState(initialProject || "all")
    const [selectedAssignee, setSelectedAssignee] = useState("all")

    const projectOptions = useMemo(() => DUMMY_PROJECTS.map((project) => project.name).filter(Boolean), [])
    const uniqueAssignees = useMemo(() => {
        const taskNames = tasks.map((task) => task.assignee)
        const memberNames = DUMMY_MEMBERS.map((member) => member.name)
        return Array.from(new Set([...memberNames, ...taskNames].filter(Boolean)))
    }, [tasks])

    // Assignee list for New Task
    const dynamicAssignees = useMemo(() => {
        if (!newTaskTeams || newTaskTeams.length === 0) return uniqueAssignees
        const memberIds = Array.from(new Set(newTaskTeams.flatMap((teamId) => {
            const t = DUMMY_TEAMS.find((x) => x.id === teamId)
            return t ? t.members : []
        })))
        const names = DUMMY_MEMBERS.filter((m) => memberIds.includes(m.id)).map((m) => m.name)
        return names.length > 0 ? names : uniqueAssignees
    }, [newTaskTeams, uniqueAssignees])

    // Assignee list for Editing Task
    const dynamicEditedAssignees = useMemo(() => {
        if (!editedTeams || editedTeams.length === 0) return uniqueAssignees
        const memberIds = Array.from(new Set(editedTeams.flatMap((teamId) => {
            const t = DUMMY_TEAMS.find((x) => x.id === teamId)
            return t ? t.members : []
        })))
        const names = DUMMY_MEMBERS.filter((m) => memberIds.includes(m.id)).map((m) => m.name)
        return names.length > 0 ? names : uniqueAssignees
    }, [editedTeams, uniqueAssignees])


    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            // Tab filter
            if (activeTab === "active" && task.completed) return false
            if (activeTab === "completed" && !task.completed) return false

            // Dropdown filters
            if (selectedProject !== "all" && task.project !== selectedProject) return false
            if (selectedAssignee !== "all" && task.assignee !== selectedAssignee) return false

            // Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = task.title.toLowerCase().includes(query)
                const matchesAssignee = task.assignee.toLowerCase().includes(query)
                if (!matchesTitle && !matchesAssignee) return false
            }
            return true
        })
    }, [tasks, activeTab, selectedProject, selectedAssignee, searchQuery])

    // Reset selection on filter change
    useEffect(() => {
        setRowSelection({})
    }, [activeTab, selectedProject, selectedAssignee, searchQuery])

    // Columns Definition
    const columns: ColumnDef<TaskRow>[] = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-[2px]"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
        {
            accessorKey: "title",
            header: "Task",
            cell: ({ row }) => <span className="font-medium text-foreground">{row.original.title}</span>,
        },
        {
            accessorKey: "assignee",
            header: "Assignee",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-gray-100 text-gray-700">
                            {initialsFromName(row.original.assignee)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{row.original.assignee}</span>
                </div>
            ),
        },
        {
            accessorKey: "project",
            header: "Project",
            cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.project}</span>,
        },
        {
            id: "client",
            header: "Client",
            cell: ({ row }) => <span className="text-muted-foreground text-sm">{getClientNameByProjectName(row.original.project) ?? "—"}</span>,
        },
        {
            accessorKey: "created",
            header: "Created",
            cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.created}</span>,
        },
        {
            id: "actions",
            header: () => <div>Actions</div>,
            cell: ({ row }) => (
                <div className="inline-flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="px-3">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => {
                                setEditingTask(row.original)
                                setEditedTitle(row.original.title)
                                setEditedAssignee(row.original.assignee)
                                setEditedTeams([])
                            }}>
                                Edit task
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {
                                setTasks(prev => prev.map(t => t.id === row.original.id ? { ...t, completed: !row.original.completed } : t))
                            }}>
                                {row.original.completed ? "Reopen task" : "Mark as complete"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="outline"
                        size="sm"
                        className="px-3"
                        onClick={() => setTaskToDelete(row.original)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], [])

    // Batch Actions Handler
    const selectedCount = Object.keys(rowSelection).length

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Tasks</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 text-sm">
                <button
                    className={`pb-2 border-b-2 ${activeTab === "active" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveTab("active")}
                >
                    ACTIVE ({tasks.filter(t => !t.completed).length})
                </button>
                <button
                    className={`pb-2 border-b-2 ${activeTab === "completed" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveTab("completed")}
                >
                    COMPLETED ({tasks.filter(t => t.completed).length})
                </button>
            </div>

            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        {/* Search */}
                        <div className="relative w-full sm:w-auto min-w-[260px] max-w-[360px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search tasks"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ps-10 pl-10"
                            />
                        </div>

                        {/* Filters inline with search for better density */}
                        <Select value={selectedProject} onValueChange={(value) => setSelectedProject(value)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All projects</SelectItem>
                                {projectOptions.map((projectName) => (
                                    <SelectItem key={projectName} value={projectName}>{projectName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedAssignee} onValueChange={(value) => setSelectedAssignee(value)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="All assignees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All assignees</SelectItem>
                                {uniqueAssignees.map((assignee) => (
                                    <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button className="px-3" onClick={() => setIsNewTaskDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />Add task
                        </Button>
                    </div>
                </div>

                {/* Batch Actions + Selection Count */}
                <div className="flex items-center gap-3 text-sm">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="px-3" disabled={selectedCount === 0}>
                                Batch actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                                onSelect={() => {
                                    // Map selection (by row index or id? DataTable by default uses index unless getRowKey is provided)
                                    // We need to ensure we use IDs. We will pass getRowKey to DataTable.
                                    const selectedRowIds = Object.keys(rowSelection).filter(k => rowSelection[k])

                                    if (activeTab === "active") {
                                        setTasks(prev => prev.map(t => selectedRowIds.includes(t.id) ? { ...t, completed: true } : t))
                                    } else {
                                        setTasks(prev => prev.map(t => selectedRowIds.includes(t.id) ? { ...t, completed: false } : t))
                                    }
                                    setRowSelection({})
                                }}
                            >
                                {activeTab === "active" ? "Mark as completed" : "Reopen tasks"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-muted-foreground min-w-[90px]">
                        {selectedCount} / {filteredTasks.length} selected
                    </span>
                </div>

                <Separator className="my-8" />

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={filteredTasks}
                    rowSelection={rowSelection}
                    onRowSelectionChange={setRowSelection}
                    getRowKey={(row) => row.id} // Important for valid selection state by ID
                    showGlobalFilter={false} // We have manual search
                    showFilters={false} // We have custom filters
                    showColumnToggle={false}
                    rowInteractive={false}
                />
            </div>

            {/* DIALOGS (Preserved) */}
            <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>New task</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create a new task and assign it immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="general" className="space-y-4 py-2">
                        <TabsList className="mb-2">
                            <TabsTrigger value="general">GENERAL</TabsTrigger>
                            <TabsTrigger value="teams">TEAMS</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">TASK*</div>
                                    <Input
                                        className="px-4"
                                        placeholder="Enter task"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">ASSIGNEE</div>
                                    <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dynamicAssignees.map((assignee) => (
                                                <SelectItem key={assignee} value={assignee}>
                                                    {assignee}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">PROJECT</div>
                                    <Select
                                        value={newTaskProject || (selectedProject !== "all" ? selectedProject : projectOptions[0])}
                                        onValueChange={setNewTaskProject}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projectOptions.map((project) => (
                                                <SelectItem key={project} value={project}>
                                                    {project}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                                    <p>
                                        An agile project management tool with automated workflows.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="teams" className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold text-muted-foreground">TEAMS</div>
                                    <Button variant="link" className="h-auto p-0 text-gray-900 hover:cursor-pointer" onClick={() => setNewTaskTeams(DUMMY_TEAMS.map(t => t.id))}>Select all</Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                <div className="space-y-4">
                                    {DUMMY_TEAMS.map((team) => (
                                        <div key={team.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`task-team-${team.id}`}
                                                checked={newTaskTeams.includes(team.id)}
                                                onCheckedChange={(checked) => {
                                                    setNewTaskTeams((prev) => {
                                                        const set = new Set(prev)
                                                        if (checked) set.add(team.id); else set.delete(team.id)
                                                        return Array.from(set)
                                                    })
                                                }}
                                            />
                                            <label htmlFor={`task-team-${team.id}`} className="text-sm leading-none">
                                                {team.name} <span className="text-muted-foreground">({team.memberCount} members)</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (newTaskTitle.trim()) {
                                    const newTask: TaskRow = {
                                        id: `task-${Date.now()}`,
                                        title: newTaskTitle,
                                        assignee: newTaskAssignee || uniqueAssignees[0] || DUMMY_MEMBERS[0]?.name || "Unassigned",
                                        project: newTaskProject || (selectedProject !== "all" ? selectedProject : projectOptions[0] || "Default Project"),
                                        type: "Task",
                                        created: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                                        status: "task",
                                        completed: false
                                    }
                                    setTasks([...tasks, newTask])
                                    setNewTaskTitle("")
                                    setNewTaskAssignee("")
                                    setIsNewTaskDialogOpen(false)
                                }
                            }}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>



            <Dialog open={Boolean(taskToDelete)} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <DialogContent className="max-w-md space-y-6">
                    <DialogHeader>
                        <DialogTitle>Delete task</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Are you sure you want to delete{taskToDelete ? ` "${taskToDelete.title}"` : ""}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            className="w-full sm:w-auto"
                            variant="destructive"
                            onClick={() => {
                                if (taskToDelete) {
                                    setTasks(tasks.filter(task => task.id !== taskToDelete.id))
                                }
                                setTaskToDelete(null)
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit task</DialogTitle>
                        <DialogDescription>
                            Update the fields below before saving your changes.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="general" className="space-y-4 py-2">
                        <TabsList className="mb-2">
                            <TabsTrigger value="general">GENERAL</TabsTrigger>
                            <TabsTrigger value="teams">TEAMS</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">TASK*</div>
                                    <Input className="px-4" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">ASSIGNEE</div>
                                    <Select value={editedAssignee} onValueChange={(value) => setEditedAssignee(value)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dynamicEditedAssignees.map((assignee) => (
                                                <SelectItem key={assignee} value={assignee}>
                                                    {assignee}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="teams" className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold text-muted-foreground">TEAMS</div>
                                    <Button variant="link" className="h-auto p-0 text-gray-900 hover:cursor-pointer" onClick={() => setEditedTeams(DUMMY_TEAMS.map(t => t.id))}>Select all</Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                <div className="space-y-4">
                                    {DUMMY_TEAMS.map((team) => (
                                        <div key={team.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-team-${team.id}`}
                                                checked={editedTeams.includes(team.id)}
                                                onCheckedChange={(checked) => {
                                                    setEditedTeams((prev) => {
                                                        const set = new Set(prev)
                                                        if (checked) set.add(team.id); else set.delete(team.id)
                                                        return Array.from(set)
                                                    })
                                                }}
                                            />
                                            <label htmlFor={`edit-team-${team.id}`} className="text-sm leading-none">
                                                {team.name} <span className="text-muted-foreground">({team.memberCount} members)</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTask(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!editingTask) return
                                setTasks((prev) =>
                                    prev.map((task) =>
                                        task.id === editingTask.id
                                            ? { ...task, title: editedTitle, assignee: editedAssignee }
                                            : task
                                    )
                                )
                                setEditingTask(null)
                            }}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
