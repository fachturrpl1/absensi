import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/action/dashboard'

export async function GET() {
  try {
    const data = await getDashboardStats()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('API /dashboard/stats error', err)
    return NextResponse.json({ success: false, message: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
