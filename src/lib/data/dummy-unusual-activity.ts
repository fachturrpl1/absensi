// Dummy data for Unusual Activity page

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

// Helper functions
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
