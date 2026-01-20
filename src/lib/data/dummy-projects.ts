// Dummy Projects Data
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
