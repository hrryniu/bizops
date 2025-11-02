/**
 * 📅 Google Calendar OAuth - Initiate Authentication
 * 
 * GET /api/calendar/google/auth - Start OAuth flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGoogleAuthUrl } from '@/lib/services/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      )
    }

    // Generate OAuth URL
    const authUrl = getGoogleAuthUrl(session.user.id)

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Failed to initiate Google OAuth:', error)
    return NextResponse.json(
      { error: 'Nie udało się rozpocząć autoryzacji' },
      { status: 500 }
    )
  }
}









