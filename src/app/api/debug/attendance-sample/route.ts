import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const org = url.searchParams.get('org') || '1'

    const supabase = await createClient()

    // 1) get organization member ids for this org
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', org)

    if (membersError) {
      console.error('debug: failed to fetch organization_members', membersError)
      return NextResponse.json({ success: false, message: 'Failed to fetch organization members', error: membersError.message }, { status: 500 })
    }

    const memberIds = (members || []).map((m: any) => m.id).filter(Boolean)

    if (memberIds.length === 0) {
      return NextResponse.json({ success: true, data: [], message: 'No organization members found for org ' + org })
    }

    // 2) fetch attendance records for those member ids
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id, attendance_date, status, organization_member_id')
      .in('organization_member_id', memberIds)
      .order('attendance_date', { ascending: false })
      .limit(20)

    if (attendanceError) {
      console.error('debug: failed to fetch attendance_records', attendanceError)
      return NextResponse.json({ success: false, message: 'Failed to fetch attendance records', error: attendanceError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: attendance })
  } catch (err) {
    console.error('debug attendance-sample error', err)
    return NextResponse.json({ success: false, message: 'Unexpected error', error: String(err) }, { status: 500 })
  }
}
