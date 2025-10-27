import { NextResponse } from 'next/server'
import { getAllMemberSchedule } from '@/action/members_schedule'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const organizationId = url.searchParams.get('organizationId') || undefined
    
    const response = await getAllMemberSchedule(organizationId)
    
    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Vary': 'Cookie'
          }
        }
      )
    }

    return NextResponse.json(
      { success: true, data: response.data },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (error) {
    console.error('API /member-schedules error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch member schedules' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  }
}
