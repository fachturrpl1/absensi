import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/action/dashboard'

export async function GET() {
  try {
    const data = await getDashboardStats()
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // Private cache - unique per user/organization
          'Cache-Control': 'private, max-age=180, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (err) {
    console.error('API /dashboard/stats error', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard stats' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate'
        }
      }
    )
  }
}
