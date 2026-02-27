'use server'

import { createClient } from '@/utils/supabase/server'
import type { UrlActivityEntry } from '@/lib/data/dummy-data'

export async function getUrlsActivityByMemberAndDate(
    organizationMemberId: string,
    startDate: string,
    endDate: string,
    projectId?: string
): Promise<{ success: boolean; data?: UrlActivityEntry[]; message?: string }> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from('url_visits')
            .select(`
        id,
        url,
        title,
        tracked_seconds,
        visit_date,
        project_id,
        projects ( name )
      `)
            .eq('organization_member_id', Number(organizationMemberId))
            .gte('visit_date', startDate)
            .lte('visit_date', endDate)

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

        // Helper to extract base domain (site) from full URL
        const getBaseDomain = (fullUrl: string) => {
            try {
                // handle cases where url might not have http/https prefix
                let checkUrl = fullUrl
                if (!checkUrl.startsWith('http')) {
                    checkUrl = 'http://' + checkUrl
                }
                const urlObj = new URL(checkUrl)
                return urlObj.hostname.replace(/^www\./, '')
            } catch (e) {
                // fallback
                return fullUrl.split('/')[0] || fullUrl
            }
        }

        // Grouping by date -> project -> site
        type GroupKey = string // "date|project_id|site"
        const map = new Map<GroupKey, UrlActivityEntry>()

        data.forEach((row: any) => {
            const dateKey = row.visit_date
            const pId = row.project_id ? String(row.project_id) : 'unassigned'
            const rawUrl = row.url || ''
            const site = getBaseDomain(rawUrl)
            const key = `${dateKey}|${pId}|${site}`

            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    projectId: pId,
                    projectName: row.projects?.name || 'Unassigned',
                    memberId: organizationMemberId,
                    site: site,
                    timeSpent: 0,
                    date: dateKey,
                    details: []
                })
            }

            const entry = map.get(key)!
            const timeInHours = (row.tracked_seconds || 0) / 3600
            entry.timeSpent += timeInHours

            // Add to details
            if (entry.details) {
                entry.details.push({
                    id: String(row.id),
                    url: rawUrl,
                    title: row.title || rawUrl,
                    timeSpent: timeInHours
                })
            }
        })

        return {
            success: true,
            data: Array.from(map.values())
        }

    } catch (err: any) {
        console.error('Error in getUrlsActivityByMemberAndDate:', err)
        return { success: false, message: err.message || 'Failed to fetch urls activity' }
    }
}
