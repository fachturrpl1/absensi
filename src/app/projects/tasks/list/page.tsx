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
import { DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { DataTable } from "@/components/tables/data-table"
import { ColumnDef } from "@tanstack/react-table"
import type { RowSelectionState } from "@tanstack/react-table"
import { getTasks, createTask, updateTask, deleteTask, assignTaskMember } from "@/action/task"
import { getProjects } from "@/action/project"
import { getAllOrganization_member } from "@/action/members"
import { ITask, IProject, IOrganization_member } from "@/interface"
import { toast } from "sonner"

// Helper for initials
function initialsFromName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ""
    const second = parts[1]?.[0] ?? ""
    return (first + second).toUpperCase()
}


export default function ListView() {
    const searchParams = useSearchParams()
    const initialProject = searchParams.get("project")

    const [tasks, setTasks] = useState<ITask[]>([])
    const [projects, setProjects] = useState<IProject[]>([])
    const [members, setMembers] = useState<IOrganization_member[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [activeTab, setActiveTab] = useState<"active" | "completed">("active")
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
    const urlClientName = searchParams.get("client")

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [tasksRes, projectsRes, membersRes] = await Promise.all([
                    getTasks(),
                    getProjects(),
                    getAllOrganization_member()
                ])

                if (tasksRes.success) setTasks(tasksRes.data)
                if (projectsRes.success) setProjects(projectsRes.data)
                if (membersRes.success) setMembers(membersRes.data)
            } catch (error) {
                console.error("Error fetching data:", error)
                toast.error("Failed to load data")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])


    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)

    const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null)
    const [editingTask, setEditingTask] = useState<ITask | null>(null)

    // Form states
    const [editedTitle, setEditedTitle] = useState("")
    const [editedAssignee, setEditedAssignee] = useState<number | "">("")
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskAssignee, setNewTaskAssignee] = useState<number | "">("")
    const [newTaskProject, setNewTaskProject] = useState<number | "">("")
    const [newTaskTeams, setNewTaskTeams] = useState<string[]>([])

    const [editedTeams, setEditedTeams] = useState<string[]>([])

    // Filter states
    const [selectedProject, setSelectedProject] = useState(initialProject || "all")
    const [selectedAssignee, setSelectedAssignee] = useState("all")

    const projectOptions = useMemo(() => projects, [projects])

    // Assignee list for New Task
    const dynamicAssignees = useMemo(() => members, [members])

    // Assignee list for Editing Task
    const dynamicEditedAssignees = useMemo(() => members, [members])


    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            // Tab filter
            const isCompleted = task.status === 'done'
            if (activeTab === "active" && isCompleted) return false
            if (activeTab === "completed" && !isCompleted) return false

            // Client filter from URL
            if (urlClientName) {
                const clientData = (task.project as any)?.client
                const clientNames: string[] = Array.isArray(clientData)
                    ? clientData.map((c: any) => c.name)
                    : [clientData?.name].filter(Boolean)

                const isMatch = clientNames.some(name => name.toLowerCase() === urlClientName.toLowerCase())
                console.log(`Task: ${task.name}, ClientNames: ${JSON.stringify(clientNames)}, Filter: ${urlClientName}, Match: ${isMatch}`)
                if (!isMatch) return false
            }

            // Dropdown filters
            if (selectedProject !== "all" && task.project?.name !== selectedProject) return false

            // Assignee filter needs careful matching since we use names in the UI but could use IDs
            const assigneeName = task.assignees?.[0]?.member?.user?.display_name ||
                `${task.assignees?.[0]?.member?.user?.first_name || ''} ${task.assignees?.[0]?.member?.user?.last_name || ''}`.trim()
            if (selectedAssignee !== "all" && assigneeName !== selectedAssignee) return false

            // Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = task.name.toLowerCase().includes(query)
                const matchesAssignee = assigneeName.toLowerCase().includes(query)
                if (!matchesTitle && !matchesAssignee) return false
            }
            return true
        })
    }, [tasks, activeTab, selectedProject, selectedAssignee, searchQuery, urlClientName])

    // Reset selection on filter change
    useEffect(() => {
        setRowSelection({})
    }, [activeTab, selectedProject, selectedAssignee, searchQuery])

    // Columns Definition
    const columns: ColumnDef<ITask>[] = useMemo(() => [
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
            accessorKey: "name",
            header: "Task",
            cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
        },
        {
            id: "assignee",
            header: "Assignee",
            cell: ({ row }) => {
                const primaryAssignee = row.original.assignees?.[0]
                const name = primaryAssignee?.member?.user?.display_name ||
                    `${primaryAssignee?.member?.user?.first_name || ''} ${primaryAssignee?.member?.user?.last_name || ''}`.trim() ||
                    "Unassigned"
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-gray-100 text-gray-700">
                                {initialsFromName(name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{name}</span>
                    </div>
                )
            },
        },
        {
            id: "project",
            header: "Project",
            cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.project?.name || "—"}</span>,
        },
        {
            id: "client",
            header: "Client",
            cell: ({ row }) => {
                const clientData = row.original.project?.client
                const clientName = Array.isArray(clientData)
                    ? clientData[0]?.name
                    : (clientData as any)?.name
                return <span className="text-muted-foreground text-sm">{clientName || "—"}</span>
            },
        },
        {
            accessorKey: "created_at",
            header: "Created",
            cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}</span>,
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
                                setEditedTitle(row.original.name)
                                setEditedAssignee(Number(row.original.assignees?.[0]?.organization_member_id) || "")
                                setEditedTeams([])
                            }}>
                                Edit task
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={async () => {
                                const newStatus = row.original.status === 'done' ? 'todo' : 'done'
                                const res = await updateTask(row.original.id.toString(), { status: newStatus })
                                if (res.success) {
                                    setTasks(prev => prev.map(t => t.id === row.original.id ? { ...t, status: newStatus } : t))
                                    toast.success(`Task ${newStatus === 'done' ? 'completed' : 'reopened'}`)
                                } else {
                                    toast.error(res.message)
                                }
                            }}>
                                {row.original.status === 'done' ? "Reopen task" : "Mark as complete"}
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
        <div className="flex flex-col gap-4 p-4 pt-0">
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
                    ACTIVE ({tasks.filter(t => t.status !== 'done').length})
                </button>
                <button
                    className={`pb-2 border-b-2 ${activeTab === "completed" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveTab("completed")}
                >
                    COMPLETED ({tasks.filter(t => t.status === 'done').length})
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
                                {projectOptions.map((project) => (
                                    <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedAssignee} onValueChange={(value) => setSelectedAssignee(value)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="All assignees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All assignees</SelectItem>
                                {members.map((member) => {
                                    const name = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.display_name || "Unknown"
                                    return (
                                        <SelectItem key={member.id} value={name}>{name}</SelectItem>
                                    )
                                })}
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
                                onSelect={async () => {
                                    const selectedRowIds = Object.keys(rowSelection).filter(k => rowSelection[k])
                                    const newStatus = activeTab === "active" ? "done" : "todo"

                                    const results = await Promise.all(selectedRowIds.map(id => updateTask(id, { status: newStatus })))
                                    const successCount = results.filter(r => r.success).length

                                    if (successCount > 0) {
                                        setTasks(prev => prev.map(t => selectedRowIds.includes(t.id.toString()) ? { ...t, status: newStatus } : t))
                                        toast.success(`Updated ${successCount} tasks`)
                                    } else {
                                        toast.error("Failed to update tasks")
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

                <Separator className="my-4" />

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={filteredTasks}
                    isLoading={isLoading}
                    showLoadingOverlay={false}
                    emptyState={
                        <div className="py-10 px-4 text-center text-sm text-muted-foreground">
                            {isLoading ? "Loading tasks..." : "No tasks found"}
                        </div>
                    }
                    rowSelection={rowSelection}
                    onRowSelectionChange={setRowSelection}
                    getRowKey={(row) => row.id.toString()} // Important for valid selection state by ID
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
                                    <Select value={newTaskAssignee.toString()} onValueChange={(val) => setNewTaskAssignee(Number(val))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dynamicAssignees.map((member) => {
                                                const name = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.display_name || "Unknown"
                                                return (
                                                    <SelectItem key={member.id} value={member.id.toString()}>
                                                        {name}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">PROJECT</div>
                                    <Select
                                        value={newTaskProject.toString()}
                                        onValueChange={(val) => setNewTaskProject(Number(val))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projectOptions.map((project) => (
                                                <SelectItem key={project.id} value={project.id.toString()}>
                                                    {project.name}
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
                            onClick={async () => {
                                if (newTaskTitle.trim() && newTaskProject) {
                                    const res = await createTask({
                                        name: newTaskTitle,
                                        project_id: Number(newTaskProject),
                                        status: "todo",
                                        priority: "medium"
                                    })
                                    if (res.success && res.data) {
                                        const createdTask = res.data;
                                        // Assign member if selected
                                        if (newTaskAssignee) {
                                            await assignTaskMember(createdTask.id, Number(newTaskAssignee))
                                        }

                                        // Refetch tasks to get updated list with assignees
                                        const tasksRes = await getTasks();
                                        if (tasksRes.success) setTasks(tasksRes.data);

                                        setNewTaskTitle("")
                                        setNewTaskAssignee("")
                                        setIsNewTaskDialogOpen(false)
                                        toast.success("Task created")
                                    } else {
                                        toast.error(res.message)
                                    }
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
                            Are you sure you want to delete{taskToDelete ? ` "${taskToDelete.name}"` : ""}?
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
                            onClick={async () => {
                                if (taskToDelete) {
                                    const res = await deleteTask(taskToDelete.id.toString())
                                    if (res.success) {
                                        setTasks(tasks.filter(task => task.id !== taskToDelete.id))
                                        toast.success("Task deleted")
                                    } else {
                                        toast.error(res.message)
                                    }
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
                                    <Select value={editedAssignee.toString()} onValueChange={(value) => setEditedAssignee(Number(value))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dynamicEditedAssignees.map((member) => {
                                                const name = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.display_name || "Unknown"
                                                return (
                                                    <SelectItem key={member.id} value={member.id.toString()}>
                                                        {name}
                                                    </SelectItem>
                                                )
                                            })}
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
                            onClick={async () => {
                                if (!editingTask) return
                                const res = await updateTask(editingTask.id.toString(), { name: editedTitle })
                                if (res.success) {
                                    // Update assignee if changed
                                    const currentAssigneeId = editingTask.assignees?.[0]?.organization_member_id
                                    if (editedAssignee && editedAssignee !== currentAssigneeId) {
                                        // Simplification: In a real app we might need to delete old assignee first or use a join table update action
                                        await assignTaskMember(editingTask.id, Number(editedAssignee))
                                    }

                                    const tasksRes = await getTasks();
                                    if (tasksRes.success) setTasks(tasksRes.data);

                                    setEditingTask(null)
                                    toast.success("Task updated")
                                } else {
                                    toast.error(res.message)
                                }
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
