/**
 * 📅 Google Calendar OAuth - Callback Handler
 * 
 * GET /api/calendar/google/callback - Handle OAuth callback
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleGoogleCallback } from '@/lib/services/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(
        new URL('/settings?error=calendar_auth_failed', request.url)
      )
    }

    // Validate parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_callback', request.url)
      )
    }

    // Exchange code for tokens and store
    await handleGoogleCallback(code, state)

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL('/settings?success=calendar_connected', request.url)
    )
  } catch (error) {
    console.error('Failed to handle Google OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/settings?error=calendar_auth_failed', request.url)
    )
  }
}










