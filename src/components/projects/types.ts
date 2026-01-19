export type Member = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type Project = {
  id: string
  name: string
  teams: string[]
  members: Member[]
  todosLabel: string
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
  // Catatan: field members/teams dapat ditambah saat integrasi
}