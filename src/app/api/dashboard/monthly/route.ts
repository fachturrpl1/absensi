import { NextResponse } from 'next/server'
import { getMonthlyAttendanceStats } from '@/action/dashboard'

export async function GET() {
  try {
    const result = await getMonthlyAttendanceStats()
    if (result && result.success) {
      return NextResponse.json({ success: true, data: result.data })
    }
    console.error('getMonthlyAttendanceStats returned no data', result)
    return NextResponse.json({ success: false, message: 'No data' }, { status: 404 })
  } catch (err) {
    console.error('API /dashboard/monthly error', err)
    return NextResponse.json({ success: false, message: 'Failed to fetch monthly attendance stats' }, { status: 500 })
  }
}
