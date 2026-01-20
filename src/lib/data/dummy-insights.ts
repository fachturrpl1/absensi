// Dummy Highlights/Insights Data
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

// Re-export the UnusualActivityEntry type from the dedicated file
export type { UnusualActivityEntry as UnusualActivity } from './dummy-unusual-activity'


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

// Re-export unusual activities from the dedicated file to maintain consistency
// This allows both highlights page and unusual-activity page to use the same data
export { DUMMY_UNUSUAL_ACTIVITIES } from './dummy-unusual-activity'
