/**
 * 📅 Calendar Integration - Disconnect
 * 
 * POST /api/calendar/disconnect - Disconnect calendar integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider jest wymagany' },
        { status: 400 }
      )
    }

    // Deactivate integration
    await prisma.calendarIntegration.updateMany({
      where: {
        userId: session.user.id,
        provider,
      },
      data: {
        isActive: false,
        syncEnabled: false,
      },
    })

    // Clear calendar event IDs from fixed expenses
    await prisma.fixedExpense.updateMany({
      where: {
        userId: session.user.id,
        syncWithCalendar: true,
      },
      data: {
        syncWithCalendar: false,
        calendarEventId: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect calendar:', error)
    return NextResponse.json(
      { error: 'Nie udało się rozłączyć kalendarza' },
      { status: 500 }
    )
  }
}










