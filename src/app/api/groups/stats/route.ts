import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/groups/stats
 *
 * Query params:
 *   - organizationId: number (required)
 *   - groupId: string | "null"  ("null" = members with no department)
 *
 * Returns:
 *   { totalMembers, activeMembers, todayPresent, todayAbsent }
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const groupId = searchParams.get('groupId') // "null" | "<id>"

        if (!organizationId) {
            return NextResponse.json(
                { success: false, message: 'organizationId is required' },
                { status: 400 }
            )
        }

        const orgId = parseInt(organizationId, 10)
        if (isNaN(orgId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid organizationId' },
                { status: 400 }
            )
        }

        const admin = createAdminClient()

        // ── Build base member ID query ───────────────────────────────────────
        const buildMemberQuery = (activeOnly?: boolean) => {
            let q = admin
                .from('organization_members')
                .select('id', { count: 'exact', head: false })
                .eq('organization_id', orgId)

            if (groupId === 'null' || !groupId) {
                q = q.is('department_id', null)
            } else {
                q = q.eq('department_id', groupId)
            }

            if (activeOnly) {
                q = q.eq('is_active', true)
            }

            return q
        }

        // ── Run total and active count in parallel ────────────────────────────
        const [totalResult, activeResult] = await Promise.all([
            buildMemberQuery(),
            buildMemberQuery(true),
        ])

        const totalMembers = totalResult.count ?? 0
        const activeMembers = activeResult.count ?? 0

        // ── Get member IDs for attendance lookup ─────────────────────────────
        let memberIds: string[] = []

        if (totalMembers > 0) {
            let memberIdQuery = admin
                .from('organization_members')
                .select('id')
                .eq('organization_id', orgId)

            if (groupId === 'null' || !groupId) {
                memberIdQuery = memberIdQuery.is('department_id', null)
            } else {
                memberIdQuery = memberIdQuery.eq('department_id', groupId)
            }

            const { data: memberRows } = await memberIdQuery
            memberIds = (memberRows ?? []).map((m: any) => m.id as string)
        }

        // ── Fetch today's attendance records ─────────────────────────────────
        let todayPresent = 0
        let todayAbsent = 0

        if (memberIds.length > 0) {
            // Use WIB (UTC+7) for "today" calculation
            const now = new Date()
            const wibOffset = 7 * 60 // minutes
            const wibDate = new Date(now.getTime() + wibOffset * 60 * 1000)
            const today = wibDate.toISOString().split('T')[0]

            const { data: records } = await admin
                .from('attendance_records')
                .select('status')
                .in('organization_member_id', memberIds)
                .eq('attendance_date', today)

            for (const rec of records ?? []) {
                const s = rec.status as string | null
                if (s === 'present' || s === 'late' || s === 'excused') {
                    todayPresent++
                } else if (s === 'absent') {
                    todayAbsent++
                }
            }
        }

        return NextResponse.json(
            {
                success: true,
                totalMembers,
                activeMembers,
                todayPresent,
                todayAbsent,
            },
            {
                headers: {
                    'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
                    'Vary': 'Cookie',
                },
            }
        )
    } catch (err) {
        console.error('[API /api/groups/stats] error:', err)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch group stats' },
            { status: 500 }
        )
    }
}
