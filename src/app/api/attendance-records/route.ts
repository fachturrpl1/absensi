import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let organizationId = parseInt(searchParams.get('organizationId') || '')
    
    // Fallback to cookie if query param not provided
    if (!organizationId) {
      const orgIdCookie = request.cookies.get('org_id')?.value
      if (orgIdCookie) {
        organizationId = parseInt(orgIdCookie)
      }
    }
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization ID required' },
        { status: 400 }
      )
    }
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '20'))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const supabase = await createClient()

    let query = supabase
      .from('attendance_records')
      .select(`
        id,
        status,
        actual_check_in,
        actual_check_out,
        work_duration_minutes,
        late_minutes,
        attendance_date,
        organization_members!inner (
          organization_id,
          user_profiles (
            first_name,
            last_name,
            profile_photo_url
          ),
          departments!organization_members_department_id_fkey (
            name
          )
        )
      `)
      .eq('organization_members.organization_id', organizationId)
      .order('attendance_date', { ascending: false })
      .limit(limit)
      .range(from, to) // Tambahkan ini

    // Add date filters if provided
    if (startDate) {
      query = query.gte('attendance_date', startDate)
    }
    if (endDate) {
      query = query.lte('attendance_date', endDate)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('Error fetching attendance records:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch attendance records' },
        { status: 500 }
      )
    }

    // Hitung total (count) dengan filter yang sama
    let countQuery = supabase
      .from('attendance_records')
      .select(`id, organization_members!inner(organization_id)`, { count: 'exact', head: true })
      .eq('organization_members.organization_id', organizationId)
    if (startDate) countQuery = countQuery.gte('attendance_date', startDate)
    if (endDate) countQuery = countQuery.lte('attendance_date', endDate)

    const { count: total } = await countQuery


    // Transform data
    const formattedRecords = records?.map((record: any) => {
      // Default scheduled work hours: 8 hours = 480 minutes
      const scheduledDuration = 480;
      
      return {
        id: record.id,
        member_name: `${record.organization_members?.user_profiles?.first_name || ''} ${record.organization_members?.user_profiles?.last_name || ''}`.trim() || 'Unknown',
        department_name: record.organization_members?.departments?.name || 'N/A',
        status: record.status,
        actual_check_in: record.actual_check_in,
        actual_check_out: record.actual_check_out,
        work_duration_minutes: record.work_duration_minutes,
        scheduled_duration_minutes: scheduledDuration, // Default 8 jam jika belum check out
        late_minutes: record.late_minutes,
        attendance_date: record.attendance_date,
        profile_photo_url: record.organization_members?.user_profiles?.profile_photo_url,
      };
    }) || []

    return NextResponse.json(
      { 
        success: true,
        data: formattedRecords,
        meta: {
        total: total || 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((total || 0) / pageSize)),
      }
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    console.error('API /attendance-records error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}
