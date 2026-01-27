// Consolidated Dummy Data
import * as LucideIcons from 'lucide-react'

// ============================================================================
// CLIENTS
// ============================================================================

export interface Client {
    id: string
    name: string
    budget: string
    autoInvoicing: boolean
    isArchived: boolean
    address?: string
    phone?: string
    emails?: string[]
    website?: string
    createdAt: string
}

// ===== PROJECT TASKS (DUMMY) =====
export type TaskStatus = "todo" | "in_progress" | "done"

export interface ProjectTask {
    id: string
    title: string
    projectId: string
    assigneeId: string
    status: TaskStatus
}

export const DUMMY_PROJECT_TASKS: ProjectTask[] = [
    { id: "t-1", title: "Setup repository", projectId: "proj-1", assigneeId: "m1", status: "done" },
    { id: "t-2", title: "Create design system", projectId: "proj-1", assigneeId: "m2", status: "in_progress" },
    { id: "t-3", title: "Landing page hero", projectId: "proj-1", assigneeId: "m3", status: "todo" },
    { id: "t-4", title: "API contracts", projectId: "proj-2", assigneeId: "m4", status: "in_progress" },
    { id: "t-5", title: "Auth flow", projectId: "proj-2", assigneeId: "m5", status: "todo" },
    { id: "t-6", title: "Campaign brief", projectId: "proj-3", assigneeId: "m1", status: "done" },
    { id: "t-7", title: "Asset preparation", projectId: "proj-3", assigneeId: "m5", status: "in_progress" },
    { id: "t-8", title: "Legacy audit", projectId: "proj-4", assigneeId: "m2", status: "in_progress" },
    { id: "t-9", title: "Data migration", projectId: "proj-5", assigneeId: "m3", status: "todo" },
    { id: "t-10", title: "Performance profiling", projectId: "proj-5", assigneeId: "m4", status: "done" },
    { id: "t-11", title: "Accessibility fixes", projectId: "proj-5", assigneeId: "m3", status: "in_progress" },
]

export function getTasksByProjectMembers(projectId: string): ProjectTask[] {
    const memberIds = PROJECT_MEMBER_MAP[projectId] ?? []
    return DUMMY_PROJECT_TASKS.filter(
        (t) => t.projectId === projectId && memberIds.includes(t.assigneeId)
    )
}

export function getTaskCountByProjectMembers(projectId: string): number {
    return getTasksByProjectMembers(projectId).length
}

// Hitung jumlah tasks dari halaman Tasks (berdasarkan nama project)
export function getTaskCountFromTasksPageByProjectName(projectName: string): number {
    return DUMMY_TASKS.filter((t) => t.project === projectName).length
}

// Versi by projectId: map id -> nama project, lalu gunakan helper di atas
export function getTaskCountFromTasksPageByProjectId(projectId: string): number {
    const p = DUMMY_PROJECTS.find((x) => x.id === projectId)
    if (!p) return 0
    return getTaskCountFromTasksPageByProjectName(p.name)
}

// Members assigned per project (dummy)
export const PROJECT_MEMBER_MAP: Record<string, string[]> = {
    "proj-1": ["m1", "m2", "m3"],
    "proj-2": ["m4", "m5"],
    "proj-3": ["m1", "m5"],
    "proj-4": ["m2"],
    "proj-5": ["m3", "m4"],
}

export function getProjectMemberIds(projectId: string): string[] {
    return PROJECT_MEMBER_MAP[projectId] ?? []
}

// Teams by project (derived from project members)
// Explicit mapping: project -> team IDs
export const PROJECT_TEAM_MAP: Record<string, string[]> = {
    "proj-1": ["t1"], // Website Redesign -> Team Alpha
    "proj-2": ["t3"], // Mobile App Development -> Team Gamma
    "proj-3": ["t2"], // Marketing Campaign -> Team Beta
    // Tambahkan mapping lain jika diperlukan
}

export function getTeamsByProjectId(projectId: string): Team[] {
    const explicitTeamIds = PROJECT_TEAM_MAP[projectId]
    if (explicitTeamIds && explicitTeamIds.length > 0) {
        const idSet = new Set(explicitTeamIds)
        return DUMMY_TEAMS.filter((t) => idSet.has(t.id))
    }

    // Fallback: turunkan dari irisan member (legacy behavior)
    const memberIds = PROJECT_MEMBER_MAP[projectId] ?? []
    const result: Team[] = []
    const seen = new Set<string>()
    for (const t of DUMMY_TEAMS) {
        if (t.members.some((m) => memberIds.includes(m)) && !seen.has(t.id)) {
            seen.add(t.id)
            result.push(t)
        }
    }
    return result
}

export function getTeamNamesByProjectId(projectId: string): string[] {
    return getTeamsByProjectId(projectId).map((t) => t.name)
}

// ============================================================================
// CLIENT-PROJECT-TASK INTEGRATION HELPERS
// ============================================================================

// Get all projects linked to a specific client
export function getProjectsByClientId(clientId: string): Project[] {
    return DUMMY_PROJECTS.filter((p) => p.clientId === clientId)
}

// Get project count for a client
export function getProjectCountByClientId(clientId: string): number {
    return getProjectsByClientId(clientId).length
}

// Get all tasks for a client (via their projects)
export function getTasksByClientId(clientId: string): TaskItem[] {
    const clientProjects = getProjectsByClientId(clientId)
    const projectNames = clientProjects.map((p) => p.name)
    return DUMMY_TASKS.filter((t) => projectNames.includes(t.project))
}

// Get task count for a client
export function getTaskCountByClientId(clientId: string): number {
    return getTasksByClientId(clientId).length
}

// Get client by project ID
export function getClientByProjectId(projectId: string): Client | null {
    const project = DUMMY_PROJECTS.find((p) => p.id === projectId)
    if (!project || !project.clientId) return null
    return DUMMY_CLIENTS.find((c) => c.id === project.clientId) ?? null
}

// Get client name by project name (for Tasks page)
export function getClientNameByProjectName(projectName: string): string | null {
    const project = DUMMY_PROJECTS.find((p) => p.name === projectName)
    if (!project || !project.clientName) return null
    return project.clientName
}

export const DUMMY_CLIENTS: Client[] = [
    {
        id: "client-1",
        name: "Patricia",
        budget: "Budget: none",
        autoInvoicing: false,
        isArchived: false,
        address: "123 Main St, Jakarta",
        phone: "+62 812-3456-7890",
        emails: ["patricia@example.com"],
        website: "https://patricia.com",
        createdAt: "2025-01-05"
    },
    {
        id: "client-2",
        name: "Tech Corp",
        budget: "Budget: $50,000/month",
        autoInvoicing: true,
        isArchived: false,
        address: "456 Technology Blvd, Surabaya",
        phone: "+62 821-9876-5432",
        emails: ["contact@techcorp.com", "billing@techcorp.com"],
        website: "https://techcorp.co.id",
        createdAt: "2025-01-10"
    },
    {
        id: "client-3",
        name: "Creative Agency",
        budget: "Budget: $15,000/month",
        autoInvoicing: false,
        isArchived: false,
        address: "789 Design Ave, Bandung",
        phone: "+62 813-5555-6666",
        emails: ["hello@creativeagency.com"],
        website: "https://creativeagency.studio",
        createdAt: "2025-01-12"
    },
    {
        id: "client-4",
        name: "Startup Inc",
        budget: "Budget: $5,000/month",
        autoInvoicing: true,
        isArchived: false,
        address: "321 Innovation Street, Bali",
        phone: "+62 814-7777-8888",
        emails: ["team@startup.inc"],
        createdAt: "2025-01-18"
    },
    {
        id: "client-5",
        name: "Old Client Ltd",
        budget: "Budget: none",
        autoInvoicing: false,
        isArchived: true,
        address: "999 Legacy Road, Yogyakarta",
        phone: "+62 815-1111-2222",
        emails: ["info@oldclient.com"],
        createdAt: "2024-11-20"
    }
]

// ============================================================================
// PROJECTS
// ============================================================================

export interface Project {
    id: string
    name: string
    clientId: string | null
    clientName: string | null
    billable: boolean
    disableActivity: boolean
    allowTracking: boolean
    disableIdle: boolean
    archived: boolean
    color: string
    budgetLabel: string
    memberLimitLabel: string
    todosLabel: string
    createdAt: string
}

export const DUMMY_PROJECTS: Project[] = [
    {
        id: "proj-1",
        name: "Website Redesign",
        clientId: "client-1",
        clientName: "Patricia",
        billable: true,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: false,
        color: "#3B82F6",
        budgetLabel: "$10,000",
        memberLimitLabel: "5 members",
        todosLabel: "12 tasks",
        createdAt: "2025-01-10"
    },
    {
        id: "proj-2",
        name: "Mobile App Development",
        clientId: "client-2",
        clientName: "Tech Corp",
        billable: true,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: false,
        color: "#10B981",
        budgetLabel: "$25,000",
        memberLimitLabel: "8 members",
        todosLabel: "24 tasks",
        createdAt: "2025-01-05"
    },
    {
        id: "proj-3",
        name: "Marketing Campaign",
        clientId: "client-1",
        clientName: "Patricia",
        billable: false,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: false,
        color: "#F59E0B",
        budgetLabel: "No budget",
        memberLimitLabel: "3 members",
        todosLabel: "8 tasks",
        createdAt: "2025-01-15"
    },
    {
        id: "proj-4",
        name: "Old Website",
        clientId: null,
        clientName: null,
        billable: true,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: true,
        color: "#6B7280",
        budgetLabel: "$5,000",
        memberLimitLabel: "2 members",
        todosLabel: "0 tasks",
        createdAt: "2024-12-01"
    },
    {
        id: "proj-5",
        name: "Legacy System",
        clientId: "client-3",
        clientName: "Old Client",
        billable: false,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        archived: true,
        color: "#6B7280",
        budgetLabel: "No budget",
        memberLimitLabel: "1 member",
        todosLabel: "0 tasks",
        createdAt: "2024-11-15"
    }
]

// ============================================================================
// GLOBAL TASKS
// ============================================================================

export const DUMMY_GLOBAL_TASKS = [
    { id: "global-1", title: "Monthly Report" },
    { id: "global-2", title: "Weekly Sync" },
    { id: "global-3", title: "Client Feedback" },
    { id: "global-4", title: "Security Audit" },
]

// ============================================================================
// TASKS
// ============================================================================

export interface TaskItem {
    id: string
    title: string
    assignee: string
    type: string
    created: string
    project: string
    status: "task" | "todo" | "in_progress"
    completed: boolean
}

export const DUMMY_TASKS: TaskItem[] = [
    {
        id: "task-1",
        title: "Design Homepage Concept",
        assignee: "Antonio Galih",
        type: "Task",
        created: "Mon, Jan 19, 2026 9:16 am",
        project: "Website Redesign",
        status: "task",
        completed: false
    },
    {
        id: "task-2",
        title: "User Research Summary",
        assignee: "Sarah Johnson",
        type: "Task",
        created: "Mon, Jan 19, 2026 10:30 am",
        project: "Marketing Campaign",
        status: "task",
        completed: true
    },
    {
        id: "task-3",
        title: "Prototype Mobile Flow",
        assignee: "Lave Lavael",
        type: "Task",
        created: "Mon, Jan 19, 2026 1:15 pm",
        project: "Mobile App Development",
        status: "in_progress",
        completed: false
    },
    {
        id: "task-4",
        title: "Setup Analytics",
        assignee: "Michael Chen",
        type: "Task",
        created: "Tue, Jan 20, 2026 9:05 am",
        project: "Mobile App Development",
        status: "task",
        completed: false
    },
    {
        id: "task-5",
        title: "Review Sprint Backlog",
        assignee: "Emma Rodriguez",
        type: "Task",
        created: "Tue, Jan 20, 2026 11:45 am",
        project: "Marketing Campaign",
        status: "todo",
        completed: true
    },
    {
        id: "task-6",
        title: "QA Regression Testing",
        assignee: "Antonio Galih",
        type: "Task",
        created: "Wed, Jan 21, 2026 8:30 am",
        project: "Website Redesign",
        status: "task",
        completed: false
    }
]

