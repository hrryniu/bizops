/**
 * Calendar API - Sync Events
 * POST /api/calendar/sync - Sync tax events and invoices to calendar
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncUserCalendar } from '@/lib/services/calendar-integration'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await syncUserCalendar(session.user.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync calendar' },
      { status: 500 }
    )
  }
}












