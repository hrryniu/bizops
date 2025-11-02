/**
 * ⚙️ Background Jobs Service
 * 
 * Orchestrates scheduled background tasks:
 * - Bank synchronization
 * - KPI calculation
 * - AI insights generation
 * - Notification processing
 * - Cashflow forecasting
 */

import cron from 'node-cron'
import { APP_CONFIG } from '@/lib/config'
import { syncAllUserBankConnections } from './bank-integration'
import { calculateAllUsersKPIs } from './kpi-calculator'
import { generateUserInsights } from './ai-assistant'
import { NotificationService, sendAllReminders } from './notification-service'
import { generateUserForecast } from './cashflow-forecast'
import { prisma } from '@/lib/db'

// ========================================
// Background Jobs Manager
// ========================================

export class BackgroundJobsService {
  private jobs: Map<string, cron.ScheduledTask> = new Map()
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }

  /**
   * Start all background jobs
   */
  startAll() {
    if (!APP_CONFIG.backgroundJobs.enabled) {
      console.log('⏸️  Background jobs disabled')
      return
    }

    console.log('🚀 Starting background jobs...')

    // Bank sync job (daily at 6 AM)
    this.scheduleJob('bank-sync', APP_CONFIG.backgroundJobs.bankSyncCron, async () => {
      console.log('🏦 Running bank sync job...')
      await this.syncAllBankAccounts()
    })

    // KPI calculation job (daily at midnight)
    this.scheduleJob('kpi-calculation', APP_CONFIG.backgroundJobs.kpiCalculationCron, async () => {
      console.log('📊 Running KPI calculation job...')
      await this.calculateAllKPIs()
    })

    // AI insights job (daily at 7 AM)
    this.scheduleJob('ai-insights', APP_CONFIG.backgroundJobs.aiInsightsCron, async () => {
      console.log('🤖 Running AI insights job...')
      await this.generateAllInsights()
    })

    // Notification processing (every 15 minutes)
    this.scheduleJob('notifications', '*/15 * * * *', async () => {
      console.log('🔔 Processing notifications...')
      await this.processNotifications()
    })

    // Cashflow forecasting (weekly on Monday at 8 AM)
    this.scheduleJob('cashflow-forecast', '0 8 * * 1', async () => {
      console.log('💧 Generating cashflow forecasts...')
      await this.generateAllForecasts()
    })

    // Daily reminders (every day at 9 AM)
    this.scheduleJob('daily-reminders', '0 9 * * *', async () => {
      console.log('📬 Sending daily reminders...')
      await this.sendDailyReminders()
    })

    console.log('✅ Background jobs started')
  }

  /**
   * Stop all background jobs
   */
  stopAll() {
    console.log('⏹️  Stopping background jobs...')
    
    this.jobs.forEach((job, name) => {
      job.stop()
      console.log(`  ✓ Stopped: ${name}`)
    })

    this.jobs.clear()
    console.log('✅ All background jobs stopped')
  }

  /**
   * Schedule a job
   */
  private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>) {
    try {
      const job = cron.schedule(cronExpression, async () => {
        const startTime = Date.now()
        
        try {
          await task()
          const duration = Date.now() - startTime
          console.log(`  ✅ ${name} completed in ${duration}ms`)
        } catch (error) {
          console.error(`  ❌ ${name} failed:`, error)
        }
      })

      this.jobs.set(name, job)
      console.log(`  ✓ Scheduled: ${name} (${cronExpression})`)
    } catch (error) {
      console.error(`  ❌ Failed to schedule ${name}:`, error)
    }
  }

  /**
   * Sync all bank accounts
   */
  private async syncAllBankAccounts() {
    const users = await prisma.user.findMany()

    for (const user of users) {
      try {
        const synced = await syncAllUserBankConnections(user.id)
        if (synced > 0) {
          console.log(`  📥 Synced ${synced} transactions for ${user.email}`)

          // Send notification about successful sync
          await this.notificationService.createNotification({
            userId: user.id,
            type: 'BANK_SYNC',
            title: 'Konto bankowe zsynchronizowane',
            message: `Pobrano ${synced} nowych transakcji z Twojego konta bankowego.`,
            priority: 'LOW',
            actionUrl: '/banking',
            actionLabel: 'Zobacz transakcje',
          })
        }
      } catch (error) {
        console.error(`  ❌ Failed to sync bank for ${user.email}:`, error)
      }
    }
  }

  /**
   * Calculate KPIs for all users
   */
  private async calculateAllKPIs() {
    await calculateAllUsersKPIs('MONTHLY')
  }

  /**
   * Generate AI insights for all users
   */
  private async generateAllInsights() {
    const users = await prisma.user.findMany()

    for (const user of users) {
      try {
        await generateUserInsights(user.id)
        console.log(`  🧠 Generated insights for ${user.email}`)
      } catch (error) {
        console.error(`  ❌ Failed to generate insights for ${user.email}:`, error)
      }
    }
  }

  /**
   * Generate cashflow forecasts for all users
   */
  private async generateAllForecasts() {
    const users = await prisma.user.findMany()

    for (const user of users) {
      try {
        await generateUserForecast(user.id, 3)
        console.log(`  📈 Generated forecast for ${user.email}`)
      } catch (error) {
        console.error(`  ❌ Failed to generate forecast for ${user.email}:`, error)
      }
    }
  }

  /**
   * Process scheduled notifications
   */
  private async processNotifications() {
    const processed = await this.notificationService.processScheduledNotifications()
    if (processed > 0) {
      console.log(`  📤 Sent ${processed} scheduled notifications`)
    }
  }

  /**
   * Send daily reminders to all users
   */
  private async sendDailyReminders() {
    const users = await prisma.user.findMany()

    for (const user of users) {
      try {
        const result = await sendAllReminders(user.id)
        if (result.total > 0) {
          console.log(`  📮 Sent ${result.total} reminders to ${user.email}`)
        }
      } catch (error) {
        console.error(`  ❌ Failed to send reminders to ${user.email}:`, error)
      }
    }
  }

  /**
   * Run a specific job manually
   */
  async runJobManually(jobName: string) {
    console.log(`🔧 Running job manually: ${jobName}`)

    switch (jobName) {
      case 'bank-sync':
        await this.syncAllBankAccounts()
        break
      case 'kpi-calculation':
        await this.calculateAllKPIs()
        break
      case 'ai-insights':
        await this.generateAllInsights()
        break
      case 'notifications':
        await this.processNotifications()
        break
      case 'cashflow-forecast':
        await this.generateAllForecasts()
        break
      case 'daily-reminders':
        await this.sendDailyReminders()
        break
      default:
        throw new Error(`Unknown job: ${jobName}`)
    }

    console.log(`✅ Job completed: ${jobName}`)
  }

  /**
   * Get job status
   */
  getStatus() {
    const jobs: any[] = []

    this.jobs.forEach((job, name) => {
      jobs.push({
        name,
        running: true,
      })
    })

    return {
      enabled: APP_CONFIG.backgroundJobs.enabled,
      activeJobs: jobs.length,
      jobs,
    }
  }
}

// ========================================
// Singleton Instance
// ========================================

let backgroundJobsService: BackgroundJobsService | null = null

/**
 * Get or create background jobs service instance
 */
export function getBackgroundJobsService(): BackgroundJobsService {
  if (!backgroundJobsService) {
    backgroundJobsService = new BackgroundJobsService()
  }
  return backgroundJobsService
}

/**
 * Initialize background jobs (call this on app startup)
 */
export function initializeBackgroundJobs() {
  const service = getBackgroundJobsService()
  service.startAll()
  return service
}

/**
 * Shutdown background jobs (call this on app shutdown)
 */
export function shutdownBackgroundJobs() {
  if (backgroundJobsService) {
    backgroundJobsService.stopAll()
    backgroundJobsService = null
  }
}








