"use client"

import { useMemo, useState } from "react"
import { ITask } from "@/interface"
import { useTasksContext } from "../layout"
import { StackedAssignees, PriorityBadge } from "@/components/project-management/tasks/header"
import ManageTaskDialog from "@/components/project-management/tasks/list/dialogs"
import { updateTask } from "@/action/task"
import { toast } from "sonner"

export default function KanbanPage() {
    const {
        tasks, members, taskStatuses, teams,
        isLoading, activeTab,
        refreshTasks
    } = useTasksContext()

    const [editingTask, setEditingTask] = useState<ITask | null>(null)

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const isDone = task.task_status?.code === "done"
            const isArchived = task.is_archived

            if (activeTab === "archived") {
                if (!isArchived) return false
            } else {
                if (isArchived) return false
                if (activeTab === "active" && isDone) return false
            }
            return true
        })
    }, [tasks, activeTab])

    const sortedTasksByStatus = useMemo(() => {
        const map = new Map<number, ITask[]>()
        filteredTasks.forEach(task => {
            if (!map.has(task.status_id)) map.set(task.status_id, [])
            map.get(task.status_id)!.push(task)
        })
        return taskStatuses.map(status => ({
            ...status,
            tasks: (map.get(status.id) || []).sort((a, b) => (a.position_in_column || 0) - (b.position_in_column || 0)),
        }))
    }, [filteredTasks, taskStatuses])

    const handleUpdate = async (fd: FormData) => {
        if (!editingTask) return
        const res = await updateTask(fd)
        if (res.success) {
            await refreshTasks()
            setEditingTask(null)
            toast.success("Task updated")
        } else {
            toast.error(res.message || "Failed to update task")
        }
    }

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
            {sortedTasksByStatus.map(status => (
                <div key={status.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                    <div
                        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center justify-between border-t-4"
                        style={{ borderTopColor: status.color || "#e5e7eb" }}
                    >
                        <h3 className="font-semibold text-sm text-gray-900">{status.name}</h3>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {status.tasks.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-3 min-h-[500px] p-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading...</div>
                        ) : status.tasks.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No tasks</div>
                        ) : (
                            status.tasks.map((task: ITask) => (
                                <div
                                    key={task.id}
                                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                                    onClick={() => setEditingTask(task)}
                                >
                                    <h4 className="font-medium text-sm text-gray-900 leading-snug">{task.name}</h4>
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center gap-2">
                                            <PriorityBadge priority={task.priority} />
                                        </div>
                                        <StackedAssignees assignees={task.assignees || []} max={3} size={6} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ))}

            <ManageTaskDialog
                mode="edit"
                open={!!editingTask}
                onOpenChange={v => !v && setEditingTask(null)}
                task={editingTask}
                members={members}
                taskStatuses={taskStatuses}
                teams={teams}
                onSave={handleUpdate}
            />
        </div>
    )
}