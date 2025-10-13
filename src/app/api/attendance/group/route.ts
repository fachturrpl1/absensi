import { NextResponse } from 'next/server'
import { getAttendanceByGroup } from '@/action/attendance_group'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const org = url.searchParams.get('organizationId') || undefined
    const res = await getAttendanceByGroup(org)
    return NextResponse.json({ success: true, data: res.data })
  } catch (err) {
    console.error('API /attendance/group error', err)
    return NextResponse.json({ success: false, data: [] }, { status: 500 })
  }
}
