import { NextResponse } from 'next/server'
import { getAllOrganization_member } from '@/action/members'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { IOrganization_member } from '@/interface'
import { memberLogger } from '@/lib/logger'

// Constants
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100
const ALLOWED_LIMITS = new Set([10, 50, 100])
const CACHE_TTL = 60 // seconds

export async function GET(req: Request) {
  const startTime = Date.now()
  
  try {
    // Read query params
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')
    const search = searchParams.get('search') || ''
    const orgParam = searchParams.get('organizationId')
    const activeParam = searchParams.get('active') // 'true' | 'false' | 'all'
    const countMode = (searchParams.get('countMode') as 'exact' | 'planned' | 'none') || null

    // Parse and validate limit
    let limit = DEFAULT_LIMIT
    if (limitParam) {
      const parsed = parseInt(limitParam, 10)
      if (!isNaN(parsed)) {
        const clamped = Math.min(Math.max(1, parsed), MAX_LIMIT)
        limit = ALLOWED_LIMITS.has(clamped) ? clamped : DEFAULT_LIMIT
      }
    }

    // Legacy behavior: no limit = return all
    if (!limitParam && !pageParam) {
      const response = await getAllOrganization_member(
        orgParam ? Number(orgParam) : undefined
      )
      
      if (!response.success) {
        return NextResponse.json(
          { success: false, message: response.message },
          { 
            status: 400, 
            headers: { 
              'Cache-Control': 'private, no-cache, no-store, must-revalidate',
              'Vary': 'Cookie',
              'X-Response-Time': `${Date.now() - startTime}ms`
            } 
          }
        )
      }
      
      return NextResponse.json(
        { success: true, data: response.data },
        { 
          headers: { 
            'Cache-Control': 'private, max-age=60, must-revalidate',
            'Vary': 'Cookie',
            'X-Response-Time': `${Date.now() - startTime}ms`
          } 
        }
      )
    }

    // Initialize Supabase clients
    const supabase = await createClient()
    const admin = createAdminClient()

    // Resolve organization id
    let organizationId: number | null = orgParam ? Number(orgParam) : null
    
    if (!organizationId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (member?.organization_id) {
          organizationId = Number(member.organization_id)
        }
      }
    }

    // Return empty if no organization
    if (!organizationId) {
      return NextResponse.json(
        { 
          success: true, 
          data: [], 
          pagination: { 
            cursor: null, 
            limit, 
            hasMore: false, 
            total: 0 
          } 
        },
        { 
          headers: { 
            'Cache-Control': 'private, max-age=30',
            'Vary': 'Cookie',
            'X-Response-Time': `${Date.now() - startTime}ms`
          } 
        }
      )
    }

    // OPTIMASI: Count bisa dinonaktifkan / dipermudah untuk percepatan
    let totalCount = 0
    if (pageParam && countMode !== 'none') {
      let countQuery = admin
        .from('organization_members')
        .select('id', { count: (countMode === 'planned' ? 'planned' : 'exact'), head: true })
        .eq('organization_id', organizationId)

      // Apply filters to count query
      if (activeParam !== 'all') {
        const active = activeParam === 'false' ? false : true
        countQuery = countQuery.eq('is_active', active)
      }
      if (search) {
        countQuery = countQuery.ilike('employee_id', `%${search}%`)
      }

      const { count } = await countQuery
      totalCount = count || 0
    }

    // Data query dengan joins
    let dataQuery = admin
      .from('organization_members')
      .select(`
        *,
        biodata:biodata_nik (*),
        user:user_id (
          id,
          email,
          first_name,
          middle_name,
          last_name,
          display_name
        ),
        departments:department_id (
          id,
          name,
          code,
          organization_id
        ),
        positions:position_id (
          id,
          title,
          code
        ),
        role:role_id (
          id,
          code,
          name,
          description
        )
      `)
      .eq('organization_id', organizationId)

    // Apply filters
    if (activeParam !== 'all') {
      const active = activeParam === 'false' ? false : true
      dataQuery = dataQuery.eq('is_active', active)
    }

    // Safe search on base table only (avoid relational filter issues)
    if (search) {
      dataQuery = dataQuery.ilike('employee_id', `%${search}%`)
    }

    // Branch: page-based (offset) vs cursor-based (legacy)
    let itemsRaw: IOrganization_member[] | null = null
    let execError: any = null

    if (pageParam) {
      // PAGE-BASED: hitung offset (range)
      const pageNum = Math.max(1, parseInt(pageParam, 10) || 1)
      const from = (pageNum - 1) * limit
      const to = from + limit - 1
      const exec = await dataQuery
        .order('id', { ascending: true })
        .range(from, to)
      itemsRaw = (exec.data || []) as IOrganization_member[]
      execError = exec.error
    } else {
      // CURSOR-BASED (legacy)
      if (cursor) {
        dataQuery = dataQuery.gt('id', cursor)
      }
      const pageLimit = limit + 1
      const exec = await dataQuery
        .order('id', { ascending: true })
        .limit(pageLimit)
      itemsRaw = (exec.data || []) as IOrganization_member[]
      execError = exec.error
    }

    if (execError) {
      memberLogger.error('Pagination query error:', execError)
      return NextResponse.json(
        { success: false, message: execError.message },
        { status: 400 }
      )
    }

    const raw = (itemsRaw || []) as IOrganization_member[]
    let items: IOrganization_member[] = raw
    let hasMore = false
    let nextCursor: string | null = null

    if (pageParam) {
      const pageNum = Math.max(1, parseInt(pageParam, 10) || 1)
      const endIdx = pageNum * limit
      hasMore = totalCount > 0 ? endIdx < totalCount : (raw.length >= limit)
    } else {
      hasMore = raw.length > limit
      items = hasMore ? raw.slice(0, limit) : raw
      const lastItem = items.length > 0 ? items[items.length - 1] : null
      nextCursor = lastItem?.id ? String(lastItem.id) : null
    }

    const baseParams = new URLSearchParams({
      limit: limit.toString(),
      organizationId: organizationId.toString(),
      ...(search && { search }),
      ...(activeParam && activeParam !== 'all' && { active: activeParam }),
      ...(countMode && { countMode })
    })

    let links: { self: string; next: string | null; first: string; prev?: string | null; last?: string | null } = {
      self: `/api/members?${baseParams.toString()}`,
      next: null,
      first: `/api/members?${baseParams.toString()}`
    }

    if (pageParam) {
      const pageNum = Math.max(1, parseInt(pageParam, 10) || 1)
      const totalPages = Math.max(1, Math.ceil((totalCount || 0) / limit))
      links.self = `/api/members?${baseParams.toString()}&page=${pageNum}`
      links.first = `/api/members?${baseParams.toString()}&page=1`
      links.prev = pageNum > 1 ? `/api/members?${baseParams.toString()}&page=${pageNum - 1}` : null
      links.next = pageNum < totalPages ? `/api/members?${baseParams.toString()}&page=${pageNum + 1}` : null
      links.last = `/api/members?${baseParams.toString()}&page=${totalPages}`
    } else {
      links.self = `/api/members?${baseParams.toString()}${cursor ? `&cursor=${cursor}` : ''}`
      links.next = nextCursor ? `/api/members?${baseParams.toString()}&cursor=${nextCursor}` : null
      links.first = `/api/members?${baseParams.toString()}`
    }

    // Log performance
    const responseTime = Date.now() - startTime
    memberLogger.info('Members pagination', {
      orgId: organizationId,
      limit,
      cursor: cursor || 'none',
      itemCount: items.length,
      totalCount,
      responseTime: `${responseTime}ms`,
      hasMore
    })

    return NextResponse.json(
      { 
        success: true, 
        data: items, 
        pagination: { 
          cursor: nextCursor, 
          limit, 
          hasMore, 
          total: totalCount || 0 
        }, 
        links,
        meta: {
          responseTime: `${responseTime}ms`
        }
      },
      { 
        headers: { 
          'Cache-Control': `private, max-age=${CACHE_TTL}, stale-while-revalidate=300`,
          'Vary': 'Cookie, Authorization',
          'X-Response-Time': `${responseTime}ms`
        } 
      }
    )

  } catch (error) {
    const responseTime = Date.now() - startTime
    memberLogger.error('API /members error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch members',
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Vary': 'Cookie',
          'X-Response-Time': `${responseTime}ms`
        }
      }
    )
  }
}