// ============================================================================
// INSIGHTS - MEMBERS & TEAMS
// ============================================================================

export interface Member {
    id: string
    name: string
    email: string
    avatar?: string
    activityScore: number
}

export interface Team {
    id: string
    name: string
    engagement: number
    memberCount: number
    members: string[] // member IDs
}

export const DUMMY_MEMBERS: Member[] = [
    {
        id: "m1",
        name: "Antonio Galih",
        email: "antonio@example.com",
        activityScore: 85,
        avatar: "https://i.pravatar.cc/150?u=m1"
    },
    {
        id: "m2",
        name: "Lave Lavael",
        email: "lave@example.com",
        activityScore: 92,
        avatar: "https://i.pravatar.cc/150?u=m2"
    },
    {
        id: "m3",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        activityScore: 78,
        avatar: "https://i.pravatar.cc/150?u=m3"
    },
    {
        id: "m4",
        name: "Michael Chen",
        email: "michael@example.com",
        activityScore: 88,
        avatar: "https://i.pravatar.cc/150?u=m4"
    },
    {
        id: "m5",
        name: "Emma Rodriguez",
        email: "emma@example.com",
        activityScore: 95,
        avatar: "https://i.pravatar.cc/150?u=m5"
    }
]

export const DUMMY_TEAMS: Team[] = [
    {
        id: "t1",
        name: "Team Alpha",
        engagement: 87,
        memberCount: 3,
        members: ["m1", "m2", "m3"]
    },
    {
        id: "t2",
        name: "Team Beta",
        engagement: 92,
        memberCount: 2,
        members: ["m4", "m5"]
    },
    {
        id: "t3",
        name: "Team Gamma",
        engagement: 75,
        memberCount: 4,
        members: ["m1", "m3", "m4", "m5"]
    }
]

export const DUMMY_ROLES = [
    { id: 'admin', name: 'Administrator' },
    { id: 'manager', name: 'Manager' },
    { id: 'lead', name: 'Team Lead' },
    { id: 'hr', name: 'Human Resources' },
    { id: 'employee', name: 'Employee' },
];

export const DUMMY_JOB_TYPES = [
    { id: 'full-time', name: 'Full-time' },
    { id: 'part-time', name: 'Part-time' },
    { id: 'contractor', name: 'Contractor' },
    { id: 'intern', name: 'Intern' },
];

// ============================================================================
// UNUSUAL ACTIVITY
// ============================================================================

export interface UnusualActivityEntry {
    id: string
    memberId: string
    memberName: string
    timestamp: string
    date: string
    severity: 'highly_unusual' | 'unusual' | 'slightly_unusual'
    activityType: string
    description: string
    duration: number // in minutes
    details: {
        expectedRange?: string
        actualValue?: string
        deviation?: string
    }
}

export const DUMMY_UNUSUAL_ACTIVITIES: UnusualActivityEntry[] = [
    // Antonio Galih (m1) - Highly Unusual
    {
        id: 'ua1',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        timestamp: '2026-01-19T22:30:00',
        date: '2026-01-19',
        severity: 'highly_unusual',
        activityType: 'Late Night Activity',
        description: 'Working significantly outside normal hours',
        duration: 180,
        details: {
            expectedRange: '9:00 AM - 6:00 PM',
            actualValue: '10:30 PM - 1:30 AM',
            deviation: '+470%'
        }
    },
    {
        id: 'ua2',
        memberId: 'm1',
        memberName: 'Antonio Galih',
        timestamp: '2026-01-18T23:00:00',
        date: '2026-01-18',
        severity: 'highly_unusual',
        activityType: 'Weekend Work',
        description: 'Unusual weekend activity detected',
        duration: 240,
        details: {
            expectedRange: 'No weekend work',
            actualValue: '11:00 PM - 3:00 AM',
            deviation: 'Weekend activity'
        }
    },
    // Lave Lavael (m2) - Unusual
    {
        id: 'ua3',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        timestamp: '2026-01-19T20:00:00',
        date: '2026-01-19',
        severity: 'unusual',
        activityType: 'Excessive App Switching',
        description: 'Switching between apps more frequently than usual',
        duration: 120,
        details: {
            expectedRange: '10-15 switches/hour',
            actualValue: '45 switches/hour',
            deviation: '+200%'
        }
    },
    {
        id: 'ua4',
        memberId: 'm2',
        memberName: 'Lave Lavael',
        timestamp: '2026-01-17T19:30:00',
        date: '2026-01-17',
        severity: 'unusual',
        activityType: 'Long Idle Period',
        description: 'Extended period of inactivity during work hours',
        duration: 90,
        details: {
            expectedRange: '< 15 minutes',
            actualValue: '90 minutes',
            deviation: '+500%'
        }
    },
    // Sarah Johnson (m3) - Slightly Unusual
    {
        id: 'ua5',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        timestamp: '2026-01-19T18:30:00',
        date: '2026-01-19',
        severity: 'slightly_unusual',
        activityType: 'Extended Work Hours',
        description: 'Working slightly beyond normal hours',
        duration: 60,
        details: {
            expectedRange: '8 hours',
            actualValue: '9.5 hours',
            deviation: '+18%'
        }
    },
    {
        id: 'ua6',
        memberId: 'm3',
        memberName: 'Sarah Johnson',
        timestamp: '2026-01-16T17:00:00',
        date: '2026-01-16',
        severity: 'slightly_unusual',
        activityType: 'Unusual App Usage',
        description: 'Using applications not typically accessed',
        duration: 45,
        details: {
            expectedRange: 'Design tools',
            actualValue: 'Database management tools',
            deviation: 'Different tools'
        }
    },
    // Michael Chen (m4) - Unusual
    {
        id: 'ua7',
        memberId: 'm4',
        memberName: 'Michael Chen',
        timestamp: '2026-01-18T21:00:00',
        date: '2026-01-18',
        severity: 'unusual',
        activityType: 'After Hours Burst',
        description: 'Intense activity after normal work hours',
        duration: 150,
        details: {
            expectedRange: 'Inactive after 6 PM',
            actualValue: '9:00 PM - 11:30 PM',
            deviation: 'After hours activity'
        }
    },
    // Emma Rodriguez (m5) - Slightly Unusual
    {
        id: 'ua8',
        memberId: 'm5',
        memberName: 'Emma Rodriguez',
        timestamp: '2026-01-19T12:00:00',
        date: '2026-01-19',
        severity: 'slightly_unusual',
        activityType: 'Low Productivity Period',
        description: 'Lower than average productivity during peak hours',
        duration: 120,
        details: {
            expectedRange: '75-85% productive',
            actualValue: '55% productive',
            deviation: '-30%'
        }
    },
    {
        id: 'ua9',
        memberId: 'm5',
        memberName: 'Emma Rodriguez',
        timestamp: '2026-01-15T16:00:00',
        date: '2026-01-15',
        severity: 'slightly_unusual',
        activityType: 'Unusual Meeting Pattern',
        description: 'More meetings than usual',
        duration: 180,
        details: {
            expectedRange: '2-3 meetings/day',
            actualValue: '7 meetings/day',
            deviation: '+230%'
        }
    }
]

export function getUnusualActivitiesByMember(memberId: string) {
    return DUMMY_UNUSUAL_ACTIVITIES.filter(activity => activity.memberId === memberId)
}

export function getUnusualActivitiesByDateRange(startDate: Date, endDate: Date) {
    return DUMMY_UNUSUAL_ACTIVITIES.filter(activity => {
        const activityDate = new Date(activity.date)
        return activityDate >= startDate && activityDate <= endDate
    })
}

export function getUnusualActivitiesBySeverity(severity: 'highly_unusual' | 'unusual' | 'slightly_unusual') {
    return DUMMY_UNUSUAL_ACTIVITIES.filter(activity => activity.severity === severity)
}

export function getActivityStats(activities: UnusualActivityEntry[]) {
    const uniqueMembers = new Set(activities.map(a => a.memberId))
    const totalTime = activities.reduce((sum, a) => sum + a.duration, 0)

    return {
        memberCount: uniqueMembers.size,
        instanceCount: activities.length,
        totalTime: totalTime, // in minutes
        bySeverity: {
            highly_unusual: activities.filter(a => a.severity === 'highly_unusual').length,
            unusual: activities.filter(a => a.severity === 'unusual').length,
            slightly_unusual: activities.filter(a => a.severity === 'slightly_unusual').length,
        }
    }
}

// ============================================================================
// SMART NOTIFICATIONS
// ============================================================================

export interface SmartNotification {
    id: string
    memberId: string
    memberName: string
    type: "late_start" | "early_end" | "low_activity" | "unusual_pattern"
    message: string
    timestamp: string
    severity: "low" | "medium" | "high"
}

export interface BehaviorChange {
    memberId: string
    memberName: string
    changeType: "productivity_increase" | "productivity_decrease" | "schedule_shift" | "pattern_change"
    description: string
    previousValue: number
    currentValue: number
    changePercent: number
    detectedAt: string
}

export const DUMMY_SMART_NOTIFICATIONS: SmartNotification[] = [
    {
        id: "n1",
        memberId: "m2",
        memberName: "Lave Lavael",
        type: "late_start",
        message: "Started work 2 hours later than usual",
        timestamp: "2026-01-19T11:00:00Z",
        severity: "medium"
    },
    {
        id: "n2",
        memberId: "m4",
        memberName: "Michael Chen",
        type: "low_activity",
        message: "Activity level 40% below normal",
        timestamp: "2026-01-18T15:30:00Z",
        severity: "high"
    }
]

export const DUMMY_BEHAVIOR_CHANGES: BehaviorChange[] = [
    {
        memberId: "m5",
        memberName: "Emma Rodriguez",
        changeType: "productivity_increase",
        description: "Productivity increased significantly over the past week",
        previousValue: 75,
        currentValue: 95,
        changePercent: 26.7,
        detectedAt: "2026-01-19"
    },
    {
        memberId: "m3",
        memberName: "Sarah Johnson",
        changeType: "schedule_shift",
        description: "Working hours shifted 2 hours earlier than usual pattern",
        previousValue: 9, // usual start hour
        currentValue: 7, // new start hour
        changePercent: -22.2,
        detectedAt: "2026-01-18"
    }
]

export interface NotificationTemplate {
    id: string
    name: string
    description: string
    frequency: 'hourly' | 'daily' | 'weekly'
    delivery: ('email' | 'insights' | 'slack')[]
    iconName: keyof typeof LucideIcons
    color: string
    metric: string
    condition: string
    value: number
    unit: string
}

