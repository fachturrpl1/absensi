import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

import { dashboardLogger } from '@/lib/logger';
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

export async function GET() {
  try {
    const organizationId = await getUserOrganizationId()
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get all active members
    const { data: memberIds } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    const memberIdList = (memberIds || []).map((m: any) => m.id)
    const totalMembers = memberIdList.length

    // Get today's attendance records
    const { data: attendanceRecords } = await supabase
      .from('attendance_records')
      .select('status, late_minutes')
      .in('organization_member_id', memberIdList)
      .eq('attendance_date', today)

    // Calculate stats
    const checkedIn = attendanceRecords?.filter(r => 
      r.status === 'present' || r.status === 'late'
    ).length || 0

    const present = attendanceRecords?.filter(r => 
      r.status === 'present'
    ).length || 0

    const late = attendanceRecords?.filter(r => 
      r.status === 'late'
    ).length || 0

    // Count actual absent records from database, not calculated
    const absent = attendanceRecords?.filter(r => 
      r.status === 'absent'
    ).length || 0

    const attendanceRate = totalMembers > 0 
      ? Math.round((checkedIn / totalMembers) * 100)
      : 0

    return NextResponse.json(
      { 
        success: true, 
        data: {
          totalMembers,
          checkedIn,
          onTime: present,
          late,
          absent,
          attendanceRate
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    dashboardLogger.error('API /dashboard/today-summary error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch today summary' },
      { status: 500 }
    )
  }
}
