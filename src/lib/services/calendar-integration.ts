/**
 * 📅 Calendar Integration Service
 * 
 * Integrates with Google Calendar and Outlook Calendar:
 * - OAuth2 authentication
 * - Automatic event creation for deadlines
 * - Reminder notifications
 */

import { google } from 'googleapis'
import { Client as MicrosoftGraphClient } from '@microsoft/microsoft-graph-client'
import 'isomorphic-fetch'
import { prisma } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/encryption'
import { CALENDAR_CONFIG } from '@/lib/config'
import { addDays, format } from 'date-fns'

// ========================================
// Types
// ========================================

export type CalendarProvider = 'GOOGLE' | 'OUTLOOK'

export interface CalendarEvent {
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  location?: string
  reminders?: number[] // Days before event
}

// ========================================
// Google Calendar Service
// ========================================

export class GoogleCalendarService {
  private oauth2Client: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      CALENDAR_CONFIG.google.clientId,
      CALENDAR_CONFIG.google.clientSecret,
      CALENDAR_CONFIG.google.redirectUri
    )
  }

  /**
   * Get authorization URL
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code)
    return tokens
  }

  /**
   * Set credentials
   */
  setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  /**
   * Create calendar event
   */
  async createEvent(event: CalendarEvent): Promise<string> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    const endDate = event.endDate || addDays(event.startDate, 0)

    const eventResource = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: 'Europe/Warsaw',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Warsaw',
      },
      reminders: {
        useDefault: false,
        overrides: (event.reminders || [3, 1]).map(days => ({
          method: 'email',
          minutes: days * 24 * 60,
        })),
      },
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventResource,
    })

    return response.data.id!
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, event: CalendarEvent) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    const endDate = event.endDate || addDays(event.startDate, 0)

    await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startDate.toISOString(),
          timeZone: 'Europe/Warsaw',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'Europe/Warsaw',
        },
      },
    })
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    })
  }
}

// ========================================
// Outlook Calendar Service
// ========================================

export class OutlookCalendarService {
  private client: MicrosoftGraphClient | null = null

  /**
   * Get authorization URL
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: CALENDAR_CONFIG.outlook.clientId,
      response_type: 'code',
      redirect_uri: CALENDAR_CONFIG.outlook.redirectUri,
      response_mode: 'query',
      scope: 'offline_access Calendars.ReadWrite',
      state: 'calendar_integration',
    })

    return `https://login.microsoftonline.com/${CALENDAR_CONFIG.outlook.tenantId}/oauth2/v2.0/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    const params = new URLSearchParams({
      client_id: CALENDAR_CONFIG.outlook.clientId,
      client_secret: CALENDAR_CONFIG.outlook.clientSecret,
      code,
      redirect_uri: CALENDAR_CONFIG.outlook.redirectUri,
      grant_type: 'authorization_code',
    })

    const response = await fetch(
      `https://login.microsoftonline.com/${CALENDAR_CONFIG.outlook.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )

    return await response.json()
  }

  /**
   * Initialize client with access token
   */
  setCredentials(accessToken: string) {
    this.client = MicrosoftGraphClient.init({
      authProvider: (done) => {
        done(null, accessToken)
      },
    })
  }

  /**
   * Create calendar event
   */
  async createEvent(event: CalendarEvent): Promise<string> {
    if (!this.client) throw new Error('Client not initialized')

    const endDate = event.endDate || addDays(event.startDate, 0)

    const eventResource = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || '',
      },
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: 'Europe/Warsaw',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Warsaw',
      },
      location: {
        displayName: event.location || '',
      },
      isReminderOn: true,
      reminderMinutesBeforeStart: (event.reminders || [3])[0] * 24 * 60,
    }

    const response = await this.client.api('/me/events').post(eventResource)

    return response.id
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, event: CalendarEvent) {
    if (!this.client) throw new Error('Client not initialized')

    const endDate = event.endDate || addDays(event.startDate, 0)

    await this.client.api(`/me/events/${eventId}`).patch({
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || '',
      },
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: 'Europe/Warsaw',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Warsaw',
      },
    })
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string) {
    if (!this.client) throw new Error('Client not initialized')
    await this.client.api(`/me/events/${eventId}`).delete()
  }
}

