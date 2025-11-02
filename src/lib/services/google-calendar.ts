/**
 * 📅 Google Calendar Integration Service
 * 
 * Service for syncing fixed expenses with Google Calendar
 */

import { google } from 'googleapis'
import { prisma } from '@/lib/db'
import { FixedExpense } from '@prisma/client'

/**
 * Get Google Calendar client for a user
 */
export async function getGoogleCalendarClient(userId: string) {
  const integration = await prisma.calendarIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: 'GOOGLE',
      },
    },
  })

  if (!integration || !integration.isActive) {
    throw new Error('Google Calendar integration not found or inactive')
  }

  // Check if token is expired
  const now = new Date()
  if (integration.tokenExpiresAt && integration.tokenExpiresAt < now) {
    // Token is expired, refresh it
    const newTokens = await refreshGoogleToken(integration.refreshToken!)
    
    // Update tokens in database
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: newTokens.access_token,
        tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
      },
    })

    integration.accessToken = newTokens.access_token
  }

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/calendar/google/callback'
  )

  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  return { calendar, integration }
}

/**
 * Refresh Google access token
 */
async function refreshGoogleToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/calendar/google/callback'
  )

  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

/**
 * Create a recurring calendar event for a fixed expense
 */
export async function createFixedExpenseEvent(
  userId: string,
  expense: FixedExpense
): Promise<string> {
  try {
    const { calendar, integration } = await getGoogleCalendarClient(userId)

    // Calculate recurrence rule
    let recurrence: string[] = []
    switch (expense.recurrence) {
      case 'monthly':
        recurrence = [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${expense.dueDay}`]
        break
      case 'quarterly':
        recurrence = [`RRULE:FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=${expense.dueDay}`]
        break
      case 'yearly':
        recurrence = [`RRULE:FREQ=YEARLY;BYMONTHDAY=${expense.dueDay}`]
        break
    }

    // Create event
    const event = {
      summary: `💰 ${expense.name} - ${expense.amount} PLN`,
      description: `Stały wydatek\nKategoria: ${expense.category}\nKwota: ${expense.amount} PLN\n${expense.notes ? `\nNotatki: ${expense.notes}` : ''}`,
      start: {
        date: getNextOccurrenceDate(expense.dueDay),
      },
      end: {
        date: getNextOccurrenceDate(expense.dueDay),
      },
      recurrence,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    }

    const response = await calendar.events.insert({
      calendarId: integration.calendarId || 'primary',
      requestBody: event,
    })

    return response.data.id!
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    throw new Error('Nie udało się utworzyć wydarzenia w kalendarzu')
  }
}

/**
 * Update a calendar event for a fixed expense
 */
export async function updateFixedExpenseEvent(
  userId: string,
  expense: FixedExpense
): Promise<void> {
  if (!expense.calendarEventId) {
    throw new Error('No calendar event ID found')
  }

  try {
    const { calendar, integration } = await getGoogleCalendarClient(userId)

    // Calculate recurrence rule
    let recurrence: string[] = []
    switch (expense.recurrence) {
      case 'monthly':
        recurrence = [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${expense.dueDay}`]
        break
      case 'quarterly':
        recurrence = [`RRULE:FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=${expense.dueDay}`]
        break
      case 'yearly':
        recurrence = [`RRULE:FREQ=YEARLY;BYMONTHDAY=${expense.dueDay}`]
        break
    }

    const event = {
      summary: `💰 ${expense.name} - ${expense.amount} PLN`,
      description: `Stały wydatek\nKategoria: ${expense.category}\nKwota: ${expense.amount} PLN\n${expense.notes ? `\nNotatki: ${expense.notes}` : ''}`,
      start: {
        date: getNextOccurrenceDate(expense.dueDay),
      },
      end: {
        date: getNextOccurrenceDate(expense.dueDay),
      },
      recurrence,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    }

    await calendar.events.update({
      calendarId: integration.calendarId || 'primary',
      eventId: expense.calendarEventId,
      requestBody: event,
    })
  } catch (error) {
    console.error('Failed to update calendar event:', error)
    throw new Error('Nie udało się zaktualizować wydarzenia w kalendarzu')
  }
}

/**
 * Delete a calendar event
 */
export async function deleteFixedExpenseEvent(
  userId: string,
  calendarEventId: string
): Promise<void> {
  try {
    const { calendar, integration } = await getGoogleCalendarClient(userId)

    await calendar.events.delete({
      calendarId: integration.calendarId || 'primary',
      eventId: calendarEventId,
    })
  } catch (error) {
    console.error('Failed to delete calendar event:', error)
    throw new Error('Nie udało się usunąć wydarzenia z kalendarza')
  }
}

/**
 * Get next occurrence date for a given day of month
 */
function getNextOccurrenceDate(dayOfMonth: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  // Try current month
  let date = new Date(year, month, dayOfMonth)
  
  // If date is in the past, try next month
  if (date < now) {
    date = new Date(year, month + 1, dayOfMonth)
  }

  return date.toISOString().split('T')[0]
}

/**
 * Initialize Google Calendar OAuth flow
 */
export function getGoogleAuthUrl(userId: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/calendar/google/callback'
  )

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
  ]

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId, // Pass userId in state for callback
    prompt: 'consent', // Force consent screen to get refresh token
  })

  return url
}

/**
 * Handle OAuth callback and store tokens
 */
export async function handleGoogleCallback(
  code: string,
  userId: string
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/calendar/google/callback'
  )

  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get tokens from Google')
  }

  // Get user's email
  oauth2Client.setCredentials(tokens)
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const userInfo = await oauth2.userinfo.get()

  // Store in database
  await prisma.calendarIntegration.upsert({
    where: {
      userId_provider: {
        userId,
        provider: 'GOOGLE',
      },
    },
    create: {
      userId,
      provider: 'GOOGLE',
      email: userInfo.data.email!,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isActive: true,
      syncEnabled: true,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isActive: true,
      syncEnabled: true,
      lastSyncedAt: new Date(),
    },
  })
}









