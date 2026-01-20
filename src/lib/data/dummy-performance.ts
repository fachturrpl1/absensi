// Dummy data for Performance page

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

// Utilization data for different members
export const DUMMY_UTILIZATION_DATA: UtilizationData[] = [
    { dailyWorkHours: 8.0, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm2', date: '2026-01-19' }, // Lave
    { dailyWorkHours: 7.5, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm1', date: '2026-01-19' }, // Antonio
    { dailyWorkHours: 8.2, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm3', date: '2026-01-19' }, // Sarah
    { dailyWorkHours: 7.8, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm4', date: '2026-01-19' }, // Michael
    { dailyWorkHours: 7.3, targetHours: 8.0, avgDailyTarget: 8.0, memberId: 'm5', date: '2026-01-19' }, // Emma
    { dailyWorkHours: 8.5, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't1', date: '2026-01-19' }, // Alpha
    { dailyWorkHours: 7.9, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't2', date: '2026-01-19' }, // Beta
    { dailyWorkHours: 8.1, targetHours: 8.0, avgDailyTarget: 8.0, teamId: 't3', date: '2026-01-19' }  // Gamma
]

export const DUMMY_WORK_TIME_CLASSIFICATION: WorkTimeClassification[] = [
    // Lave Lavael
    { category: 'Productive', percentage: 65, color: '#10b981', memberId: 'm2', date: '2026-01-19' },
    { category: 'Neutral', percentage: 25, color: '#f59e0b', memberId: 'm2', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm2', date: '2026-01-19' },
    // Antonio Galih
    { category: 'Productive', percentage: 70, color: '#10b981', memberId: 'm1', date: '2026-01-19' },
    { category: 'Neutral', percentage: 20, color: '#f59e0b', memberId: 'm1', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm1', date: '2026-01-19' },
    // Sarah Johnson
    { category: 'Productive', percentage: 75, color: '#10b981', memberId: 'm3', date: '2026-01-19' },
    { category: 'Neutral', percentage: 18, color: '#f59e0b', memberId: 'm3', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 7, color: '#ef4444', memberId: 'm3', date: '2026-01-19' },
    // Michael Chen
    { category: 'Productive', percentage: 68, color: '#10b981', memberId: 'm4', date: '2026-01-19' },
    { category: 'Neutral', percentage: 22, color: '#f59e0b', memberId: 'm4', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm4', date: '2026-01-19' },
    // Emma Rodriguez
    { category: 'Productive', percentage: 62, color: '#10b981', memberId: 'm5', date: '2026-01-19' },
    { category: 'Neutral', percentage: 28, color: '#f59e0b', memberId: 'm5', date: '2026-01-19' },
    { category: 'Unproductive', percentage: 10, color: '#ef4444', memberId: 'm5', date: '2026-01-19' }
]

export const DUMMY_DAILY_FOCUS: DailyFocusData[] = [
    // Lave Lavael
    { date: '2026-01-13', focusHours: 6.5, distractionHours: 1.5, memberId: 'm2' },
    { date: '2026-01-14', focusHours: 5.8, distractionHours: 2.2, memberId: 'm2' },
    { date: '2026-01-15', focusHours: 7.2, distractionHours: 0.8, memberId: 'm2' },
    { date: '2026-01-16', focusHours: 6.0, distractionHours: 2.0, memberId: 'm2' },
    { date: '2026-01-17', focusHours: 6.8, distractionHours: 1.2, memberId: 'm2' },
    { date: '2026-01-18', focusHours: 5.5, distractionHours: 2.5, memberId: 'm2' },
    { date: '2026-01-19', focusHours: 7.5, distractionHours: 0.5, memberId: 'm2' },
    // Antonio Galih
    { date: '2026-01-13', focusHours: 5.5, distractionHours: 2.5, memberId: 'm1' },
    { date: '2026-01-14', focusHours: 6.8, distractionHours: 1.2, memberId: 'm1' },
    { date: '2026-01-15', focusHours: 6.2, distractionHours: 1.8, memberId: 'm1' },
    { date: '2026-01-16', focusHours: 7.0, distractionHours: 1.0, memberId: 'm1' },
    { date: '2026-01-17', focusHours: 5.8, distractionHours: 2.2, memberId: 'm1' },
    { date: '2026-01-18', focusHours: 6.5, distractionHours: 1.5, memberId: 'm1' },
    { date: '2026-01-19', focusHours: 7.2, distractionHours: 0.8, memberId: 'm1' },
    // Sarah Johnson
    { date: '2026-01-13', focusHours: 7.0, distractionHours: 1.0, memberId: 'm3' },
    { date: '2026-01-14', focusHours: 6.5, distractionHours: 1.5, memberId: 'm3' },
    { date: '2026-01-15', focusHours: 7.5, distractionHours: 0.5, memberId: 'm3' },
    { date: '2026-01-16', focusHours: 6.8, distractionHours: 1.2, memberId: 'm3' },
    { date: '2026-01-17', focusHours: 7.2, distractionHours: 0.8, memberId: 'm3' },
    { date: '2026-01-18', focusHours: 6.3, distractionHours: 1.7, memberId: 'm3' },
    { date: '2026-01-19', focusHours: 7.8, distractionHours: 0.2, memberId: 'm3' },
    // Michael Chen
    { date: '2026-01-13', focusHours: 6.2, distractionHours: 1.8, memberId: 'm4' },
    { date: '2026-01-14', focusHours: 6.0, distractionHours: 2.0, memberId: 'm4' },
    { date: '2026-01-15', focusHours: 6.8, distractionHours: 1.2, memberId: 'm4' },
    { date: '2026-01-16', focusHours: 6.5, distractionHours: 1.5, memberId: 'm4' },
    { date: '2026-01-17', focusHours: 7.0, distractionHours: 1.0, memberId: 'm4' },
    { date: '2026-01-18', focusHours: 6.2, distractionHours: 1.8, memberId: 'm4' },
    { date: '2026-01-19', focusHours: 7.3, distractionHours: 0.7, memberId: 'm4' },
    // Emma Rodriguez
    { date: '2026-01-13', focusHours: 5.8, distractionHours: 2.2, memberId: 'm5' },
    { date: '2026-01-14', focusHours: 6.2, distractionHours: 1.8, memberId: 'm5' },
    { date: '2026-01-15', focusHours: 6.5, distractionHours: 1.5, memberId: 'm5' },
    { date: '2026-01-16', focusHours: 6.0, distractionHours: 2.0, memberId: 'm5' },
    { date: '2026-01-17', focusHours: 6.8, distractionHours: 1.2, memberId: 'm5' },
    { date: '2026-01-18', focusHours: 5.5, distractionHours: 2.5, memberId: 'm5' },
    { date: '2026-01-19', focusHours: 7.0, distractionHours: 1.0, memberId: 'm5' }
]

export const DUMMY_ACTIVITY: ActivityData[] = [
    // Lave Lavael
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
    // Antonio Galih
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
    // Sarah Johnson
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
    // Lave Lavael
    { name: 'VS Code', timeSpent: 180, category: 'Development', memberId: 'm2', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 120, category: 'Browser', memberId: 'm2', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 60, category: 'Communication', memberId: 'm2', date: '2026-01-19' },
    { name: 'Figma', timeSpent: 90, category: 'Design', memberId: 'm2', date: '2026-01-19' },
    { name: 'Terminal', timeSpent: 45, category: 'Development', memberId: 'm2', date: '2026-01-19' },
    // Antonio Galih
    { name: 'IntelliJ IDEA', timeSpent: 200, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 90, category: 'Browser', memberId: 'm1', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 45, category: 'Communication', memberId: 'm1', date: '2026-01-19' },
    { name: 'Postman', timeSpent: 60, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    { name: 'Docker', timeSpent: 50, category: 'Development', memberId: 'm1', date: '2026-01-19' },
    // Sarah Johnson
    { name: 'Figma', timeSpent: 220, category: 'Design', memberId: 'm3', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 100, category: 'Browser', memberId: 'm3', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 50, category: 'Communication', memberId: 'm3', date: '2026-01-19' },
    { name: 'Photoshop', timeSpent: 80, category: 'Design', memberId: 'm3', date: '2026-01-19' },
    { name: 'Notion', timeSpent: 40, category: 'Productivity', memberId: 'm3', date: '2026-01-19' },
    // Michael Chen
    { name: 'VS Code', timeSpent: 190, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    { name: 'Chrome', timeSpent: 110, category: 'Browser', memberId: 'm4', date: '2026-01-19' },
    { name: 'Terminal', timeSpent: 70, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    { name: 'Slack', timeSpent: 55, category: 'Communication', memberId: 'm4', date: '2026-01-19' },
    { name: 'GitHub Desktop', timeSpent: 35, category: 'Development', memberId: 'm4', date: '2026-01-19' },
    // Emma Rodriguez
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
    // Lave Lavael
    { name: 'Development', percentage: 45, hours: 18.0, color: '#3b82f6', memberId: 'm2', date: '2026-01-19' },
    { name: 'Communication', percentage: 20, hours: 8.0, color: '#10b981', memberId: 'm2', date: '2026-01-19' },
    { name: 'Design', percentage: 15, hours: 6.0, color: '#8b5cf6', memberId: 'm2', date: '2026-01-19' },
    { name: 'Documentation', percentage: 12, hours: 4.8, color: '#f59e0b', memberId: 'm2', date: '2026-01-19' },
    { name: 'Meetings', percentage: 8, hours: 3.2, color: '#ef4444', memberId: 'm2', date: '2026-01-19' },
    // Antonio Galih
    { name: 'Development', percentage: 50, hours: 20.0, color: '#3b82f6', memberId: 'm1', date: '2026-01-19' },
    { name: 'Communication', percentage: 15, hours: 6.0, color: '#10b981', memberId: 'm1', date: '2026-01-19' },
    { name: 'Testing', percentage: 20, hours: 8.0, color: '#8b5cf6', memberId: 'm1', date: '2026-01-19' },
    { name: 'Documentation', percentage: 10, hours: 4.0, color: '#f59e0b', memberId: 'm1', date: '2026-01-19' },
    { name: 'Meetings', percentage: 5, hours: 2.0, color: '#ef4444', memberId: 'm1', date: '2026-01-19' },
    // Sarah Johnson
    { name: 'Design', percentage: 55, hours: 22.0, color: '#8b5cf6', memberId: 'm3', date: '2026-01-19' },
    { name: 'Communication', percentage: 18, hours: 7.2, color: '#10b981', memberId: 'm3', date: '2026-01-19' },
    { name: 'Research', percentage: 15, hours: 6.0, color: '#3b82f6', memberId: 'm3', date: '2026-01-19' },
    { name: 'Meetings', percentage: 7, hours: 2.8, color: '#ef4444', memberId: 'm3', date: '2026-01-19' },
    { name: 'Documentation', percentage: 5, hours: 2.0, color: '#f59e0b', memberId: 'm3', date: '2026-01-19' },
    // Michael Chen
    { name: 'Development', percentage: 48, hours: 19.2, color: '#3b82f6', memberId: 'm4', date: '2026-01-19' },
    { name: 'Code Review', percentage: 22, hours: 8.8, color: '#8b5cf6', memberId: 'm4', date: '2026-01-19' },
    { name: 'Communication', percentage: 16, hours: 6.4, color: '#10b981', memberId: 'm4', date: '2026-01-19' },
    { name: 'Meetings', percentage: 9, hours: 3.6, color: '#ef4444', memberId: 'm4', date: '2026-01-19' },
    { name: 'Documentation', percentage: 5, hours: 2.0, color: '#f59e0b', memberId: 'm4', date: '2026-01-19' },
    // Emma Rodriguez
    { name: 'Analysis', percentage: 40, hours: 16.0, color: '#3b82f6', memberId: 'm5', date: '2026-01-19' },
    { name: 'Meetings', percentage: 25, hours: 10.0, color: '#ef4444', memberId: 'm5', date: '2026-01-19' },
    { name: 'Communication', percentage: 20, hours: 8.0, color: '#10b981', memberId: 'm5', date: '2026-01-19' },
    { name: 'Reporting', percentage: 10, hours: 4.0, color: '#f59e0b', memberId: 'm5', date: '2026-01-19' },
    { name: 'Research', percentage: 5, hours: 2.0, color: '#8b5cf6', memberId: 'm5', date: '2026-01-19' }
]

// Helper function to get member ID from name
export function getMemberIdFromName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-')
}

