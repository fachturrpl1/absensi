// Dummy data for Smart Notifications
import * as LucideIcons from 'lucide-react'

export interface NotificationTemplate {
    id: string
    name: string
    description: string
    frequency: 'hourly' | 'daily' | 'weekly'
    delivery: ('email' | 'insights' | 'slack')[]
    iconName: keyof typeof LucideIcons // Lucide React icon name
    color: string // for card background
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

// Helper functions
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

