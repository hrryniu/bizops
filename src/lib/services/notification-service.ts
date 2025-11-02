/**
 * 🔔 Notification Service
 * 
 * Manages notifications and email alerts:
 * - Payment reminders
 * - Tax deadline alerts
 * - Bank sync notifications
 * - AI insights
 */

import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db'
import { EMAIL_CONFIG } from '@/lib/config'
import { format, differenceInDays } from 'date-fns'

// ========================================
// Types
// ========================================

export type NotificationType = 
  | 'PAYMENT_REMINDER'
  | 'TAX_DEADLINE'
  | 'BANK_SYNC'
  | 'AI_INSIGHT'
  | 'INVOICE_OVERDUE'
  | 'LOW_CASHFLOW'

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  actionUrl?: string
  actionLabel?: string
  relatedId?: string
  relatedType?: string
  scheduledFor?: Date
}

// ========================================
// Email Service
// ========================================

export class EmailService {
  private transporter: any

  constructor() {
    if (EMAIL_CONFIG.smtp.user && EMAIL_CONFIG.smtp.password) {
      this.transporter = nodemailer.createTransporter({
        host: EMAIL_CONFIG.smtp.host,
        port: EMAIL_CONFIG.smtp.port,
        secure: EMAIL_CONFIG.smtp.port === 465,
        auth: {
          user: EMAIL_CONFIG.smtp.user,
          pass: EMAIL_CONFIG.smtp.password,
        },
      })
    }
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<boolean> {
    if (!this.transporter || !EMAIL_CONFIG.notifications.enabled) {
      console.log('📧 Email disabled or not configured:', { to, subject })
      return false
    }

    try {
      await this.transporter.sendMail({
        from: EMAIL_CONFIG.smtp.from,
        to,
        subject,
        text,
        html: html || this.generateHtmlTemplate(subject, text),
      })

      console.log(`✅ Email sent to ${to}: ${subject}`)
      return true
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      return false
    }
  }

  /**
   * Generate HTML email template
   */
  private generateHtmlTemplate(subject: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e1e4e8;
              border-top: none;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💼 BizOps</h1>
            <p>${subject}</p>
          </div>
          <div class="content">
            ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
          </div>
          <div class="footer">
            <p>BizOps - Twój asystent biznesowy</p>
            <p>Ta wiadomość została wygenerowana automatycznie. Nie odpowiadaj na ten email.</p>
          </div>
        </body>
      </html>
    `
  }
}

// ========================================
// Notification Service
// ========================================

export class NotificationService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  /**
   * Create notification
   */
  async createNotification(data: NotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'NORMAL',
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        scheduledFor: data.scheduledFor,
        isRead: false,
      },
    })

    // Send email if enabled and high priority
    if (EMAIL_CONFIG.notifications.enabled && data.priority && ['HIGH', 'URGENT'].includes(data.priority)) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      })

      if (user?.email) {
        await this.emailService.sendEmail(
          user.email,
          data.title,
          data.message
        )
      }
    }

    return notification
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Get unread notifications for user
   */
  async getUnreadNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Send payment reminders
   */
  async sendPaymentReminders(userId: string) {
    const reminderDays = EMAIL_CONFIG.notifications.reminderDays

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'ISSUED',
        dueDate: {
          not: null,
        },
      },
      include: {
        buyer: true,
      },
    })

    let sentCount = 0

    for (const invoice of invoices) {
      if (!invoice.dueDate) continue

      const daysUntilDue = differenceInDays(invoice.dueDate, new Date())

      // Send reminder if due date is in reminder days
      if (reminderDays.includes(daysUntilDue)) {
        await this.createNotification({
          userId,
          type: 'PAYMENT_REMINDER',
          title: `Przypomnienie: Płatność faktury ${invoice.number}`,
          message: `Faktura ${invoice.number} dla ${invoice.buyer?.name || invoice.buyerPrivatePerson} jest do zapłaty za ${daysUntilDue} dni (${format(invoice.dueDate, 'dd.MM.yyyy')}). Kwota: ${invoice.totalGross} PLN.`,
          priority: daysUntilDue <= 1 ? 'HIGH' : 'NORMAL',
          actionUrl: `/invoices/${invoice.id}`,
          actionLabel: 'Zobacz fakturę',
          relatedId: invoice.id,
          relatedType: 'INVOICE',
        })
        sentCount++
      }

      // Send overdue notification
      if (daysUntilDue < 0) {
        await this.createNotification({
          userId,
          type: 'INVOICE_OVERDUE',
          title: `Zaległa płatność: Faktura ${invoice.number}`,
          message: `Faktura ${invoice.number} jest zaległa o ${Math.abs(daysUntilDue)} dni. Kwota: ${invoice.totalGross} PLN. Rozważ wysłanie przypomnienia do klienta.`,
          priority: 'URGENT',
          actionUrl: `/invoices/${invoice.id}`,
          actionLabel: 'Zobacz fakturę',
          relatedId: invoice.id,
          relatedType: 'INVOICE',
        })
        sentCount++
      }
    }

    return sentCount
  }

  /**
   * Send tax deadline reminders
   */
  async sendTaxDeadlineReminders(userId: string) {
    const reminderDays = EMAIL_CONFIG.notifications.reminderDays

    const taxEvents = await prisma.taxEvent.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
        },
      },
    })

    let sentCount = 0

    for (const event of taxEvents) {
      const daysUntilDue = differenceInDays(event.dueDate, new Date())

      if (reminderDays.includes(daysUntilDue)) {
        await this.createNotification({
          userId,
          type: 'TAX_DEADLINE',
          title: `Termin podatkowy: ${event.title}`,
          message: `${event.title} jest za ${daysUntilDue} dni (${format(event.dueDate, 'dd.MM.yyyy')}). ${event.description || 'Przygotuj dokumenty i dokonaj płatności przed terminem.'}`,
          priority: daysUntilDue <= 1 ? 'URGENT' : 'HIGH',
          actionUrl: `/calendar`,
          actionLabel: 'Zobacz kalendarz',
          relatedId: event.id,
          relatedType: 'TAX_EVENT',
        })
        sentCount++
      }
    }

    return sentCount
  }

  /**
   * Send low cashflow alerts
   */
  async sendCashflowAlerts(userId: string) {
    // Get latest cashflow forecast
    const forecast = await prisma.cashflowForecast.findFirst({
      where: {
        userId,
        forecastType: 'PREDICTED',
        forecastDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        forecastDate: 'asc',
      },
    })

    if (forecast && Number(forecast.cumulativeCashflow) < 5000) {
      await this.createNotification({
        userId,
        type: 'LOW_CASHFLOW',
        title: 'Uwaga: Niski poziom cashflow',
        message: `Przewidywany cashflow w ${format(forecast.forecastDate, 'MMMM yyyy')} wynosi ${forecast.cumulativeCashflow} PLN. Zaplanuj działania, aby uniknąć problemów z płynnością.`,
        priority: Number(forecast.cumulativeCashflow) < 0 ? 'URGENT' : 'HIGH',
        actionUrl: `/dashboard`,
        actionLabel: 'Zobacz prognozę',
      })

      return 1
    }

    return 0
  }

  /**
   * Send AI insight notifications
   */
  async sendAIInsightNotifications(userId: string) {
    const insights = await prisma.aIInsight.findMany({
      where: {
        userId,
        isDismissed: false,
        severity: {
          in: ['WARNING', 'CRITICAL'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    let sentCount = 0

    for (const insight of insights) {
      await this.createNotification({
        userId,
        type: 'AI_INSIGHT',
        title: insight.title,
        message: insight.description,
        priority: insight.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
        actionUrl: `/dashboard/insights`,
        actionLabel: insight.actionable ? insight.suggestedAction || 'Zobacz szczegóły' : 'Zobacz szczegóły',
      })
      sentCount++
    }

    return sentCount
  }

  /**
   * Process all scheduled notifications
   */
  async processScheduledNotifications() {
    const now = new Date()

    const scheduledNotifications = await prisma.notification.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        sentAt: null,
      },
    })

    for (const notification of scheduledNotifications) {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
      })

      if (user?.email) {
        await this.emailService.sendEmail(
          user.email,
          notification.title,
          notification.message
        )

        await prisma.notification.update({
          where: { id: notification.id },
          data: { sentAt: now },
        })
      }
    }

    return scheduledNotifications.length
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Send all reminders for a user
 */
export async function sendAllReminders(userId: string) {
  const service = new NotificationService()

  const paymentReminders = await service.sendPaymentReminders(userId)
  const taxReminders = await service.sendTaxDeadlineReminders(userId)
  const cashflowAlerts = await service.sendCashflowAlerts(userId)
  const aiInsights = await service.sendAIInsightNotifications(userId)

  return {
    paymentReminders,
    taxReminders,
    cashflowAlerts,
    aiInsights,
    total: paymentReminders + taxReminders + cashflowAlerts + aiInsights,
  }
}

/**
 * Get notification summary for user
 */
export async function getNotificationSummary(userId: string) {
  const unread = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  })

  const urgent = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
      priority: 'URGENT',
    },
  })

  const recent = await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  return {
    unread,
    urgent,
    recent,
  }
}