export interface Notification {
    id: string
    name: string
    enabled: boolean
    createdBy: string
    createdByAvatar: string
    target: string
    frequency: 'hourly' | 'daily' | 'weekly'
    notifyVia: string[]
    metric: string
    condition: string
    value: number
    unit: string
    monitoredAudience: {
        type: 'members' | 'teams' | 'jobTypes'
        all: boolean
        ids: string[]
    }
    recipients: {
        type: 'roles' | 'members'
        ids: string[]
    }
    deliveryChannels: {
        highlights: boolean
        email: boolean
        slack: boolean
    }
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
    {
        id: 'tmpl-1',
        name: 'Suspiciously high activity',
        description: 'Average hourly activity levels exceed 90%',
        frequency: 'hourly',
        delivery: ['email'],
        iconName: 'TrendingUp',
        color: 'bg-zinc-100',
        metric: 'Activity rate',
        condition: 'above',
        value: 90,
        unit: '%'
    },
    {
        id: 'tmpl-2',
        name: 'Members overworking',
        description: 'Average daily work time exceeds 9.5 hours per week',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Clock',
        color: 'bg-zinc-100',
        metric: 'Daily work time',
        condition: 'above',
        value: 9.5,
        unit: 'hr/day'
    },
    {
        id: 'tmpl-3',
        name: 'Members underworking',
        description: 'Average daily work time falls below 5 hours',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'TrendingDown',
        color: 'bg-zinc-100',
        metric: 'Daily work time',
        condition: 'below',
        value: 5,
        unit: 'hr/day'
    },
    {
        id: 'tmpl-4',
        name: 'Members with low activity level',
        description: 'Average weekly activity levels under 35%',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'BarChart3',
        color: 'bg-zinc-100',
        metric: 'Activity rate',
        condition: 'below',
        value: 35,
        unit: '%'
    },
    {
        id: 'tmpl-5',
        name: 'Members with low core work',
        description: 'Average weekly core work under 25%',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Briefcase',
        color: 'bg-zinc-100',
        metric: 'Core work percentage',
        condition: 'below',
        value: 25,
        unit: '%'
    },
    {
        id: 'tmpl-6',
        name: 'Members with unproductive work time',
        description: 'Average daily unproductive work time exceeds 10% of all work time',
        frequency: 'daily',
        delivery: ['email'],
        iconName: 'AlertTriangle',
        color: 'bg-zinc-100',
        metric: 'Unproductive time',
        condition: 'above',
        value: 10,
        unit: '%'
    },
    {
        id: 'tmpl-7',
        name: 'Members using social media websites',
        description: 'Members spend over 30 minutes per day on social media websites',
        frequency: 'daily',
        delivery: ['email'],
        iconName: 'Share2',
        color: 'bg-zinc-100',
        metric: 'Social media time',
        condition: 'above',
        value: 30,
        unit: 'min/day'
    },
    {
        id: 'tmpl-8',
        name: 'Members not using required applications',
        description: 'Members spend under 30 mins per week on applications they are required to use',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Package',
        color: 'bg-zinc-100',
        metric: 'Required apps time',
        condition: 'below',
        value: 30,
        unit: 'min/week'
    },
    {
        id: 'tmpl-9',
        name: 'Members using AI websites',
        description: 'Members spend over 20 minutes per day on GPT chatbot websites',
        frequency: 'daily',
        delivery: ['email'],
        iconName: 'Bot',
        color: 'bg-zinc-100',
        metric: 'AI tools time',
        condition: 'above',
        value: 20,
        unit: 'min/day'
    },
    {
        id: 'tmpl-10',
        name: 'Members using entertainment websites',
        description: 'Members spend over 20 minutes per day on entertainment websites',
        frequency: 'daily',
        delivery: ['email'],
        iconName: 'Film',
        color: 'bg-zinc-100',
        metric: 'Entertainment time',
        condition: 'above',
        value: 20,
        unit: 'min/day'
    },
    {
        id: 'tmpl-11',
        name: 'Members with high idle time',
        description: 'Average weekly idle time above 15%',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Pause',
        color: 'bg-gray-50',
        metric: 'Idle time percentage',
        condition: 'above',
        value: 15,
        unit: '%'
    },
    {
        id: 'tmpl-12',
        name: 'Members with high manual time',
        description: 'Average weekly manual time above 15%',
        frequency: 'weekly',
        delivery: ['email'],
        iconName: 'Hand',
        color: 'bg-zinc-100',
        metric: 'Manual time percentage',
        condition: 'above',
        value: 15,
        unit: '%'
    }
]

export const DUMMY_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-1',
        name: 'Suspiciously High Activity',
        enabled: true,
        createdBy: 'Admin',
        createdByAvatar: '👤',
        target: 'All Members',
        frequency: 'hourly',
        notifyVia: ['Email', 'Insights'],
        metric: 'Activity rate',
        condition: 'above',
        value: 95,
        unit: '%',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['owners', 'managers', 'team-leads']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    },
    {
        id: 'notif-2',
        name: 'Members With Low Activity Level',
        enabled: true,
        createdBy: 'Admin',
        createdByAvatar: '👤',
        target: 'All Members',
        frequency: 'daily',
        notifyVia: ['Email', 'Insights'],
        metric: 'Activity rate',
        condition: 'below',
        value: 35,
        unit: '%',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['owners']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    },
    {
        id: 'notif-3',
        name: 'Time On Social Media Or AI Sites',
        enabled: true,
        createdBy: 'Admin',
        createdByAvatar: '👤',
        target: 'All Members',
        frequency: 'daily',
        notifyVia: ['Email', 'Insights'],
        metric: 'Social media + AI time',
        condition: 'above',
        value: 30,
        unit: 'min/day',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['managers']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    },
    {
        id: 'notif-4',
        name: 'Suspicious Applications',
        enabled: true,
        createdBy: 'Admin',
        createdByAvatar: '👤',
        target: 'All Members',
        frequency: 'hourly',
        notifyVia: ['Email', 'Insights'],
        metric: 'Suspicious app usage',
        condition: 'above',
        value: 0,
        unit: 'instances',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['owners', 'managers']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    },
    {
        id: 'notif-5',
        name: 'Late Start Detection',
        enabled: false,
        createdBy: 'Fauzan',
        createdByAvatar: '👨‍💻',
        target: 'Development Team',
        frequency: 'daily',
        notifyVia: ['Slack'],
        metric: 'Daily start time',
        condition: 'above',
        value: 9.5,
        unit: 'hr',
        monitoredAudience: {
            type: 'teams',
            all: false,
            ids: ['team-dev']
        },
        recipients: {
            type: 'members',
            ids: ['member-1']
        },
        deliveryChannels: {
            highlights: false,
            email: false,
            slack: true
        }
    },
    {
        id: 'notif-6',
        name: 'Idle Time Alert',
        enabled: true,
        createdBy: 'System',
        createdByAvatar: '🤖',
        target: 'All Members',
        frequency: 'weekly',
        notifyVia: ['Email'],
        metric: 'Idle time percentage',
        condition: 'above',
        value: 20,
        unit: '%',
        monitoredAudience: {
            type: 'members',
            all: true,
            ids: []
        },
        recipients: {
            type: 'roles',
            ids: ['managers']
        },
        deliveryChannels: {
            highlights: true,
            email: true,
            slack: false
        }
    }
]

export function getTemplateById(id: string) {
    return NOTIFICATION_TEMPLATES.find(t => t.id === id)
}

export function getNotificationById(id: string) {
    return DUMMY_NOTIFICATIONS.find(n => n.id === id)
}

export function getRecommendedTemplates(count: number = 3) {
    return NOTIFICATION_TEMPLATES.slice(0, count)
}

export function toggleNotification(id: string) {
    const notification = DUMMY_NOTIFICATIONS.find(n => n.id === id)
    if (notification) {
        notification.enabled = !notification.enabled
    }
    return notification
}

export function deleteNotification(id: string) {
    const index = DUMMY_NOTIFICATIONS.findIndex(n => n.id === id)
    if (index !== -1) {
        DUMMY_NOTIFICATIONS.splice(index, 1)
        return true
    }
    return false
}

// ============================================================================
// PERFORMANCE DATA
// ============================================================================

export interface UtilizationData {
    dailyWorkHours: number
    targetHours: number
    avgDailyTarget: number
    memberId?: string
    teamId?: string
    date: string
}

export interface WorkTimeClassification {
    category: string
    percentage: number
    color: string
    memberId?: string
    teamId?: string
    date?: string
}

export interface DailyFocusData {
    date: string
    focusHours: number
    distractionHours: number
    memberId?: string
    teamId?: string
}

export interface ActivityData {
    hour: string
    activeMinutes: number
    idleMinutes: number
    date: string
    memberId?: string
    teamId?: string
}

export interface MeetingData {
    title: string
    duration: number
    participants: number
    date: string
    memberId?: string
    teamId?: string
}

export interface TopApp {
    name: string
    timeSpent: number
    category: string
    memberId?: string
    teamId?: string
    date: string
}

export interface LeaderboardEntry {
    name: string
    hours: number
    rank: number
    avatar: string
    memberId: string
}

export interface CategoryData {
    name: string
    percentage: number
    hours: number
    color: string
    memberId?: string
    teamId?: string
    date: string
}

