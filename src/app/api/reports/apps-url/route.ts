import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

async function getMemberIds(supabase: any, organizationId: string, memberId?: string): Promise<number[]> {
    if (memberId && memberId !== 'all') return [Number(memberId)]

    const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', Number(organizationId))

    if (error) throw error
    return (data || []).map((m: any) => m.id)
}

// GET /api/reports/apps-url?type=apps|urls&organizationId=...&memberId=...&startDate=...&endDate=...
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const type = searchParams.get('type') ?? 'apps'
        const organizationId = searchParams.get('organizationId')
        const memberId = searchParams.get('memberId') ?? 'all'
        const startDate = searchParams.get('startDate') ?? undefined
        const endDate = searchParams.get('endDate') ?? undefined

        if (!organizationId) {
            return NextResponse.json({ success: false, message: 'organizationId is required' }, { status: 400 })
        }

        const supabase = createAdminClient()
        const memberIds = await getMemberIds(supabase, organizationId, memberId)

        if (memberIds.length === 0) {
            return NextResponse.json({ success: true, data: [] })
        }

        if (type === 'apps') {
            let query = supabase
                .from('tool_usages')
                .select(`
                    id,
                    tool_name,
                    tracked_seconds,
                    usage_date,
                    project_id,
                    is_productive,
                    organization_member_id,
                    organization_members (
                        id,
                        user_profiles (
                            display_name,
                            first_name,
                            last_name,
                            email
                        )
                    ),
                    projects ( name )
                `)
                .in('organization_member_id', memberIds)

            if (startDate) query = query.gte('usage_date', startDate)
            if (endDate) query = query.lte('usage_date', endDate)

            const { data, error } = await query.order('usage_date', { ascending: false })
            if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

            const mapped = (data || []).map((row: any) => {
                const profile = row.organization_members?.user_profiles
                let memberName = `Member #${row.organization_members?.id}`
                if (profile) {
                    const dName = (profile.display_name || '').trim()
                    const fName = (profile.first_name || '').trim()
                    const lName = (profile.last_name || '').trim()
                    if (dName) memberName = dName
                    else if (fName || lName) memberName = `${fName} ${lName}`.trim()
                    else if (profile.email) memberName = profile.email
                }
                // Normalize boolean → string enum
                let productivity: string
                if (row.is_productive === true) productivity = 'core-work'
                else if (row.is_productive === false) productivity = 'unproductive'
                else productivity = 'non-core-work'

                return {
                    id: String(row.id),
                    name: row.tool_name || 'Unknown',
                    category: productivity,
                    projectName: row.projects?.name || 'Unassigned',
                    memberId: String(row.organization_member_id),
                    memberName,
                    date: row.usage_date,
                    timeSpent: (row.tracked_seconds || 0) / 60,
                    isProductive: productivity
                }
            })

            return NextResponse.json({ success: true, data: mapped })
        }

        // type === 'urls'
        const getBaseDomain = (fullUrl: string) => {
            try {
                let checkUrl = fullUrl
                if (!checkUrl.startsWith('http')) checkUrl = 'http://' + checkUrl
                const urlObj = new URL(checkUrl)
                return urlObj.hostname.replace(/^www\./, '')
            } catch {
                return fullUrl.split('/')[0] || fullUrl
            }
        }

        let query = supabase
            .from('url_visits')
            .select(`
                id,
                url,
                domain,
                title,
                tracked_seconds,
                visit_date,
                project_id,
                is_productive,
                organization_member_id,
                organization_members (
                    id,
                    user_profiles (
                        display_name,
                        first_name,
                        last_name,
                        email
                    )
                ),
                projects ( name )
            `)
            .in('organization_member_id', memberIds)

        if (startDate) query = query.gte('visit_date', startDate)
        if (endDate) query = query.lte('visit_date', endDate)

        const { data, error } = await query.order('visit_date', { ascending: false })
        if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

        const mapped = (data || []).map((row: any) => {
            const profile = row.organization_members?.user_profiles
            let memberName = `Member #${row.organization_members?.id}`
            if (profile) {
                const dName = (profile.display_name || '').trim()
                const fName = (profile.first_name || '').trim()
                const lName = (profile.last_name || '').trim()
                if (dName) memberName = dName
                else if (fName || lName) memberName = `${fName} ${lName}`.trim()
                else if (profile.email) memberName = profile.email
            }
            // is_productive is already string enum: 'core-work' | 'non-core-work' | 'unproductive'
            const productivity = row.is_productive || 'unproductive'

            return {
                id: String(row.id),
                site: row.domain || getBaseDomain(row.url || ''),
                title: row.title || row.url || '',
                projectName: row.projects?.name || 'Unassigned',
                memberId: String(row.organization_member_id),
                memberName,
                date: row.visit_date,
                timeSpent: (row.tracked_seconds || 0) / 60,
                isProductive: productivity
            }
        })

        return NextResponse.json({ success: true, data: mapped })

    } catch (err: any) {
        console.error('[GET /api/reports/apps-url]', err)
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
}
