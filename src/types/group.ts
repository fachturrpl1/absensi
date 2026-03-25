import { IOrganization_member } from "../interface"

export interface IGroup {
    id: string
    name: string | null
    code: string
    organization_id: string
    created_at: string
    updated_at: string
}

export interface GroupStats {
    totalMembers: number
    todayPresent: number
    todayAbsent: number
    activeMembers: number
}

export interface MemberSearchFields {
    id: string
    email: string | null
    user?: { email: string | null } | null
    employee_id: string | null
    positions: { title: string }[] | { title: string } | null
    role?: { name: string } | null
}

export type SearchableMember = IOrganization_member & MemberSearchFields

export interface MembersApiPage {
    success: boolean
    data: IOrganization_member[]
    pagination: {
        cursor: string | null
        limit: number
        hasMore: boolean
        total: number
    }
}