// ========================================
// Calendar Integration Manager
// ========================================

export class CalendarIntegrationService {
  /**
   * Save calendar integration
   */
  async saveIntegration(
    userId: string,
    provider: CalendarProvider,
    email: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ) {
    const tokenExpiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000)
      : null

    return await prisma.calendarIntegration.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      create: {
        userId,
        provider,
        email,
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        tokenExpiresAt,
        isActive: true,
        syncEnabled: true,
      },
      update: {
        email,
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        tokenExpiresAt,
        isActive: true,
      },
    })
  }

  /**
   * Get active calendar integration
   */
  async getIntegration(userId: string, provider: CalendarProvider) {
    return await prisma.calendarIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    })
  }

  /**
   * Create event in user's calendar
   */
  async createEvent(
    userId: string,
    event: CalendarEvent,
    provider?: CalendarProvider
  ): Promise<string | null> {
    // Get active integrations
    const integrations = provider
      ? [await this.getIntegration(userId, provider)]
      : await prisma.calendarIntegration.findMany({
          where: {
            userId,
            isActive: true,
            syncEnabled: true,
          },
        })

    if (integrations.length === 0 || !integrations[0]) {
      console.log('No active calendar integrations found')
      return null
    }

    const integration = integrations[0]
    const accessToken = decrypt(integration.accessToken)

    try {
      if (integration.provider === 'GOOGLE') {
        const service = new GoogleCalendarService()
        const refreshToken = integration.refreshToken ? decrypt(integration.refreshToken) : undefined
        service.setCredentials(accessToken, refreshToken)
        return await service.createEvent(event)
      } else if (integration.provider === 'OUTLOOK') {
        const service = new OutlookCalendarService()
        service.setCredentials(accessToken)
        return await service.createEvent(event)
      }
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      return null
    }

    return null
  }

  /**
   * Sync tax events to calendar
   */
  async syncTaxEventsToCalendar(userId: string) {
    const taxEvents = await prisma.taxEvent.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    let syncedCount = 0

    for (const taxEvent of taxEvents) {
      const calendarEvent: CalendarEvent = {
        title: `📅 ${taxEvent.title}`,
        description: taxEvent.description || undefined,
        startDate: taxEvent.dueDate,
        reminders: [3, 1], // 3 days and 1 day before
      }

      const eventId = await this.createEvent(userId, calendarEvent)
      if (eventId) {
        syncedCount++
      }
    }

    // Update last synced timestamp
    await prisma.calendarIntegration.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        lastSyncedAt: new Date(),
      },
    })

    return syncedCount
  }

  /**
   * Sync invoice due dates to calendar
   */
  async syncInvoiceDuesToCalendar(userId: string) {
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'ISSUED',
        dueDate: {
          gte: new Date(),
        },
      },
      include: {
        buyer: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    let syncedCount = 0

    for (const invoice of invoices) {
      if (!invoice.dueDate) continue

      const calendarEvent: CalendarEvent = {
        title: `💰 Płatność faktury ${invoice.number}`,
        description: `Faktura: ${invoice.number}\nKontrahent: ${invoice.buyer?.name || invoice.buyerPrivatePerson || 'N/A'}\nKwota: ${invoice.totalGross} PLN`,
        startDate: invoice.dueDate,
        reminders: [7, 3, 1], // 7, 3, and 1 day before
      }

      const eventId = await this.createEvent(userId, calendarEvent)
      if (eventId) {
        syncedCount++
      }
    }

    return syncedCount
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Sync user events to calendar
 */
export async function syncUserCalendar(userId: string) {
  const service = new CalendarIntegrationService()
  
  const taxEventsSynced = await service.syncTaxEventsToCalendar(userId)
  const invoicesSynced = await service.syncInvoiceDuesToCalendar(userId)

  return {
    taxEventsSynced,
    invoicesSynced,
    total: taxEventsSynced + invoicesSynced,
  }
}








