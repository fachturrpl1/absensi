import { NextResponse } from 'next/server'
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

export async function GET(request: Request) {
  try {
    const organizationId = await getUserOrganizationId()
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '15')

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get today's attendance records with member info
    const { data: records, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        status,
        actual_check_in,
        late_minutes,
        organization_member_id,
        organization_members!inner (
          id,
          department_id,
          user_profiles!inner (
            first_name,
            last_name
          ),
          departments!organization_members_department_id_fkey (
            name
          )
        )
      `)
      .eq('organization_members.organization_id', organizationId)
      .eq('attendance_date', today)
      .not('actual_check_in', 'is', null)
      .order('actual_check_in', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent activity:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch recent activity' },
        { status: 500 }
      )
    }

    // Transform data
    const activities = records?.map((record: any) => {
      const member = record.organization_members
      const profile = member?.user_profiles
      const department = member?.departments

      return {
        id: record.id.toString(),
        memberName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
        status: record.status,
        checkInTime: record.actual_check_in,
        lateMinutes: record.late_minutes,
        department: department?.name || null
      }
    }) || []

    return NextResponse.json(
      { success: true, data: activities },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    console.error('API /dashboard/recent-activity error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
