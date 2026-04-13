"use client"

// app/projects/[id]/tasks/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth untuk:
//   • Server state  : tasks, members, taskStatuses
//   • Shared UI     : activeTab
//   • Mutations     : setTasks (optimistic), refreshTasks (server sync)
//   • Header        : New Task dialog + Tab switcher + View switcher
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useContext, createContext, use, useCallback, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, List, LayoutGrid, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { ITask, IOrganization_member, ITaskStatus } from "@/interface"
import { getTasksListPageData } from "@/action/projects/tasks/list"
import { createTask, getTasks, assignTaskMember } from "@/action/task"
import { toast } from "sonner"
import ManageTaskDialog from "@/components/project-management/tasks/dialogs/manage-task-dialog"
import { ActiveTab, CurrentView, TabCounts } from "@/types/tasks"

// ─── Context ──────────────────────────────────────────────────────────────────

interface TasksContextType {
    tasks: ITask[]
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    isLoading: boolean
    activeTab: ActiveTab
    setActiveTab: (tab: ActiveTab) => void
    setTasks: React.Dispatch<React.SetStateAction<ITask[]>>
    refreshTasks: () => Promise<void>
    projectId: string
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function useTasksContext() {
    const context = useContext(TasksContext)
    if (!context) throw new Error("useTasksContext must be used within TasksLayout")
    return context
}

// ─── Shared UI Components (internal) ──────────────────────────────────────────

function TasksViewSwitcher({
    currentView,
    projectId,
}: {
    currentView: CurrentView
    projectId: string
}) {
    const router = useRouter()
    const basePath = `/projects/${projectId}/tasks`

    const views = [
        { key: "list",     label: "List",     icon: List,         path: "list"     },
        { key: "board",    label: "Kanban",   icon: LayoutGrid,   path: "kanban"   },
        { key: "timeline", label: "Timeline", icon: CalendarDays, path: "timeline" },
    ] as const

    return (
        <div className="flex items-center p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            {views.map(({ key, label, icon: Icon, path }) => (
                <Button
                    key={key}
                    variant="ghost"
                    className={cn(
                        "h-8 gap-2 px-4 rounded-md transition-all text-sm",
                        currentView === key
                            ? "bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
                            : "text-muted-foreground hover:bg-muted",
                    )}
                    onClick={() => router.push(`${basePath}/${path}`)}
                >
                    <Icon
                        className={cn("h-4 w-4",
                            currentView === key ? "" : "text-muted-foreground"
                        )} />
                    <span className="font-semibold text-xs uppercase tracking-tight">{label}</span>
                </Button>
            ))}
        </div>
    )
}

// ─── Layout Header (internal) ─────────────────────────────────────────────────

function LayoutHeader({
    projectId, currentView, activeTab, onTabChange,
    tabCounts, members, taskStatuses, onCreateTask,
}: {
    projectId: string
    currentView: CurrentView
    activeTab: ActiveTab
    onTabChange: (tab: ActiveTab) => void
    tabCounts: TabCounts
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    onCreateTask: (fd: FormData) => Promise<void>
}) {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Top bar */}
            <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Task
                </Button>
                <TasksViewSwitcher currentView={currentView} projectId={projectId} />
            </div>

            {/* Tabs — shared across list / kanban / timeline */}
            <div className="flex items-center gap-6 text-sm border-b">
                {(["active", "completed", "archived", "all"] as ActiveTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            "pb-2 border-b-2 -mb-px transition-colors uppercase font-medium text-xs tracking-wide",
                            activeTab === tab
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {tab} ({tabCounts[tab]})
                    </button>
                ))}
            </div>

            <ManageTaskDialog
                mode="add"
                open={open}
                onOpenChange={setOpen}
                task={null}
                members={members}
                taskStatuses={taskStatuses}
                onSave={onCreateTask}
            />
        </>
    )
}

// ─── TasksLayout (default export) ─────────────────────────────────────────────

export default function TasksLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id: projectId } = use(params)
    const pathname = usePathname()

    // currentView: derived dari pathname, tidak perlu state
    const currentView: CurrentView = pathname.endsWith("/kanban")
        ? "board"
        : pathname.endsWith("/timeline")
            ? "timeline"
            : "list"

    // ── Server state ───────────────────────────────────────────────────────────
    const [tasks, setTasks] = useState<ITask[]>([])
    const [members, setMembers] = useState<IOrganization_member[]>([])
    const [taskStatuses, setTaskStatuses] = useState<ITaskStatus[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ── Shared UI state ────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<ActiveTab>("active")

    // ── Initial fetch — 1 round-trip, re-run hanya saat projectId berubah ─────
    useEffect(() => {
        setIsLoading(true)
        getTasksListPageData(projectId)
            .then(({ tasks, members, taskStatuses }) => {
                setTasks(tasks)
                setMembers(members)
                setTaskStatuses(taskStatuses)
            })
            .finally(() => setIsLoading(false))
    }, [projectId])

    // ── refreshTasks — server sync, pakai sparingly ────────────────────────────
    const refreshTasks = useCallback(async () => {
        const res = await getTasks(projectId)
        if (res.success) setTasks(res.data)
    }, [projectId])

    // ── Derived tab counts ─────────────────────────────────────────────────────
    const tabCounts: TabCounts = useMemo(() => {
        const counts = { all: 0, active: 0, completed: 0, archived: 0 }
        tasks.forEach(t => {
            counts.all++
            if (t.is_archived) {
                counts.archived++
            } else if (t.task_status?.code === "done") {
                counts.completed++
            } else {
                counts.active++
            }
        })
        return counts
    }, [tasks])

    // ── handleCreateTask — setelah create, server sync (id tidak diketahui) ────
    const handleCreateTask = useCallback(async (fd: FormData) => {
        fd.append("project_id", projectId)
        const assigneeId = fd.get("assignee_id")
        fd.delete("assignee_id")

        const res = await createTask(fd)
        if (res.success && res.data) {
            if (assigneeId && assigneeId !== "none") {
                await assignTaskMember(res.data.id, Number(assigneeId))
            }
            await refreshTasks()
            toast.success("Task created")
        } else {
            toast.error(res.message || "Failed to create task")
        }
    }, [projectId, refreshTasks])

    return (
        <TasksContext.Provider value={{
            tasks, members, taskStatuses, isLoading,
            activeTab, setActiveTab, setTasks, refreshTasks, projectId,
        }}>
            <div className="flex flex-col gap-6">
                <LayoutHeader
                    projectId={projectId}
                    currentView={currentView}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabCounts={tabCounts}
                    members={members}
                    taskStatuses={taskStatuses}
                    onCreateTask={handleCreateTask}
                />
                <main>{children}</main>
            </div>
        </TasksContext.Provider>
    )
}
