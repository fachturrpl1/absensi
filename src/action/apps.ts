'use server'

import { createClient } from '@/utils/supabase/server'
import type { AppActivityEntry } from '@/lib/data/dummy-data' // Assuming we keep the type for now

export async function getAppsActivityByMemberAndDate(
    organizationMemberId: string,
    startDate: string,
    endDate: string,
    projectId?: string
): Promise<{ success: boolean; data?: AppActivityEntry[]; message?: string }> {
    try {
        const supabase = await createClient()

        // First, let's fetch tool usages for the member in the date range
        let query = supabase
            .from('tool_usages')
            .select(`
        id,
        tool_name,
        tracked_seconds,
        activations,
        usage_date,
        project_id,
        projects ( name )
      `)
            .eq('organization_member_id', Number(organizationMemberId))
            .gte('usage_date', startDate)
            .lte('usage_date', endDate)

        if (projectId && projectId !== 'all') {
            query = query.eq('project_id', Number(projectId))
        }

        const { data, error } = await query

        if (error) {
            throw error
        }

        if (!data || data.length === 0) {
            return { success: true, data: [] }
        }

        // Aggregate data grouped by: usage_date, project_id, tool_name
        type GroupKey = string // format: "date|project_id|tool_name"
        const map = new Map<GroupKey, AppActivityEntry>()

        data.forEach((row: any) => {
            const dateKey = row.usage_date
            const pId = row.project_id ? String(row.project_id) : 'unassigned'
            const toolName = row.tool_name || 'Unknown App'
            const key = `${dateKey}|${pId}|${toolName}`

            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    projectId: pId,
                    projectName: row.projects?.name || 'Unassigned',
                    appName: toolName,
                    timeSpent: 0, // will be in hours
                    sessions: 0,
                    memberId: organizationMemberId,
                    date: dateKey
                })
            }

            const entry = map.get(key)!
            // Convert seconds to hours for timeSpent
            entry.timeSpent += (row.tracked_seconds || 0) / 3600
            entry.sessions += (row.activations || 0)
        })

        return {
            success: true,
            data: Array.from(map.values())
        }

    } catch (err: any) {
        console.error('Error in getAppsActivityByMemberAndDate:', err)
        return { success: false, message: err.message || 'Failed to fetch apps activity' }
    }
}
