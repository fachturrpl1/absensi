import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

async function getUserOrganizationId() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle()

  return member?.organization_id || null
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getUserOrganizationId()
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '1000')

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

    // Transform data
    const formattedRecords = records?.map((record: any) => ({
      id: record.id,
      member_name: `${record.organization_members?.user_profiles?.first_name || ''} ${record.organization_members?.user_profiles?.last_name || ''}`.trim() || 'Unknown',
      department_name: record.organization_members?.departments?.name || 'N/A',
      status: record.status,
      actual_check_in: record.actual_check_in,
      actual_check_out: record.actual_check_out,
      work_duration_minutes: record.work_duration_minutes,
      late_minutes: record.late_minutes,
      attendance_date: record.attendance_date,
      profile_photo_url: record.organization_members?.user_profiles?.profile_photo_url,
    })) || []

    return NextResponse.json(
      { success: true, data: formattedRecords },
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
