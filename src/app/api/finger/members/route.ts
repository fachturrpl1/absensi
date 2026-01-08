import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100
const ALLOWED_LIMITS = new Set([10, 50, 100])

export async function GET(req: Request) {
  const started = Date.now()
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')
    const orgParam = searchParams.get('organizationId')

    let limit = DEFAULT_LIMIT
    if (limitParam) {
      const parsed = parseInt(limitParam, 10)
      if (!isNaN(parsed)) {
        const clamped = Math.min(Math.max(1, parsed), MAX_LIMIT)
        limit = ALLOWED_LIMITS.has(clamped) ? clamped : DEFAULT_LIMIT
      }
    }

    const supabase = await createClient()
    const admin = createAdminClient()

    // Resolve org
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
      return NextResponse.json(
        {
          success: true,
          data: [],
          pagination: { page: 1, limit, total: 0, totalPages: 0 }
        },
        { headers: { 'Cache-Control': 'private, max-age=30', 'Vary': 'Cookie', 'X-Response-Time': `${Date.now()-started}ms` } }
      )
    }

    const pageNum = Math.max(1, parseInt(pageParam || '1', 10) || 1)
    const from = (pageNum - 1) * limit
    const to = from + limit - 1

    // Total active members
    const { count: total } = await admin
      .from('organization_members')
      .select('id', { count: 'planned', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    // Page data
    const exec = await admin
      .from('organization_members')
      .select(`
        id,
        user_id,
        department_id,
        organization_id,
        is_active,
        user_profiles (
          first_name,
          last_name,
          display_name,
          phone,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('id', { ascending: true })
      .range(from, to)

    if (exec.error) {
      return NextResponse.json(
        { success: false, message: exec.error.message },
        { status: 400, headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate', 'Vary': 'Cookie' } }
      )
    }

    const items = exec.data || []
    const memberIds = items.map((m: any) => m.id)
    const deptIds = Array.from(new Set(items.map((m: any) => m.department_id).filter(Boolean))) as number[]

    // Departments for this page
    let deptMap = new Map<number, string>()
    if (deptIds.length > 0) {
      const { data: depts } = await admin
        .from('departments')
        .select('id, name')
        .in('id', deptIds)
      if (depts) {
        deptMap = new Map(depts.map((d: any) => [d.id, d.name]))
      }
    }

    // Biometric data for this page
    const fingerMap = new Map<number, Set<number>>()
    if (memberIds.length > 0) {
      const { data: bios } = await admin
        .from('biometric_data')
        .select('organization_member_id, finger_number, template_data, is_active, enrollment_date, created_at')
        .in('organization_member_id', memberIds)
        .eq('biometric_type', 'FINGERPRINT')
        .eq('is_active', true)
        .limit(10000)

      // Group per member and determine fingers 1/2 including null finger_number with local_id
      if (bios) {
        type BioRow = {
          organization_member_id: number | null
          finger_number: number | null
          template_data: unknown
          enrollment_date?: string | null
          created_at?: string | null
        }

        const memberBioMap = new Map<number, BioRow[]>()
        for (const b of bios as BioRow[]) {
          const mid = b.organization_member_id
          if (!mid) continue

          // Check if template_data contains local_id (means registered)
          let hasLocalId = false
          try {
            const t = typeof b.template_data === 'string' ? JSON.parse(b.template_data) : b.template_data
            if (t && typeof (t as Record<string, unknown>).local_id !== 'undefined') {
              const lid = (t as Record<string, unknown>).local_id as unknown
              if (typeof lid === 'number') {
                hasLocalId = true
              } else if (typeof lid === 'string') {
                const trimmed = lid.trim()
                if (/^\d+$/.test(trimmed)) {
                  hasLocalId = true
                }
              }
            }
          } catch {
            // ignore parse errors
          }

          if (hasLocalId || (b.finger_number === 1 || b.finger_number === 2)) {
            const arr = memberBioMap.get(mid) || []
            arr.push(b)
            memberBioMap.set(mid, arr)
          }
        }

        // Sort per member and assign finger numbers
        for (const [mid, rows] of memberBioMap) {
          rows.sort((a, b) => {
            const da = a.enrollment_date || a.created_at || ''
            const db = b.enrollment_date || b.created_at || ''
            return da.localeCompare(db)
          })
          const set = new Set<number>()
          rows.forEach((row, idx) => {
            let fn = row.finger_number
            if (fn !== 1 && fn !== 2) {
              const candidate = idx + 1
              if (candidate === 1 || candidate === 2) fn = candidate
            }
            if (fn === 1 || fn === 2) set.add(fn)
          })
          fingerMap.set(mid, set)
        }
      }
    }

    const data = items.map((m: any) => {
      const p = m.user_profiles || {}
      const name = p.display_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'No Name'
      const fingers = fingerMap.get(m.id) || new Set<number>()
      return {
        id: m.id,
        user_id: m.user_id,
        display_name: name,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        phone: p.phone || null,
        email: p.email || null,
        department_name: deptMap.get(m.department_id) || 'No Group',
        finger1_registered: fingers.has(1),
        finger2_registered: fingers.has(2),
      }
    })

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          page: pageNum,
          limit,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / limit)
        }
      },
      { headers: { 'Cache-Control': 'private, max-age=30', 'Vary': 'Cookie', 'X-Response-Time': `${Date.now()-started}ms` } }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
