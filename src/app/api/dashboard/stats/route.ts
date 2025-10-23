import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/action/dashboard'

export async function GET() {
  try {
    const data = await getDashboardStats()
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // Aggressive caching - 3 minutes fresh, 1 minute stale-while-revalidate
          'Cache-Control': 'public, max-age=180, stale-while-revalidate=60, must-revalidate',
          // Optional: Add ETag for better caching
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
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  }
}
