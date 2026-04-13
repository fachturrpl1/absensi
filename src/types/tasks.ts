import React from "react"
import { ITask, IProject, IOrganization_member, ITaskStatus } from "@/interface"

// ─── View & Tab ───────────────────────────────────────────────────────────────

export type CurrentView = "list" | "board" | "timeline"
export type ActiveTab = "active" | "completed" | "archived" | "all"

// ─── Task Tree ────────────────────────────────────────────────────────────────

export type TaskNode = ITask & { children: TaskNode[] }

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface TabCounts {
    active: number
    completed: number
    archived: number
    all: number
}

export interface TasksLayoutData {
    tasks: ITask[]
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface TaskFilters {
    activeTab: ActiveTab
    searchQuery: string
    selectedProject: string
    selectedAssignee: string
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ListPaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    isLoading: boolean
    taskTreeLength: number
    pageSize: number
    onPageSizeChange: (size: number) => void
}

// ─── Dialog Props ─────────────────────────────────────────────────────────────

export interface ListDialogsProps {
    isNewTaskDialogOpen: boolean
    setIsNewTaskDialogOpen: (open: boolean) => void
    newTaskTitle: string
    setNewTaskTitle: (v: string) => void
    newTaskProject: number
    setNewTaskProject: (v: number) => void
    newTaskAssignee: number
    setNewTaskAssignee: (v: number) => void
    newTaskStatus: number
    setNewTaskStatus: (v: number) => void
    projects: IProject[]
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    setTasks: React.Dispatch<React.SetStateAction<ITask[]>>
    taskToDelete: ITask | null
    setTaskToDelete: (task: ITask | null) => void
    editingTask: ITask | null
    setEditingTask: (task: ITask | null) => void
    editedTitle: string
    setEditedTitle: (v: string) => void
    editedStatus: number
    setEditedStatus: (v: number) => void
    editedAssignee: number
    setEditedAssignee: (v: number) => void
}