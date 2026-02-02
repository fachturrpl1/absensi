export interface AuditLogEntry {
    id: string
    date: string // ISO string "YYYY-MM-DD"
    time: string // "HH:mm:ss am/pm"
    author: {
        name: string
        avatar?: string
        initials: string
        color: string
    }
    action: 'Added' | 'Created' | 'Updated' | 'Deleted' | 'Removed'
    object: string
    members?: {
        name: string
        avatar?: string
        initials: string
        color: string
    }[]
    details: string
}

export const DUMMY_AUDIT_LOGS: AuditLogEntry[] = [
    {
        id: '#LOG-2026-001',
        date: '2026-01-30',
        time: '09:15:22 am',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'Created',
        object: 'Client',
        details: 'New client "Tech Solutions Inc." registered',
    },
    {
        id: '#LOG-2026-002',
        date: '2026-01-30',
        time: '09:10:05 am',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'Added',
        object: 'Project',
        details: 'Project "Mobile App Revamp" assigned to "Tech Solutions Inc."',
    },
    {
        id: '#LOG-2026-003',
        date: '2026-01-29',
        time: '4:45:10 pm',
        author: { name: 'Sarah Johnson', initials: 'SJ', color: 'bg-gray-500' },
        action: 'Updated',
        object: 'Timesheet',
        details: 'Approved timesheet for week Jan 19-25',
    },
    {
        id: '#LOG-2026-004',
        date: '2026-01-29',
        time: '2:30:00 pm',
        author: { name: 'Lave Lavael', initials: 'LL', color: 'bg-zinc-500' },
        action: 'Deleted',
        object: 'Expense',
        details: 'Removed duplicate expense entry #EXP-2024-001',
    },
    {
        id: '#LOG-2026-005',
        date: '2026-01-28',
        time: '11:20:15 am',
        author: { name: 'Emma Rodriguez', initials: 'ER', color: 'bg-neutral-500' },
        action: 'Updated',
        object: 'Team',
        members: [
            { name: 'Michael Chen', initials: 'MC', color: 'bg-stone-500' }
        ],
        details: 'Role changed to "Team Lead" for "Marketing" squad',
    },
    {
        id: '#LOG-2026-006',
        date: '2026-01-28',
        time: '10:05:44 am',
        author: { name: 'Emma Rodriguez', initials: 'ER', color: 'bg-neutral-500' },
        action: 'Added',
        object: 'Team',
        members: [
            { name: 'Michael Chen', initials: 'MC', color: 'bg-stone-500' },
            { name: 'Lave Lavael', initials: 'LL', color: 'bg-zinc-500' }
        ],
        details: 'Added members to "Marketing" squad',
    },
    {
        id: '#LOG-2026-007',
        date: '2026-01-27',
        time: '3:15:30 pm',
        author: { name: 'Michael Chen', initials: 'MC', color: 'bg-stone-500' },
        action: 'Updated',
        object: 'Policy',
        details: 'Updated "Remote Work" policy description',
    },
    {
        id: '#LOG-2026-008',
        date: '2026-01-27',
        time: '1:00:00 pm',
        author: { name: 'Antonio Galih', initials: 'AG', color: 'bg-slate-500' },
        action: 'Created',
        object: 'Report',
        details: 'Generated "Monthly Financial Summary" report',
    }
]
