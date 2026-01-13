import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(req: Request) {
    const started = Date.now()
    try {
        const { searchParams } = new URL(req.url)
        const limitParam = searchParams.get('limit')
        const pageParam = searchParams.get('page')
        const orgParam = searchParams.get('organizationId')

        // Filters
        const searchParam = searchParams.get('search')
        const deptParam = searchParams.get('department')
        let statusParam = searchParams.get('status') // 'all', 'complete', 'partial', 'unregistered'

        // Normalize input
        if (statusParam) {
            statusParam = statusParam.toLowerCase().trim()
            if (statusParam === 'not_registered') statusParam = 'unregistered'
        }

        const limit = parseInt(limitParam || '10', 10) || 10
        const page = parseInt(pageParam || '1', 10) || 1

        const supabase = await createClient()
        const admin = createAdminClient()

        // 1. Resolve Organization
        let organizationId: number | null = orgParam ? Number(orgParam) : null
        if (!organizationId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: member } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .maybeSingle()
                if (member?.organization_id) organizationId = Number(member.organization_id)
            }
        }

        if (!organizationId) {
            return NextResponse.json({ success: true, data: [], pagination: { total: 0 } })
        }

        // 2. Fetch ALL Members that match Search & Dept (Database Filter)
        let allMembers: any[] = []
        let rangeFrom = 0
        const step = 1000

        // Base Query for members
        const buildMemberQuery = () => {
            let q = admin
                .from('organization_members')
                .select(`
            id,
            user_id,
            department_id,
            organization_id,
            is_active,
            user_profiles!inner (
              first_name,
              last_name,
              display_name,
              phone,
              email
            )
          `)
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .order('id', { ascending: true }) // Deterministic ordering

            if (searchParam) {
                q = q.or(`display_name.ilike.%${searchParam}%,first_name.ilike.%${searchParam}%,last_name.ilike.%${searchParam}%`, { foreignTable: 'user_profiles' })
            }

            return q
        }

        // Dept filter (Pre-resolve dept ID to keep query simple)
        let targetDeptId: number | null = null
        if (deptParam && deptParam !== 'All Groups') {
            const { data: dept } = await admin
                .from('organization_departments')
                .select('id')
                .eq('organization_id', organizationId)
                .ilike('name', deptParam)
                .maybeSingle()
            if (dept) targetDeptId = dept.id
            else return NextResponse.json({ success: true, data: [], pagination: { total: 0 } }) // Dept not found -> Empty result
        }

        // Loop fetch members
        while (true) {
            let q = buildMemberQuery()
            if (targetDeptId) q = q.eq('department_id', targetDeptId)

            const { data: chunk, error } = await q.range(rangeFrom, rangeFrom + step - 1)

            if (error) {
                console.error('Fetch members error:', error)
                throw error
            }

            if (chunk && chunk.length > 0) {
                allMembers.push(...chunk)
                if (chunk.length < step) break
                rangeFrom += step
            } else {
                break
            }
        }

        const memberIds = allMembers.map(m => m.id)

        // 3. Fetch Biometric Data for these Members (Fetch All matching - Loop if needed)
        const bioMap = new Map<number, Set<number>>()

        if (memberIds.length > 0) {
            const bioChunkSize = 500
            for (let i = 0; i < memberIds.length; i += bioChunkSize) {
                const idChunk = memberIds.slice(i, i + bioChunkSize)
                const { data: bios } = await admin
                    .from('biometric_data')
                    .select('organization_member_id, finger_number, template_data, biometric_type, is_active, created_at, enrollment_date')
                    .in('organization_member_id', idChunk)
                    .eq('is_active', true)

                if (bios) {
                    // Group by member
                    type BioRow = typeof bios[0]
                    const memberBios = new Map<number, BioRow[]>()

                    bios.forEach(b => {
                        // JS Filter for flexible parsing
                        const type = b.biometric_type || ''
                        if (type.toLowerCase().includes('fingerprint') || type.toUpperCase() === 'FINGERPRINT') {
                            if (!memberBios.has(b.organization_member_id)) memberBios.set(b.organization_member_id, [])
                            memberBios.get(b.organization_member_id)!.push(b)
                        }
                    })

                    // Calc logic
                    for (const [mid, rows] of memberBios.entries()) {
                        // Sort by date
                        rows.sort((a, b) => {
                            const da = a.enrollment_date || a.created_at || ''
                            const db = b.enrollment_date || b.created_at || ''
                            return da.localeCompare(db)
                        })

                        const set = new Set<number>()
                        rows.forEach((row, idx) => {
                            // Check local ID
                            let hasLocalId = false
                            try {
                                const t = typeof row.template_data === 'string' ? JSON.parse(row.template_data) : row.template_data
                                if (t && (t as any).local_id) hasLocalId = true
                            } catch { }

                            let fn = row.finger_number
                            if (hasLocalId || fn === 1 || fn === 2) {
                                if (fn !== 1 && fn !== 2) {
                                    // Logic Fallback
                                    const candidate = idx + 1
                                    if (candidate === 1 || candidate === 2) fn = candidate
                                }
                                if (fn === 1 || fn === 2) set.add(fn)
                            }
                        })

                        if (set.size > 0) bioMap.set(mid, set)
                    }
                }
            }
        }

        // 4. In-Memory Filter & Transform
        // Resolve Departments Name
        const validDeptIds = Array.from(new Set(allMembers.map(m => m.department_id).filter(Boolean))) as number[]
        const deptNameMap = new Map<number, string>()
        if (validDeptIds.length > 0) {
            const { data: depts } = await admin.from('organization_departments').select('id, name').in('id', validDeptIds)
            depts?.forEach(d => deptNameMap.set(d.id, d.name))
        }

        // NEW: Collect all departments for filter dropdown (regardless of pagination)
        const allDeptNames = Array.from(new Set(validDeptIds.map(id => deptNameMap.get(id)).filter(Boolean))).sort() as string[]

        // Transform to ViewModel
        const allViewModels = allMembers.map(m => {
            const fingers = bioMap.get(m.id) || new Set<number>()
            const regCount = fingers.size

            let status = 'unregistered' // MATCH FRONTEND VOCAB
            if (regCount >= 2) status = 'complete'
            else if (regCount === 1) status = 'partial'

            return {
                id: m.id,
                user_id: m.user_id,
                display_name: m.user_profiles?.display_name || [m.user_profiles?.first_name, m.user_profiles?.last_name].filter(Boolean).join(' ') || 'No Name',
                first_name: m.user_profiles?.first_name,
                last_name: m.user_profiles?.last_name,
                phone: m.user_profiles?.phone,
                email: m.user_profiles?.email,
                department_name: deptNameMap.get(m.department_id) || 'No Group',
                finger1_registered: fingers.has(1),
                finger2_registered: fingers.has(2),
                _status: status // internal for filtering
            }
        })

        // Filter by Status (In Memory)
        let filteredList = allViewModels
        if (statusParam && statusParam !== 'all') {
            filteredList = filteredList.filter(m => m._status === statusParam)
        }

        // 5. Pagination Slice
        const total = filteredList.length
        const totalPages = Math.max(1, Math.ceil(total / limit))
        const safePage = Math.min(Math.max(1, page), totalPages)
        const startIndex = (safePage - 1) * limit
        const endIndex = startIndex + limit
        const pagedData = filteredList.slice(startIndex, endIndex)

        return NextResponse.json(
            {
                success: true,
                data: pagedData,
                pagination: {
                    page: safePage,
                    limit,
                    total,
                    totalPages
                },
                filters: {
                    departments: allDeptNames
                }
            },
            { headers: { 'Cache-Control': 'private, no-cache', 'X-Strategy': 'InMemory', 'X-Debug-Status': statusParam || 'none' } }
        )

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
