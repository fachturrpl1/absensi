import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const org = url.searchParams.get('org') || '1'

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ success: false, message: 'Missing service key env for debug' }, { status: 500 })
    }

    const sup = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch organization member ids
    const { data: members, error: membersError } = await sup
      .from('organization_members')
      .select('id')
      .eq('organization_id', org)

    if (membersError) {
      return NextResponse.json({ success: false, message: 'Failed to fetch organization_members', error: membersError.message }, { status: 500 })
    }

    const memberIds = (members || []).map((m: any) => m.id).filter(Boolean)

    if (memberIds.length === 0) {
      return NextResponse.json({ success: true, data: [], message: 'No members for org ' + org })
    }

    // Fetch attendance records selecting raw columns
    const { data: attendance, error: attendanceError } = await sup
      .from('attendance_records')
      .select('*')
      .in('organization_member_id', memberIds)
      .order('attendance_date', { ascending: false })
      .limit(50)

    if (attendanceError) {
      return NextResponse.json({ success: false, message: 'Failed to fetch attendance_records', error: attendanceError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: attendance })
  } catch (err) {
    console.error('debug raw attendance error', err)
    return NextResponse.json({ success: false, message: 'Unexpected error', error: String(err) }, { status: 500 })
  }
}