export const DUMMY_UTILIZATION_DATA: UtilizationData[] = [
    { dailyWorkHours: 8.0, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm2', date: '2026-01-19' },
    { dailyWorkHours: 7.5, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm1', date: '2026-01-19' },
    { dailyWorkHours: 8.2, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm3', date: '2026-01-19' },
    { dailyWorkHours: 7.8, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm4', date: '2026-01-19' },
    { dailyWorkHours: 7.3, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm5', date: '2026-01-19' },
    { dailyWorkHours: 8.5, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't1', date: '2026-01-19' },
    { dailyWorkHours: 7.9, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't2', date: '2026-01-19' },
    { dailyWorkHours: 8.1, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't3', date: '2026-01-19' }
]

export const DUMMY_WORK_TIME_CLASSIFICATION: WorkTimeClassification[] = [
    { category: 'Productive', percentage: 65, color: '#10b981', memberId: 'm2', date: '2026-01-19' },
    { category: 'Neutral', percentage: 25, color: '#f59e0b', memberId: 'm2', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm2', date: '2026-01-19' },
    { category: 'Productive', percentage: 70, color: '#10b981', memberId: 'm1', date: '2026-01-19' },
    { category: 'Neutral', percentage: 20, color: '#f59e0b', memberId: 'm1', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm1', date: '2026-01-19' },
    { category: 'Productive', percentage: 75, color: '#10b981', memberId: 'm3', date: '2026-01-19' },
    { category: 'Neutral', percentage: 18, color: '#f59e0b', memberId: 'm3', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 7, color: '#ef4444', memberId: 'm3', date: '2026-01-19' },
    { category: 'Productive', percentage: 68, color: '#10b981', memberId: 'm4', date: '2026-01-19' },
    { category: 'Neutral', percentage: 22, color: '#f59e0b', memberId: 'm4', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm4', date: '2026-01-19' },
    { category: 'Productive', percentage: 62, color: '#10b981', memberId: 'm5', date: '2026-01-19' },
    { category: 'Neutral', percentage: 28, color: '#f59e0b', memberId: 'm5', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm5', date: '2026-01-19' }
]

export const DUMMY_DAILY_FOCUS: DailyFocusData[] = [
    { date: '2026-01-13', focusHours: 6.5, distractionHours: 1.5, memberId: 'm2' },
    { date: '2026-01-14', focusHours: 5.8, distractionHours: 2.2, memberId: 'm2' },
    { date: '2026-01-15', focusHours: 7.2, distractionHours: 0.8, memberId: 'm2' },
    { date: '2026-01-16', focusHours: 6.0, distractionHours: 2.0, memberId: 'm2' },
    { date: '2026-01-17', focusHours: 6.8, distractionHours: 1.2, memberId: 'm2' },
    { date: '2026-01-18', focusHours: 5.5, distractionHours: 2.5, memberId: 'm2' },
    { date: '2026-01-19', focusHours: 7.5, distractionHours: 0.5, memberId: 'm2' },
    { date: '2026-01-13', focusHours: 5.5, distractionHours: 2.5, memberId: 'm1' },
    { date: '2026-01-14', focusHours: 6.8, distractionHours: 1.2, memberId: 'm1' },
    { date: '2026-01-15', focusHours: 6.2, distractionHours: 1.8, memberId: 'm1' },
    { date: '2026-01-16', focusHours: 7.0, distractionHours: 1.0, memberId: 'm1' },
    { date: '2026-01-17', focusHours: 5.8, distractionHours: 2.2, memberId: 'm1' },
    { date: '2026-01-18', focusHours: 6.5, distractionHours: 1.5, memberId: 'm1' },
    { date: '2026-01-19', focusHours: 7.2, distractionHours: 0.8, memberId: 'm1' },
    { date: '2026-01-13', focusHours: 7.0, distractionHours: 1.0, memberId: 'm3' },
    { date: '2026-01-14', focusHours: 6.5, distractionHours: 1.5, memberId: 'm3' },
    { date: '2026-01-15', focusHours: 7.5, distractionHours: 0.5, memberId: 'm3' },
    { date: '2026-01-16', focusHours: 6.8, distractionHours: 1.2, memberId: 'm3' },
    { date: '2026-01-17', focusHours: 7.2, distractionHours: 0.8, memberId: 'm3' },
    { date: '2026-01-18', focusHours: 6.3, distractionHours: 1.7, memberId: 'm3' },
    { date: '2026-01-19', focusHours: 7.8, distractionHours: 0.2, memberId: 'm3' },
    { date: '2026-01-13', focusHours: 6.2, distractionHours: 1.8, memberId: 'm4' },
    { date: '2026-01-14', focusHours: 6.0, distractionHours: 2.0, memberId: 'm4' },
    { date: '2026-01-15', focusHours: 6.8, distractionHours: 1.2, memberId: 'm4' },
    { date: '2026-01-16', focusHours: 6.5, distractionHours: 1.5, memberId: 'm4' },
    { date: '2026-01-17', focusHours: 7.0, distractionHours: 1.0, memberId: 'm4' },
    { date: '2026-01-18', focusHours: 6.2, distractionHours: 1.8, memberId: 'm4' },
    { date: '2026-01-19', focusHours: 7.3, distractionHours: 0.7, memberId: 'm4' },
    { date: '2026-01-13', focusHours: 5.8, distractionHours: 2.2, memberId: 'm5' },
    { date: '2026-01-14', focusHours: 6.2, distractionHours: 1.8, memberId: 'm5' },
    { date: '2026-01-15', focusHours: 6.5, distractionHours: 1.5, memberId: 'm5' },
    { date: '2026-01-16', focusHours: 6.0, distractionHours: 2.0, memberId: 'm5' },
    { date: '2026-01-17', focusHours: 6.8, distractionHours: 1.2, memberId: 'm5' },
    { date: '2026-01-18', focusHours: 5.5, distractionHours: 2.5, memberId: 'm5' },
    { date: '2026-01-19', focusHours: 7.0, distractionHours: 1.0, memberId: 'm5' }
]

export const DUMMY_ACTIVITY: ActivityData[] = [
    { hour: '08:00', activeMinutes: 45, idleMinutes: 15, date: '2026-01-19', memberId: 'm2' },
    { hour: '09:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm2' },
    { hour: '10:00', activeMinutes: 40, idleMinutes: 20, date: '2026-01-19', memberId: 'm2' },
    { hour: '11:00', activeMinutes: 55, idleMinutes: 5, date: '2026-01-19', memberId: 'm2' },
    { hour: '12:00', activeMinutes: 15, idleMinutes: 45, date: '2026-01-19', memberId: 'm2' },
    { hour: '13:00', activeMinutes: 48, idleMinutes: 12, date: '2026-01-19', memberId: 'm2' },
    { hour: '14:00', activeMinutes: 52, idleMinutes: 8, date: '2026-01-19', memberId: 'm2' },
    { hour: '15:00', activeMinutes: 47, idleMinutes: 13, date: '2026-01-19', memberId: 'm2' },
    { hour: '16:00', activeMinutes: 43, idleMinutes: 17, date: '2026-01-19', memberId: 'm2' },
    { hour: '17:00', activeMinutes: 30, idleMinutes: 30, date: '2026-01-19', memberId: 'm2' },
    { hour: '08:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm1' },
    { hour: '09:00', activeMinutes: 55, idleMinutes: 5, date: '2026-01-19', memberId: 'm1' },
    { hour: '10:00', activeMinutes: 48, idleMinutes: 12, date: '2026-01-19', memberId: 'm1' },
    { hour: '11:00', activeMinutes: 52, idleMinutes: 8, date: '2026-01-19', memberId: 'm1' },
    { hour: '12:00', activeMinutes: 20, idleMinutes: 40, date: '2026-01-19', memberId: 'm1' },
    { hour: '13:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm1' },
    { hour: '14:00', activeMinutes: 48, idleMinutes: 12, date: '2026-01-19', memberId: 'm1' },
    { hour: '15:00', activeMinutes: 45, idleMinutes: 15, date: '2026-01-19', memberId: 'm1' },
    { hour: '16:00', activeMinutes: 42, idleMinutes: 18, date: '2026-01-19', memberId: 'm1' },
    { hour: '17:00', activeMinutes: 35, idleMinutes: 25, date: '2026-01-19', memberId: 'm1' },
    { hour: '08:00', activeMinutes: 52, idleMinutes: 8, date: '2026-01-19', memberId: 'm3' },
    { hour: '09:00', activeMinutes: 56, idleMinutes: 4, date: '2026-01-19', memberId: 'm3' },
    { hour: '10:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm3' },
    { hour: '11:00', activeMinutes: 54, idleMinutes: 6, date: '2026-01-19', memberId: 'm3' },
    { hour: '12:00', activeMinutes: 18, idleMinutes: 42, date: '2026-01-19', memberId: 'm3' },
    { hour: '13:00', activeMinutes: 52, idleMinutes: 8, date: '2026-01-19', memberId: 'm3' },
    { hour: '14:00', activeMinutes: 55, idleMinutes: 5, date: '2026-01-19', memberId: 'm3' },
    { hour: '15:00', activeMinutes: 50, idleMinutes: 10, date: '2026-01-19', memberId: 'm3' },
    { hour: '16:00', activeMinutes: 48, idleMinutes: 12, date: '2026-01-19', memberId: 'm3' },
    { hour: '17:00', activeMinutes: 40, idleMinutes: 20, date: '2026-01-19', memberId: 'm3' }
]

export const DUMMY_MEETINGS: MeetingData[] = [
    { title: 'Daily Standup', duration: 15, participants: 8, date: '2026-01-19', memberId: 'm2' },
    { title: 'Sprint Planning', duration: 120, participants: 10, date: '2026-01-19', memberId: 'm2' },
    { title: 'Client Review', duration: 60, participants: 5, date: '2026-01-19', memberId: 'm2' },
    { title: 'Team Sync', duration: 30, participants: 6, date: '2026-01-18', memberId: 'm2' }
]

export const DUMMY_TOP_APPS: TopApp[] = [
    { name: 'VS Code', timeSpent: 180, category: 'Development', memberId: 'm2', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 120, category: 'Browser', memberId: 'm2', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 60, category: 'Communication', memberId: 'm2', date: '2026-01-19' },
    { name: 'Figma', timeSpent: 90, category: 'Design', memberId: 'm2', date: '2026-01-19' },
    { name: 'Terminal', timeSpent: 45, category: 'Development', memberId: 'm2', date: '2026-01-19' },
    { name: 'IntelliJ IDEA', timeSpent: 200, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 90, category: 'Browser', memberId: 'm1', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 45, category: 'Communication', memberId: 'm1', date: '2026-01-19' },
    { name: 'Postman', timeSpent: 60, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    { name: 'Docker', timeSpent: 50, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    { name: 'Figma', timeSpent: 220, category: 'Design', memberId: 'm3', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 100, category: 'Browser', memberId: 'm3', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 50, category: 'Communication', memberId: 'm3', date: '2026-01-19' },
    { name: 'Photoshop', timeSpent: 80, category: 'Design', memberId: 'm3', date: '2026-01-19' },
    { name: 'Notion', timeSpent: 40, category: 'Productivity', memberId: 'm3', date: '2026-01-19' },
    { name: 'VS Code', timeSpent: 190, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 110, category: 'Browser', memberId: 'm4', date: '2026-01-19' },
    { name: 'Terminal', timeSpent: 70, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 55, category: 'Communication', memberId: 'm4', date: '2026-01-19' },
    { name: 'GitHub Desktop', timeSpent: 35, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    { name: 'Excel', timeSpent: 150, category: 'Productivity', memberId: 'm5', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 95, category: 'Browser', memberId: 'm5', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 65, category: 'Communication', memberId: 'm5', date: '2026-01-19' },
    { name: 'PowerPoint', timeSpent: 75, category: 'Productivity', memberId: 'm5', date: '2026-01-19' },
    { name: 'Teams', timeSpent: 50, category: 'Communication', memberId: 'm5', date: '2026-01-19' }
]

export const DUMMY_LEADERBOARD: LeaderboardEntry[] = [
    { name: 'Sarah Johnson', hours: 42.5, rank: 1, avatar: 'SJ', memberId: 'm3' },
    { name: 'Michael Chen', hours: 41.2, rank: 2, avatar: 'MC', memberId: 'm4' },
    { name: 'Lave Lavael', hours: 40.8, rank: 3, avatar: 'LL', memberId: 'm2' },
    { name: 'Antonio Galih', hours: 39.5, rank: 4, avatar: 'AG', memberId: 'm1' },
    { name: 'Emma Rodriguez', hours: 38.9, rank: 5, avatar: 'ER', memberId: 'm5' }
]

export const DUMMY_CATEGORIES: CategoryData[] = [
    { name: 'Development', percentage: 45, hours: 18.0, color: '#3b82f6', memberId: 'm2', date: '2026-01-19' },
    { name: 'Communication', percentage: 20, hours: 8.0, color: '#10b981', memberId: 'm2', date: '2026-01-19' },
    { name: 'Design', percentage: 15, hours: 6.0, color: '#8b5cf6', memberId: 'm2', date: '2026-01-19' },
    { name: 'Documentation', percentage: 12, hours: 4.8, color: '#f59e0b', memberId: 'm2', date: '2026-01-19' },
    { name: 'Meetings', percentage: 8, hours: 3.2, color: '#ef4444', memberId: 'm2', date: '2026-01-19' },
    { name: 'Development', percentage: 50, hours: 20.0, color: '#3b82f6', memberId: 'm1', date: '2026-01-19' },
    { name: 'Communication', percentage: 15, hours: 6.0, color: '#10b981', memberId: 'm1', date: '2026-01-19' },
    { name: 'Testing', percentage: 20, hours: 8.0, color: '#8b5cf6', memberId: 'm1', date: '2026-01-19' },
    { name: 'Documentation', percentage: 10, hours: 4.0, color: '#f59e0b', memberId: 'm1', date: '2026-01-19' },
    { name: 'Meetings', percentage: 5, hours: 2.0, color: '#ef4444', memberId: 'm1', date: '2026-01-19' },
    { name: 'Design', percentage: 55, hours: 22.0, color: '#8b5cf6', memberId: 'm3', date: '2026-01-19' },
    { name: 'Communication', percentage: 18, hours: 7.2, color: '#10b981', memberId: 'm3', date: '2026-01-19' },
    { name: 'Research', percentage: 15, hours: 6.0, color: '#3b82f6', memberId: 'm3', date: '2026-01-19' },
    { name: 'Meetings', percentage: 7, hours: 2.8, color: '#ef4444', memberId: 'm3', date: '2026-01-19' },
    { name: 'Documentation', percentage: 5, hours: 2.0, color: '#f59e0b', memberId: 'm3', date: '2026-01-19' },
    { name: 'Development', percentage: 48, hours: 19.2, color: '#3b82f6', memberId: 'm4', date: '2026-01-19' },
    { name: 'Code Review', percentage: 22, hours: 8.8, color: '#8b5cf6', memberId: 'm4', date: '2026-01-19' },
    { name: 'Communication', percentage: 16, hours: 6.4, color: '#10b981', memberId: 'm4', date: '2026-01-19' },
    { name: 'Meetings', percentage: 9, hours: 3.6, color: '#ef4444', memberId: 'm4', date: '2026-01-19' },
    { name: 'Documentation', percentage: 5, hours: 2.0, color: '#f59e0b', memberId: 'm4', date: '2026-01-19' },
    { name: 'Analysis', percentage: 40, hours: 16.0, color: '#3b82f6', memberId: 'm5', date: '2026-01-19' },
    { name: 'Meetings', percentage: 25, hours: 10.0, color: '#ef4444', memberId: 'm5', date: '2026-01-19' },
    { name: 'Communication', percentage: 20, hours: 8.0, color: '#10b981', memberId: 'm5', date: '2026-01-19' },
    { name: 'Reporting', percentage: 10, hours: 4.0, color: '#f59e0b', memberId: 'm5', date: '2026-01-19' },
    { name: 'Research', percentage: 5, hours: 2.0, color: '#8b5cf6', memberId: 'm5', date: '2026-01-19' }
]

export function getMemberIdFromName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-')
}

// ============================================================================
// SCREENSHOTS
// ============================================================================

export interface Screenshot {
    id: string
    memberId: string
    timestamp: string
    date: string
    timeRange: string
    projectName: string
    todosLabel: string
    imageUrl: string
    screenCount: number
    activityProgress: number
    minutes: number
    seconds?: boolean
    noActivity?: boolean
}

export const DUMMY_SCREENSHOTS: Screenshot[] = [
    // Antonio Galih (m1) - Morning Sessions
    { id: 'ss1', memberId: 'm1', timestamp: '2026-01-21T09:00:00', date: '2026-01-21', timeRange: '9:00 AM - 9:10 AM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2025-12-08 094631.png', screenCount: 1, activityProgress: 75, minutes: 10 },
    { id: 'ss2', memberId: 'm1', timestamp: '2026-01-21T09:10:00', date: '2026-01-21', timeRange: '9:10 AM - 9:20 AM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-04 222401.png', screenCount: 1, activityProgress: 82, minutes: 10 },
    { id: 'ss3', memberId: 'm1', timestamp: '2026-01-21T09:20:00', date: '2026-01-21', timeRange: '9:20 AM - 9:30 AM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-09 101315.png', screenCount: 1, activityProgress: 68, minutes: 10 },

    // Lave Lavael (m2) - Afternoon Sessions
    { id: 'ss4', memberId: 'm2', timestamp: '2026-01-21T14:00:00', date: '2026-01-21', timeRange: '2:00 PM - 2:10 PM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-12 222910.png', screenCount: 1, activityProgress: 91, minutes: 10 },
    { id: 'ss5', memberId: 'm2', timestamp: '2026-01-21T14:10:00', date: '2026-01-21', timeRange: '2:10 PM - 2:20 PM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-20 161303.png', screenCount: 1, activityProgress: 88, minutes: 10 },
    { id: 'ss6', memberId: 'm2', timestamp: '2026-01-21T14:20:00', date: '2026-01-21', timeRange: '2:20 PM - 2:30 PM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-20 161319.png', screenCount: 1, activityProgress: 95, minutes: 10 },

    // Sarah Johnson (m3) - Mixed Activity
    { id: 'ss7', memberId: 'm3', timestamp: '2026-01-21T10:00:00', date: '2026-01-21', timeRange: '10:00 AM - 10:10 AM', projectName: 'Marketing Campaign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2025-12-08 094631.png', screenCount: 1, activityProgress: 45, minutes: 10 },
    { id: 'ss8', memberId: 'm3', timestamp: '2026-01-21T10:10:00', date: '2026-01-21', timeRange: '10:10 AM - 10:20 AM', projectName: 'Marketing Campaign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-04 222401.png', screenCount: 1, activityProgress: 52, minutes: 10 },
    { id: 'ss9', memberId: 'm3', timestamp: '2026-01-21T10:20:00', date: '2026-01-21', timeRange: '10:20 AM - 10:30 AM', projectName: 'Marketing Campaign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-09 101315.png', screenCount: 1, activityProgress: 38, minutes: 10 },

    // Michael Chen (m4) - Evening Work
    { id: 'ss11', memberId: 'm4', timestamp: '2026-01-21T16:00:00', date: '2026-01-21', timeRange: '4:00 PM - 4:10 PM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-12 222910.png', screenCount: 1, activityProgress: 71, minutes: 10 },
    { id: 'ss12', memberId: 'm4', timestamp: '2026-01-21T16:10:00', date: '2026-01-21', timeRange: '4:10 PM - 4:20 PM', projectName: 'Mobile App Development', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-20 161303.png', screenCount: 1, activityProgress: 66, minutes: 10 },

    // Emma Rodriguez (m5) - Standard Day
    { id: 'ss13', memberId: 'm5', timestamp: '2026-01-21T11:00:00', date: '2026-01-21', timeRange: '11:00 AM - 11:10 AM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-09 101315.png', screenCount: 1, activityProgress: 79, minutes: 10 },
    { id: 'ss14', memberId: 'm5', timestamp: '2026-01-21T11:10:00', date: '2026-01-21', timeRange: '11:10 AM - 11:20 AM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-04 222401.png', screenCount: 1, activityProgress: 84, minutes: 10 },
    { id: 'ss15', memberId: 'm5', timestamp: '2026-01-21T11:20:00', date: '2026-01-21', timeRange: '11:20 AM - 11:30 AM', projectName: 'Website Redesign', todosLabel: 'No to-dos', imageUrl: '/Screenshoot/Screenshot 2026-01-12 222910.png', screenCount: 1, activityProgress: 72, minutes: 10 },
]

export interface MemberScreenshotItem {
    id: string
    time: string
    progress: number
    minutes: number
    image: string
    noActivity?: boolean
    seconds?: boolean
    screenCount?: number
}

export interface MemberInsightSummary {
    memberId: string
    totalWorkedTime: string
    focusTime: string
    focusDescription: string
    avgActivity: string
    unusualCount: number
    unusualMessage: string
    classificationLabel: string
    classificationSummary: string
    classificationPercent: number
}

export const DUMMY_MEMBER_SCREENSHOTS: Record<string, MemberScreenshotItem[]> = {
    m1: [
        { id: "m1-1", time: "9:00 am - 9:10 am", progress: 68, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png", screenCount: 1 },
        { id: "m1-2", time: "9:10 am - 9:20 am", progress: 72, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-11 204654.png", screenCount: 1 },
        { id: "m1-3", time: "9:20 am - 9:30 am", progress: 65, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 220750.png", screenCount: 1 },
        { id: "m1-4", time: "9:30 am - 9:40 am", progress: 58, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m1-5", time: "9:40 am - 9:50 am", progress: 62, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 204028.png", screenCount: 1 },
        { id: "m1-6", time: "9:50 am - 10:00 am", progress: 77, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-28 162344.png", screenCount: 1 },
        { id: "m1-7", time: "1:00 pm - 1:10 pm", progress: 44, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-18 155809.png", screenCount: 1 },
        { id: "m1-8", time: "1:10 pm - 1:20 pm", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
    m2: [
        { id: "m2-1", time: "2:00 pm - 2:10 pm", progress: 53, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-12 222910.png", screenCount: 1 },
        { id: "m2-2", time: "2:10 pm - 2:20 pm", progress: 77, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png", screenCount: 1 },
        { id: "m2-3", time: "2:20 pm - 2:30 pm", progress: 81, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161319.png", screenCount: 1 },
        { id: "m2-4", time: "2:30 pm - 2:40 pm", progress: 68, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m2-5", time: "2:40 pm - 2:50 pm", progress: 59, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 220750.png", screenCount: 1 },
        { id: "m2-6", time: "2:50 pm - 3:00 pm", progress: 52, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png", screenCount: 1 },
        { id: "m2-7", time: "3:00 pm - 3:10 pm", progress: 44, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-18 155809.png", screenCount: 1 },
        { id: "m2-8", time: "3:10 pm - 3:20 pm", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
    m3: [
        { id: "m3-1", time: "10:00 am - 10:10 am", progress: 45, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png", screenCount: 1 },
        { id: "m3-2", time: "10:10 am - 10:20 am", progress: 52, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-11 204654.png", screenCount: 1 },
        { id: "m3-3", time: "10:20 am - 10:30 am", progress: 38, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png", screenCount: 1 },
        { id: "m3-4", time: "10:30 am - 10:40 am", progress: 40, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png", screenCount: 1 },
        { id: "m3-5", time: "10:40 am - 10:50 am", progress: 60, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 204028.png", screenCount: 1 },
        { id: "m3-6", time: "10:50 am - 11:00 am", progress: 38, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m3-7", time: "11:00 am - 11:10 am", progress: 34, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-18 155809.png", screenCount: 1 },
        { id: "m3-8", time: "11:10 am - 11:20 am", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
    m4: [
        { id: "m4-1", time: "4:00 pm - 4:10 pm", progress: 71, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-12 222910.png", screenCount: 1 },
        { id: "m4-2", time: "4:10 pm - 4:20 pm", progress: 66, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png", screenCount: 1 },
        { id: "m4-3", time: "4:20 pm - 4:30 pm", progress: 58, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161319.png", seconds: true, screenCount: 1 },
        { id: "m4-4", time: "4:30 pm - 4:40 pm", progress: 63, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m4-5", time: "4:40 pm - 4:50 pm", progress: 45, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 220750.png", screenCount: 1 },
        { id: "m4-6", time: "4:50 pm - 5:00 pm", progress: 52, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-11 204654.png", screenCount: 1 },
        { id: "m4-7", time: "5:00 pm - 5:10 pm", progress: 47, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-28 162344.png", screenCount: 1 },
        { id: "m4-8", time: "5:10 pm - 5:20 pm", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
    m5: [
        { id: "m5-1", time: "11:00 am - 11:10 am", progress: 79, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png", screenCount: 1 },
        { id: "m5-2", time: "11:10 am - 11:20 am", progress: 84, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m5-3", time: "11:20 am - 11:30 am", progress: 72, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 204028.png", screenCount: 1 },
        { id: "m5-4", time: "11:30 am - 11:40 am", progress: 66, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-04 220750.png", screenCount: 1 },
        { id: "m5-5", time: "11:40 am - 11:50 am", progress: 58, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-11 204654.png", screenCount: 1 },
        { id: "m5-6", time: "11:50 am - 12:00 pm", progress: 66, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-25 191532.png", screenCount: 1 },
        { id: "m5-7", time: "12:00 pm - 12:10 pm", progress: 48, minutes: 10, image: "/Screenshoot/Screenshot 2025-11-18 155809.png", screenCount: 1 },
        { id: "m5-8", time: "12:10 pm - 12:20 pm", progress: 0, minutes: 0, image: "", noActivity: true, screenCount: 0 },
    ],
}

export const DUMMY_MEMBER_INSIGHTS: Record<string, MemberInsightSummary> = {
    m1: {
        memberId: "m1",
        totalWorkedTime: "3h 24m",
        focusTime: "1h 22m",
        focusDescription: "Stable focus with a fresh start before lunch.",
        avgActivity: "83%",
        unusualCount: 1,
        unusualMessage: "- Late-night spike after 10 pm.",
        classificationLabel: "Productive",
        classificationSummary: "Maintains high focus on the morning stretch.",
        classificationPercent: 78,
    },
    m2: {
        memberId: "m2",
        totalWorkedTime: "4h 05m",
        focusTime: "1h 40m",
        focusDescription: "Deep work streak right after lunch.",
        avgActivity: "76%",
        unusualCount: 2,
        unusualMessage: "- Two idle checks interrupted the flow.\n- The app switched quickly before returning to work.",
        classificationLabel: "Balanced",
        classificationSummary: "Punctuated focus with controlled rest.",
        classificationPercent: 64,
    },
    m3: {
        memberId: "m3",
        totalWorkedTime: "3h 48m",
        focusTime: "1h 10m",
        focusDescription: "Creative tasks keep the pace steady.",
        avgActivity: "69%",
        unusualCount: 1,
        unusualMessage: "- Weekend-style hours detected midweek.",
        classificationLabel: "Creative",
        classificationSummary: "Switches between design and research calmly.",
        classificationPercent: 71,
    },
    m4: {
        memberId: "m4",
        totalWorkedTime: "3h 10m",
        focusTime: "1h 05m",
        focusDescription: "Quick bursts of energy in the afternoon.",
        avgActivity: "71%",
        unusualCount: 3,
        unusualMessage: "- Idle stretch followed by a sprint.\n- Brief break before diving back into API fixes.\n- Finished with a quick review of the dashboard.",
        classificationLabel: "Recovery",
        classificationSummary: "Rebounds strong after a short lull.",
        classificationPercent: 59,
    },
    m5: {
        memberId: "m5",
        totalWorkedTime: "3h 55m",
        focusTime: "1h 25m",
        focusDescription: "Consistent energy with quick updates.",
        avgActivity: "80%",
        unusualCount: 0,
        unusualMessage: "- No unusual activity this session.",
        classificationLabel: "High focus",
        classificationSummary: "Keeps steady pace through late morning.",
        classificationPercent: 85,
    },
}

export function getScreenshotsByMember(memberId: string) {
    return DUMMY_SCREENSHOTS.filter(s => s.memberId === memberId)
}

export function getScreenshotsByDateRange(startDate: Date, endDate: Date) {
    return DUMMY_SCREENSHOTS.filter(s => {
        const screenshotDate = new Date(s.date)
        return screenshotDate >= startDate && screenshotDate <= endDate
    })
}

export function getScreenshotsByMemberAndDateRange(memberId: string, startDate: Date, endDate: Date) {
    return DUMMY_SCREENSHOTS.filter(s => {
        const screenshotDate = new Date(s.date)
        return s.memberId === memberId && screenshotDate >= startDate && screenshotDate <= endDate
    })
}

// ============================================================================
// ATTENDANCE DASHBOARD
// ============================================================================

export interface DashboardActivity {
    id: string
    memberId: string
    memberName: string
    division: string
    position: string
    activityType: 'check_in' | 'check_out' | 'break_start' | 'break_end'
    timestamp: string
    date: string
}

export interface StaffStatusData {
    type: 'permanent' | 'contract' | 'intern'
    count: number
    percentage: number
}

export interface PendingRequest {
    id: string
    memberId: string
    memberName: string
    requestType: 'annual_leave' | 'sick_leave' | 'overtime' | 'permission'
    requestDate: string
    status: 'pending' | 'approved' | 'rejected'
    notes?: string
}

export interface LateMissedShift {
    id: string
    memberId: string
    memberName: string
    shiftDate: string
    shiftTime: string
    issue: 'late' | 'missed'
    lateBy?: string
}

export interface ManualTimeEntry {
    id: string
    memberId: string
    memberName: string
    date: string
    timeChange: string
    note: string
}

export interface DashboardStats {
    totalStaff: number
    present: number
    late: number
    permission: number
    earnedWeek: string
    earnedToday: string
    workedWeek: string
    workedToday: string
    projectsWorked: number
    activityToday: string
    activityWeek: string
}

// Dashboard Activities (recent check-ins/outs)
export const DUMMY_DASHBOARD_ACTIVITIES: DashboardActivity[] = [
    { id: 'da1', memberId: 'm1', memberName: 'Antonio Galih', division: 'Engineering', position: 'Senior Developer', activityType: 'check_in', timestamp: '2026-01-21T08:05:21', date: '2026-01-21' },
    { id: 'da2', memberId: 'm2', memberName: 'Lave Lavael', division: 'Design', position: 'UI/UX Designer', activityType: 'check_in', timestamp: '2026-01-21T08:10:15', date: '2026-01-21' },
    { id: 'da3', memberId: 'm3', memberName: 'Sarah Johnson', division: 'Marketing', position: 'Marketing Manager', activityType: 'check_in', timestamp: '2026-01-21T08:02:30', date: '2026-01-21' },
    { id: 'da4', memberId: 'm4', memberName: 'Michael Chen', division: 'Engineering', position: 'Backend Developer', activityType: 'check_in', timestamp: '2026-01-21T08:15:45', date: '2026-01-21' },
    { id: 'da5', memberId: 'm5', memberName: 'Emma Rodriguez', division: 'HR', position: 'HR Manager', activityType: 'check_in', timestamp: '2026-01-21T08:00:00', date: '2026-01-21' },
    { id: 'da6', memberId: 'm1', memberName: 'Antonio Galih', division: 'Engineering', position: 'Senior Developer', activityType: 'check_out', timestamp: '2026-01-21T17:10:15', date: '2026-01-21' },
    { id: 'da7', memberId: 'm2', memberName: 'Lave Lavael', division: 'Design', position: 'UI/UX Designer', activityType: 'check_out', timestamp: '2026-01-21T17:05:30', date: '2026-01-21' },
]

// Staff Status Distribution
export const DUMMY_STAFF_STATUS: StaffStatusData[] = [
    { type: 'permanent', count: 10, percentage: 66.67 },
    { type: 'contract', count: 3, percentage: 20 },
    { type: 'intern', count: 2, percentage: 13.33 }
]

// Pending Requests
export const DUMMY_PENDING_REQUESTS: PendingRequest[] = [
    { id: 'pr1', memberId: 'm3', memberName: 'Sarah Johnson', requestType: 'annual_leave', requestDate: '2026-01-22', status: 'pending', notes: 'Family vacation' },
    { id: 'pr2', memberId: 'm4', memberName: 'Michael Chen', requestType: 'sick_leave', requestDate: '2026-01-21', status: 'pending', notes: 'Flu symptoms' },
    { id: 'pr3', memberId: 'm1', memberName: 'Antonio Galih', requestType: 'overtime', requestDate: '2026-01-20', status: 'pending', notes: 'Project deadline' },
]

// Late & Missed Shifts
export const DUMMY_LATE_MISSED_SHIFTS: LateMissedShift[] = [
    { id: 'lm1', memberId: 'm4', memberName: 'Michael Chen', shiftDate: '2026-01-21', shiftTime: '08:00–17:00', issue: 'late', lateBy: '15m' },
    { id: 'lm2', memberId: 'm3', memberName: 'Sarah Johnson', shiftDate: '2026-01-20', shiftTime: '08:00–17:00', issue: 'late', lateBy: '7m' },
    { id: 'lm3', memberId: 'm2', memberName: 'Lave Lavael', shiftDate: '2026-01-19', shiftTime: '08:00–17:00', issue: 'missed' },
]

// Manual Time Entries
export const DUMMY_MANUAL_TIME: ManualTimeEntry[] = [
    { id: 'mt1', memberId: 'm1', memberName: 'Antonio Galih', date: '2026-01-21', timeChange: '+0:30', note: 'Add meeting time' },
    { id: 'mt2', memberId: 'm5', memberName: 'Emma Rodriguez', date: '2026-01-21', timeChange: '-0:10', note: 'Trim break' },
]

// Dashboard Statistics
export const DUMMY_DASHBOARD_STATS: DashboardStats = {
    totalStaff: 156,
    present: 142,
    late: 8,
    permission: 4,
    earnedWeek: 'Rp 3.450.000',
    earnedToday: 'Rp 550.000',
    workedWeek: '38h 25m',
    workedToday: '6h 40m',
    projectsWorked: 5,
    activityToday: 'Normal',
    activityWeek: '↑ 12%'
}

// "Me" view data (for current user - Antonio Galih / m1)
export const DUMMY_MY_ACTIVITIES: DashboardActivity[] = DUMMY_DASHBOARD_ACTIVITIES.filter(a => a.memberId === 'm1')

export const DUMMY_MY_STATS = {
    status: 'Attend',
    workedToday: '8h 40m',
    workedWeek: '38h 25m',
    attendanceRate: '95%',
    lateCount: 2,
    earnedToday: 'Rp 550.000',
    earnedWeek: 'Rp 3.450.000',
    projectsWorked: 5,
    activityToday: 'Normal',
    activityWeek: '↑ 12%'
}

export function getDashboardActivitiesByDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    return DUMMY_DASHBOARD_ACTIVITIES.filter(a => a.date === dateStr)
}

export function getDashboardActivitiesByMember(memberId: string) {
    return DUMMY_DASHBOARD_ACTIVITIES.filter(a => a.memberId === memberId)
}

// Type aliases for backwards compatibility
export type { UnusualActivityEntry as UnusualActivity }

// ============================================================================
// APP ACTIVITIES
// ============================================================================

export interface AppActivityEntry {
    id: string
    projectId: string
    projectName: string
    memberId: string
    appName: string
    timeSpent: number // in hours
    sessions: number
    date: string
}

export const DUMMY_APP_ACTIVITIES: AppActivityEntry[] = [
    {
        id: "aa1",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "VS Code",
        timeSpent: 4.5,
        sessions: 12,
        date: "2026-01-21"
    },
    {
        id: "aa2",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "Chrome",
        timeSpent: 2.1,
        sessions: 25,
        date: "2026-01-21"
    },
    {
        id: "aa3",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Android Studio",
        timeSpent: 6.0,
        sessions: 5,
        date: "2026-01-21"
    },
    {
        id: "aa4",
        projectId: "proj-1",
        projectName: "hans",
        memberId: "m1",
        appName: "Hubstaff",
        timeSpent: 0.0214, // 0:01:17 in hours (77 seconds / 3600)
        sessions: 2,
        date: "2026-01-26"
    },
    {
        id: "aa5",
        projectId: "proj-1",
        projectName: "hans",
        memberId: "m1",
        appName: "Microsoft Edge",
        timeSpent: 0.0169, // 0:01:01 in hours (61 seconds / 3600)
        sessions: 1,
        date: "2026-01-26"
    },
    {
        id: "aa6",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "VS Code",
        timeSpent: 2.5,
        sessions: 8,
        date: "2026-01-26"
    },
    {
        id: "aa7",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "Chrome",
        timeSpent: 1.8,
        sessions: 15,
        date: "2026-01-26"
    },
    {
        id: "aa8",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Android Studio",
        timeSpent: 3.2,
        sessions: 6,
        date: "2026-01-26"
    },
    {
        id: "aa9",
        projectId: "proj-1",
        projectName: "hans",
        memberId: "m1",
        appName: "Hubstaff",
        timeSpent: 0.015, // 0:00:54
        sessions: 1,
        date: "2026-01-27"
    },
    {
        id: "aa10",
        projectId: "proj-1",
        projectName: "hans",
        memberId: "m1",
        appName: "Microsoft Edge",
        timeSpent: 0.02, // 0:01:12
        sessions: 2,
        date: "2026-01-27"
    },
    // Sarah Johnson (m3) - Marketing Campaign
    {
        id: "aa11",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Canva",
        timeSpent: 2.5,
        sessions: 8,
        date: "2026-01-26"
    },
    {
        id: "aa12",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Chrome",
        timeSpent: 1.8,
        sessions: 12,
        date: "2026-01-26"
    },
    {
        id: "aa13",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Slack",
        timeSpent: 0.5,
        sessions: 5,
        date: "2026-01-26"
    },
    {
        id: "aa14",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m3",
        appName: "Figma",
        timeSpent: 3.2,
        sessions: 6,
        date: "2026-01-27"
    },
    // Michael Chen (m4) - Mobile App Development
    {
        id: "aa15",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Xcode",
        timeSpent: 5.5,
        sessions: 10,
        date: "2026-01-26"
    },
    {
        id: "aa16",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "VS Code",
        timeSpent: 2.3,
        sessions: 15,
        date: "2026-01-26"
    },
    {
        id: "aa17",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Terminal",
        timeSpent: 1.2,
        sessions: 8,
        date: "2026-01-26"
    },
    {
        id: "aa18",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Chrome",
        timeSpent: 0.8,
        sessions: 6,
        date: "2026-01-27"
    },
    // Emma Rodriguez (m5) - Website Redesign
    {
        id: "aa19",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Figma",
        timeSpent: 4.0,
        sessions: 7,
        date: "2026-01-26"
    },
    {
        id: "aa20",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "VS Code",
        timeSpent: 3.5,
        sessions: 11,
        date: "2026-01-26"
    },
    {
        id: "aa21",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Chrome",
        timeSpent: 1.5,
        sessions: 9,
        date: "2026-01-26"
    },
    {
        id: "aa22",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Adobe Photoshop",
        timeSpent: 2.0,
        sessions: 4,
        date: "2026-01-27"
    },
    // Data untuk hari kemarin (25 Januari 2026)
    // Antonio Galih (m1) - Yesterday
    {
        id: "aa23",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "VS Code",
        timeSpent: 5.0,
        sessions: 14,
        date: "2026-01-25"
    },
    {
        id: "aa24",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        appName: "Chrome",
        timeSpent: 2.5,
        sessions: 20,
        date: "2026-01-25"
    },
    {
        id: "aa25",
        projectId: "proj-1",
        projectName: "hans",
        memberId: "m1",
        appName: "Hubstaff",
        timeSpent: 0.03,
        sessions: 3,
        date: "2026-01-25"
    },
    // Lave Lavael (m2) - Yesterday
    {
        id: "aa26",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Android Studio",
        timeSpent: 7.0,
        sessions: 6,
        date: "2026-01-25"
    },
    {
        id: "aa27",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "VS Code",
        timeSpent: 1.5,
        sessions: 8,
        date: "2026-01-25"
    },
    {
        id: "aa28",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m2",
        appName: "Chrome",
        timeSpent: 1.2,
        sessions: 10,
        date: "2026-01-25"
    },
    // Sarah Johnson (m3) - Yesterday
    {
        id: "aa29",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Canva",
        timeSpent: 3.0,
        sessions: 9,
        date: "2026-01-25"
    },
    {
        id: "aa30",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Chrome",
        timeSpent: 2.0,
        sessions: 15,
        date: "2026-01-25"
    },
    {
        id: "aa31",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        appName: "Slack",
        timeSpent: 0.8,
        sessions: 7,
        date: "2026-01-25"
    },
    // Michael Chen (m4) - Yesterday
    {
        id: "aa32",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Xcode",
        timeSpent: 6.0,
        sessions: 11,
        date: "2026-01-25"
    },
    {
        id: "aa33",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "VS Code",
        timeSpent: 2.8,
        sessions: 18,
        date: "2026-01-25"
    },
    {
        id: "aa34",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        appName: "Terminal",
        timeSpent: 1.5,
        sessions: 10,
        date: "2026-01-25"
    },
    // Emma Rodriguez (m5) - Yesterday
    {
        id: "aa35",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Figma",
        timeSpent: 4.5,
        sessions: 8,
        date: "2026-01-25"
    },
    {
        id: "aa36",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "VS Code",
        timeSpent: 3.8,
        sessions: 13,
        date: "2026-01-25"
    },
    {
        id: "aa37",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        appName: "Chrome",
        timeSpent: 1.8,
        sessions: 11,
        date: "2026-01-25"
    }
]

// ============================================================================
// URL ACTIVITIES
// ============================================================================

export interface UrlActivityDetail {
    id: string
    title?: string
    url: string
    timeSpent: number // in hours
}

export interface UrlActivityEntry {
    id: string
    projectId: string
    projectName: string
    memberId: string
    site: string // URL atau domain
    timeSpent: number // in hours (total dari semua details)
    date: string
    details?: UrlActivityDetail[] // Detail URLs untuk expand
}

export const DUMMY_URL_ACTIVITIES: UrlActivityEntry[] = [
    // Antonio Galih (m1) - 26 Jan 2026
    {
        id: "ua1",
        projectId: "proj-1",
        projectName: "hans",
        memberId: "m1",
        site: "app.hubstaff.com",
        timeSpent: 0.0158,
        date: "2026-01-26",
        details: [
            { id: "ua1-d1", url: "https://app.hubstaff.com/dashboard", timeSpent: 0.0104 }, // 0:00:37
            { id: "ua1-d2", url: "https://app.hubstaff.com/reports", timeSpent: 0.0054 } // 0:00:20
        ]
    },
    {
        id: "ua1-support",
        projectId: "proj-1",
        projectName: "hans",
        memberId: "m1",
        site: "support.hubstaff.com",
        timeSpent: 0.0656, // 0:03:56
        date: "2026-01-26",
        details: [
            { id: "ua1-s1", url: "https://support.hubstaff.com/hubstaff-insights", timeSpent: 0.0431 }, // 0:02:37
            { id: "ua1-s2", url: "https://support.hubstaff.com/hubstaff-insights/getting-started", timeSpent: 0.0225 } // 0:01:19
        ]
    },
    {
        id: "ua2",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        site: "github.com",
        timeSpent: 2.5,
        date: "2026-01-26",
        details: [
            { id: "ua2-d1", url: "https://github.com/Presensi-New", timeSpent: 1.5 },
            { id: "ua2-d2", url: "https://github.com/Fauzan-Fz/Presensi-New", timeSpent: 1.0 }
        ]
    },
    {
        id: "ua3",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        site: "stackoverflow.com",
        timeSpent: 0.5,
        date: "2026-01-26",
        details: [
            { id: "ua3-d1", url: "https://stackoverflow.com/questions/12345", timeSpent: 0.3 },
            { id: "ua3-d2", url: "https://stackoverflow.com/questions/67890", timeSpent: 0.2 }
        ]
    },
    {
        id: "ua4",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m1",
        site: "docs.google.com",
        timeSpent: 1.2,
        date: "2026-01-26",
        details: [
            { id: "ua4-d1", url: "https://docs.google.com/document/d/abc123", timeSpent: 0.8 },
            { id: "ua4-d2", url: "https://docs.google.com/spreadsheets/d/def456", timeSpent: 0.4 }
        ]
    },
    // Lave Lavael (m2) - 26 Jan 2026
    {
        id: "ua5",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m2",
        site: "developer.android.com",
        timeSpent: 3.0,
        date: "2026-01-26",
        details: [
            { id: "ua5-d1", url: "https://developer.android.com/guide", timeSpent: 2.0 },
            { id: "ua5-d2", url: "https://developer.android.com/training", timeSpent: 1.0 }
        ]
    },
    {
        id: "ua6",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m2",
        site: "github.com",
        timeSpent: 1.5,
        date: "2026-01-26",
        details: [
            { id: "ua6-d1", url: "https://github.com/user/mobile-app", timeSpent: 1.0 },
            { id: "ua6-d2", url: "https://github.com/user/mobile-app/pulls", timeSpent: 0.5 }
        ]
    },
    {
        id: "ua7",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m2",
        site: "stackoverflow.com",
        timeSpent: 0.8,
        date: "2026-01-26",
        details: [
            { id: "ua7-d1", url: "https://stackoverflow.com/questions/android-123", timeSpent: 0.5 },
            { id: "ua7-d2", url: "https://stackoverflow.com/questions/android-456", timeSpent: 0.3 }
        ]
    },
    // Sarah Johnson (m3) - 26 Jan 2026
    {
        id: "ua8",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        site: "canva.com",
        timeSpent: 2.5,
        date: "2026-01-26",
        details: [
            { id: "ua8-d1", url: "https://www.canva.com/design/abc123", timeSpent: 1.5 },
            { id: "ua8-d2", url: "https://www.canva.com/design/def456", timeSpent: 1.0 }
        ]
    },
    {
        id: "ua9",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        site: "facebook.com",
        timeSpent: 1.0,
        date: "2026-01-26",
        details: [
            { id: "ua9-d1", url: "https://www.facebook.com/business", timeSpent: 0.6 },
            { id: "ua9-d2", url: "https://www.facebook.com/ads/manager", timeSpent: 0.4 }
        ]
    },
    {
        id: "ua10",
        projectId: "proj-3",
        projectName: "Marketing Campaign",
        memberId: "m3",
        site: "instagram.com",
        timeSpent: 0.5,
        date: "2026-01-26",
        details: [
            { id: "ua10-d1", url: "https://www.instagram.com/business", timeSpent: 0.3 },
            { id: "ua10-d2", url: "https://www.instagram.com/accounts/manager", timeSpent: 0.2 }
        ]
    },
    // Michael Chen (m4) - 26 Jan 2026
    {
        id: "ua11",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        site: "developer.apple.com",
        timeSpent: 4.0,
        date: "2026-01-26",
        details: [
            { id: "ua11-d1", url: "https://developer.apple.com/documentation", timeSpent: 2.5 },
            { id: "ua11-d2", url: "https://developer.apple.com/tutorials", timeSpent: 1.5 }
        ]
    },
    {
        id: "ua12",
        projectId: "proj-2",
        projectName: "Mobile App Development",
        memberId: "m4",
        site: "github.com",
        timeSpent: 2.0,
        date: "2026-01-26",
        details: [
            { id: "ua12-d1", url: "https://github.com/user/ios-app", timeSpent: 1.2 },
            { id: "ua12-d2", url: "https://github.com/user/ios-app/issues", timeSpent: 0.8 }
        ]
    },
    // Emma Rodriguez (m5) - 26 Jan 2026
    {
        id: "ua13",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        site: "figma.com",
        timeSpent: 3.5,
        date: "2026-01-26",
        details: [
            { id: "ua13-d1", url: "https://www.figma.com/design/8zCDmfpE2Rg5EEAf9KXTfb/Copy-Hubstaff?node-id=218-171&p=f&t=1MZEA6TUTTRayQX6-0", timeSpent: 2.0 },
            { id: "ua13-d2", url: "https://www.figma.com/design/8zCDmfpE2Rg5EEAf9KXTfb/Copy-Hubstaff?node-id=218-171&p=f&t=1MZEA6TUTTRayQX6-0", timeSpent: 1.5 }
        ]
    },
    {
        id: "ua14",
        projectId: "proj-1",
        projectName: "Website Redesign",
        memberId: "m5",
        site: "dribbble.com",
        timeSpent: 1.0,
        date: "2026-01-26",
        details: [
            { id: "ua14-d1", url: "https://dribbble.com/shots/12345", timeSpent: 0.6 },
            { id: "ua14-d2", url: "https://dribbble.com/shots/67890", timeSpent: 0.4 }
        ]
    },
    // Data untuk hari kemarin (25 Jan 2026)
    { id: "ua15", projectId: "proj-1", projectName: "Website Redesign", memberId: "m1", site: "github.com", timeSpent: 4.0, date: "2026-01-25" },
    { id: "ua16", projectId: "proj-1", projectName: "Website Redesign", memberId: "m1", site: "stackoverflow.com", timeSpent: 1.0, date: "2026-01-25" },
    { id: "ua17", projectId: "proj-2", projectName: "Mobile App Development", memberId: "m2", site: "developer.android.com", timeSpent: 5.0, date: "2026-01-25" },
    { id: "ua18", projectId: "proj-3", projectName: "Marketing Campaign", memberId: "m3", site: "canva.com", timeSpent: 3.0, date: "2026-01-25" },
    { id: "ua19", projectId: "proj-2", projectName: "Mobile App Development", memberId: "m4", site: "developer.apple.com", timeSpent: 5.5, date: "2026-01-25" },
    { id: "ua20", projectId: "proj-1", projectName: "Website Redesign", memberId: "m5", site: "figma.com", timeSpent: 4.5, date: "2026-01-25" },
    // Data untuk 27 Jan 2026
    { id: "ua21", projectId: "proj-1", projectName: "hans", memberId: "m1", site: "app.hubstaff.com", timeSpent: 0.02, date: "2026-01-27" },
    { id: "ua22", projectId: "proj-1", projectName: "Website Redesign", memberId: "m1", site: "github.com", timeSpent: 3.0, date: "2026-01-27" },
    { id: "ua23", projectId: "proj-2", projectName: "Mobile App Development", memberId: "m2", site: "developer.android.com", timeSpent: 4.5, date: "2026-01-27" },
    { id: "ua24", projectId: "proj-3", projectName: "Marketing Campaign", memberId: "m3", site: "canva.com", timeSpent: 2.0, date: "2026-01-27" },
    { id: "ua25", projectId: "proj-2", projectName: "Mobile App Development", memberId: "m4", site: "developer.apple.com", timeSpent: 4.5, date: "2026-01-27" },
    { id: "ua26", projectId: "proj-1", projectName: "Website Redesign", memberId: "m5", site: "figma.com", timeSpent: 3.0, date: "2026-01-27" }
]

// ============================================================================
// REPORT ACTIVITIES
// ============================================================================

export interface ReportActivityEntry {
    id: string
    date: string
    clientId: string
    clientName: string
    projectId: string
    projectName: string
    teamId: string
    teamName: string
    memberId: string
    memberName: string
    todoName: string
    regularHours: number
    totalHours: number
    activityPercent: number
    totalSpent: number
    regularSpent: number
    ptoHours: number
    holidayHours: number
}

// Helper to deterministically generate report data
function generateReportData(): ReportActivityEntry[] {
    const data: ReportActivityEntry[] = [];
    const startDate = new Date(2026, 0, 1); // Jan 1 2026
    const endDate = new Date(2026, 1, 28); // Feb 28 2026 (approx)

    // Seeded random for consistency across reloads (simple LCG)
    let seed = 12345;
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const projectRates: Record<string, number> = {
        "proj-1": 150000, "proj-2": 200000, "proj-3": 175000, "proj-4": 160000, "proj-5": 190000
    };

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

        const dateStr = d.toISOString().split('T')[0];

        // Ensure every member has some data most days
        for (const member of DUMMY_MEMBERS) {
            // 10% chance of absence
            if (random() > 0.9) continue;

            const baseHours = 4 + random() * 5; // 4 to 9 hours
            const activityPct = 40 + Math.floor(random() * 55); // 40-95%

            // Assign to a primary project for this day (simplification)
            // Ideally could be multiple, but we'll create 1 entry per member/day/project to keep it simpler for now,
            // or maybe 2 entries if they split time.

            // Let's split time between 1 or 2 projects
            const numEntries = random() > 0.7 ? 2 : 1;

            for (let i = 0; i < numEntries; i++) {
                // Pick random project
                const proj = DUMMY_PROJECTS[Math.floor(random() * DUMMY_PROJECTS.length)];
                if (!proj) continue; // Should not happen

                // Get Client
                const client = DUMMY_CLIENTS.find(c => c.id === proj.clientId);
                if (!client) continue;

                // Get Team (first team found for project or member)
                // Fallback to "All Teams" or specific team logic if needed
                // For simplicity, pick a random team that the member belongs to, OR the project map.
                // We'll use DUMMY_TEAMS finding.
                const team = DUMMY_TEAMS.find(t => t.members.includes(member.id));
                const teamId = team ? team.id : "t1";
                const teamName = team ? team.name : "Team Alpha";

                const entryHours = (baseHours / numEntries) * (0.8 + random() * 0.4); // Add variance
                // We will just store the hours here. Aggregation logic handles OT.
                // But `ReportActivityEntry` has `regularHours` field. We'll approximate.

                const rate = projectRates[proj.id] || 100000;

                data.push({
                    id: `ra-${dateStr}-${member.id}-${i}`,
                    date: dateStr || "",
                    clientId: client.id,
                    clientName: client.name || "Client",
                    projectId: proj.id,
                    projectName: proj.name || "Project",
                    teamId: teamId,
                    teamName: teamName,
                    memberId: member.id,
                    memberName: member.name,

                    todoName: (() => {
                        // Find tasks for this project
                        const projTasks = DUMMY_PROJECT_TASKS.filter(t => t.projectId === proj.id);
                        if (projTasks.length > 0) {
                            // Pick predictable random task based on seed
                            const taskIndex = Math.floor(random() * projTasks.length);
                            return projTasks[taskIndex]?.title || "Task";
                        }
                        return i === 0 ? "Development" : "Meeting/Review";
                    })(),
                    regularHours: parseFloat(entryHours.toFixed(2)), // Approx
                    totalHours: parseFloat(entryHours.toFixed(2)),
                    activityPercent: activityPct,
                    totalSpent: Math.floor(entryHours * rate),
                    regularSpent: Math.floor(entryHours * rate),
                    ptoHours: random() > 0.95 ? 8 : 0, // 5% chance of PTO
                    holidayHours: 0 // Default to 0, could add specific dates if needed
                });
            }
        }
    }
    return data;
}

export const DUMMY_REPORT_ACTIVITIES: ReportActivityEntry[] = generateReportData();

// ============================================================================
// PERFORMANCE DASHBOARD
// ============================================================================

export const DUMMY_MY_PERFORMANCE = {
    status: "Present",
    workedToday: "08:30",
    workedWeek: "32:15",
    attendanceRate: "95%",
    lateCount: 1,
    earnedToday: "Rp 450.000",
    earnedWeek: "Rp 2.250.000",
    projectsWorked: 3,
    activityToday: "87%",
    activityWeek: "85%"
}

// ============================================================================
// CUSTOM REPORTS
// ============================================================================

// ============================================================================
// CUSTOM REPORTS
// ============================================================================

export interface CustomReport {
    id: string
    name: string
    type: string
    lastModified: string
    scheduleDetails: string
    scheduleMeta: string // e.g., "Weekly | Mon | PDF"
    nextSchedule: string // e.g., "Next: Mon, Feb 2, 2026 9:00 am"
    status: 'Active' | 'Paused'

    // Detailed Schedule Data
    emails: string
    message: string
    fileType: 'pdf' | 'csv' | 'xls'
    dateRange: 'last-week' | 'last-month' | 'custom'
    frequency: 'daily' | 'weekly' | 'monthly'
    deliveryTime: string
    deliveryDays: string[]
}

export const DUMMY_CUSTOM_REPORTS: CustomReport[] = [
    {
        id: "cr-1",
        name: "Time and Activity",
        type: "Time & activity",
        lastModified: "Mon, Jan 26, 2026 11:51 am",
        scheduleDetails: "Weekly | Mon | PDF",
        scheduleMeta: "Weekly | Mon | PDF",
        nextSchedule: "Next: Mon, Feb 2, 2026 9:00 am",
        status: "Active",
        emails: "lavelavael@gmail.com",
        message: "We've prepared your latest report. Contact support if you have any questions or need assistance.",
        fileType: "pdf",
        dateRange: "last-week",
        frequency: "weekly",
        deliveryTime: "09:00",
        deliveryDays: ["Mo"]
    },
    {
        id: "cr-2",
        name: "Weekly Project Budget",
        type: "Project Budget",
        lastModified: "Fri, Jan 23, 2026 4:30 pm",
        scheduleDetails: "Weekly | Fri | CSV",
        scheduleMeta: "Weekly | Fri | CSV",
        nextSchedule: "Next: Fri, Jan 30, 2026 5:00 pm",
        status: "Active",
        emails: "finance@ubig.co.id",
        message: "Weekly budget overview attached.",
        fileType: "csv",
        dateRange: "last-week",
        frequency: "weekly",
        deliveryTime: "17:00",
        deliveryDays: ["Fr"]
    },
    {
        id: "cr-3",
        name: "Monthly Attendance",
        type: "Attendance",
        lastModified: "Jan 1, 2026 10:00 am",
        scheduleDetails: "Monthly | 1st | PDF",
        scheduleMeta: "Monthly | 1st | PDF",
        nextSchedule: "Next: Sun, Feb 1, 2026 9:00 am",
        status: "Paused",
        emails: "hr@ubig.co.id",
        message: "Monthly attendance report.",
        fileType: "pdf",
        dateRange: "last-month",
        frequency: "monthly",
        deliveryTime: "09:00",
        deliveryDays: ["Mo"]
    }
]
