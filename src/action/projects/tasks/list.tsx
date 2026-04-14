"use server"

import { getTasks, getTaskStatuses } from "@/action/task"
import { getAllOrganization_member } from "@/action/members"
import { getTeams } from "@/action/teams"
import { ITask, IOrganization_member, ITaskStatus, ITeams } from "@/interface"

interface TasksListPageData {
    tasks: ITask[]
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    teams: ITeams[]
}

export async function getTasksListPageData(projectId: string | number): Promise<TasksListPageData> {
    const [tasksRes, membersRes, statusesRes, teamsRes] = await Promise.all([
        getTasks(projectId),
        getAllOrganization_member(),
        getTaskStatuses(),
        getTeams()
    ])

    return {
        tasks: tasksRes.success ? tasksRes.data : [],
        members: membersRes.success ? membersRes.data : [],
        taskStatuses: statusesRes.success ? statusesRes.data : [],
        teams: teamsRes.success ? teamsRes.data : [],
    }
}
