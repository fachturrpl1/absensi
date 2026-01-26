export type Member = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type Project = {
  id: string
  name: string
  clientName?: string | null
  teams: string[]
  members: Member[]
  budgetLabel: string
  memberLimitLabel: string
  archived: boolean
}

export type NewProjectForm = {
  names: string
  billable: boolean
  disableActivity: boolean
  allowTracking: boolean
  disableIdle: boolean
  clientId: string | null
  members: string[]
  teams: string[]
}

export interface DuplicateProjectOptions {
  name: string
  keepTasks: boolean
  keepTasksAssignees: boolean
  keepTasksCompleted: boolean
  keepAllMembers: boolean
  keepBudget: boolean
  keepMemberLimits: boolean
  keepSameClient: boolean
}

export interface DuplicateProjectPayload extends DuplicateProjectOptions {
  sourceProjectId: string
}