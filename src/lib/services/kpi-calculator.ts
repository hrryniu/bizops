/**
 * 📊 KPI Calculator Service
 * 
 * Calculates and tracks Key Performance Indicators:
 * - Revenue, expenses, profit
 * - Cashflow and liquidity
 * - Payment metrics
 * - Growth rates
 */

import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'

// ========================================
// Types
// ========================================

export type KPIPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface KPIMetrics {
  revenue: number
  expenses: number
  netProfit: number
  grossProfit: number
  operatingCashflow: number
  taxLiabilities: number
  outstandingInvoices: number
  outstandingAmount: number
  avgPaymentDays: number
  liquidityRatio: number
  profitMargin: number
  expenseRatio: number
  revenueGrowth: number
  expenseGrowth: number
}

// ========================================
// KPI Calculator Service
// ========================================

export class KPICalculatorService {
  /**
   * Calculate KPIs for a specific period
   */
  async calculateKPIs(
    userId: string,
    period: KPIPeriod,
    date: Date = new Date()
  ): Promise<KPIMetrics> {
    const { start, end } = this.getPeriodBounds(period, date)

    // Get invoices for the period
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['ISSUED', 'PAID'],
        },
      },
    })

    // Get expenses for the period
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
        isInstallment: false,
      },
    })

    // Calculate basic metrics
    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.totalNet), 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.netAmount), 0)
    const netProfit = revenue - totalExpenses
    const grossProfit = invoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0) -
                       expenses.reduce((sum, exp) => sum + Number(exp.grossAmount), 0)

    // Operating cashflow (simplified)
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID')
    const cashInflow = paidInvoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0)
    const cashOutflow = totalExpenses
    const operatingCashflow = cashInflow - cashOutflow

    // Tax liabilities (estimate based on recent calculations)
    const taxLiabilities = await this.estimateTaxLiabilities(userId, start, end)

    // Outstanding invoices
    const outstandingInvoices = await prisma.invoice.count({
      where: {
        userId,
        status: 'ISSUED',
      },
    })

    const outstandingInvoicesData = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'ISSUED',
      },
    })

    const outstandingAmount = outstandingInvoicesData.reduce(
      (sum, inv) => sum + Number(inv.totalGross),
      0
    )

    // Average payment days
    const avgPaymentDays = await this.calculateAvgPaymentDays(userId, start, end)

    // Liquidity ratio (simplified: current assets / current liabilities)
    // Using outstanding invoices as assets and tax liabilities as liabilities
    const liquidityRatio = taxLiabilities > 0 
      ? outstandingAmount / taxLiabilities 
      : outstandingAmount > 0 ? 999 : 0

    // Profit margin
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    // Expense ratio
    const expenseRatio = revenue > 0 ? (totalExpenses / revenue) * 100 : 0

    // Growth rates (compared to previous period)
    const { revenueGrowth, expenseGrowth } = await this.calculateGrowthRates(
      userId,
      period,
      date,
      revenue,
      totalExpenses
    )

    return {
      revenue,
      expenses: totalExpenses,
      netProfit,
      grossProfit,
      operatingCashflow,
      taxLiabilities,
      outstandingInvoices,
      outstandingAmount,
      avgPaymentDays,
      liquidityRatio,
      profitMargin,
      expenseRatio,
      revenueGrowth,
      expenseGrowth,
    }
  }

  /**
   * Calculate average payment days for invoices
   */
  private async calculateAvgPaymentDays(
    userId: string,
    start: Date,
    end: Date
  ): Promise<number> {
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'PAID',
        issueDate: {
          gte: start,
          lte: end,
        },
        dueDate: {
          not: null,
        },
      },
    })

    if (paidInvoices.length === 0) return 0

    const totalDays = paidInvoices.reduce((sum, inv) => {
      if (!inv.dueDate) return sum
      // Estimate payment date as issue date + 30 days (simplified)
      const estimatedPaymentDate = new Date(inv.issueDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const days = differenceInDays(estimatedPaymentDate, inv.issueDate)
      return sum + days
    }, 0)

    return Math.round(totalDays / paidInvoices.length)
  }

  /**
   * Estimate tax liabilities
   */
  private async estimateTaxLiabilities(
    userId: string,
    start: Date,
    end: Date
  ): Promise<number> {
    const latestCalc = await prisma.taxCalculation.findFirst({
      where: {
        userId,
        periodStart: {
          gte: start,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return latestCalc ? Number(latestCalc.totalTaxLiability) : 0
  }

  /**
   * Calculate growth rates compared to previous period
   */
  private async calculateGrowthRates(
    userId: string,
    period: KPIPeriod,
    currentDate: Date,
    currentRevenue: number,
    currentExpenses: number
  ): Promise<{ revenueGrowth: number; expenseGrowth: number }> {
    // Get previous period dates
    let prevStart: Date
    let prevEnd: Date

    if (period === 'DAILY') {
      const prevDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
      prevStart = startOfDay(prevDate)
      prevEnd = endOfDay(prevDate)
    } else if (period === 'WEEKLY') {
      const prevWeekDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      prevStart = startOfWeek(prevWeekDate, { weekStartsOn: 1 })
      prevEnd = endOfWeek(prevWeekDate, { weekStartsOn: 1 })
    } else {
      const prevMonthDate = new Date(currentDate)
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
      prevStart = startOfMonth(prevMonthDate)
      prevEnd = endOfMonth(prevMonthDate)
    }

    // Get previous period data
    const prevInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: prevStart,
          lte: prevEnd,
        },
        status: {
          in: ['ISSUED', 'PAID'],
        },
      },
    })

    const prevExpenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: prevStart,
          lte: prevEnd,
        },
      },
    })

    const prevRevenue = prevInvoices.reduce((sum, inv) => sum + Number(inv.totalNet), 0)
    const prevExpensesTotal = prevExpenses.reduce((sum, exp) => sum + Number(exp.netAmount), 0)

    // Calculate growth percentages
    const revenueGrowth = prevRevenue > 0 
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
      : 0

    const expenseGrowth = prevExpensesTotal > 0 
      ? ((currentExpenses - prevExpensesTotal) / prevExpensesTotal) * 100 
      : 0

    return {
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      expenseGrowth: Math.round(expenseGrowth * 100) / 100,
    }
  }

  /**
   * Get period bounds (start and end dates)
   */
  private getPeriodBounds(period: KPIPeriod, date: Date): { start: Date; end: Date } {
    switch (period) {
      case 'DAILY':
        return {
          start: startOfDay(date),
          end: endOfDay(date),
        }
      case 'WEEKLY':
        return {
          start: startOfWeek(date, { weekStartsOn: 1 }),
          end: endOfWeek(date, { weekStartsOn: 1 }),
        }
      case 'MONTHLY':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        }
    }
  }

  /**
   * Save KPI snapshot to database
   */
  async saveSnapshot(
    userId: string,
    period: KPIPeriod,
    date: Date,
    metrics: KPIMetrics
  ) {
    return await prisma.kPISnapshot.create({
      data: {
        userId,
        date,
        period,
        revenue: metrics.revenue,
        expenses: metrics.expenses,
        netProfit: metrics.netProfit,
        grossProfit: metrics.grossProfit,
        operatingCashflow: metrics.operatingCashflow,
        taxLiabilities: metrics.taxLiabilities,
        outstandingInvoices: metrics.outstandingInvoices,
        outstandingAmount: metrics.outstandingAmount,
        avgPaymentDays: metrics.avgPaymentDays,
        liquidityRatio: metrics.liquidityRatio,
        profitMargin: metrics.profitMargin,
        expenseRatio: metrics.expenseRatio,
        revenueGrowth: metrics.revenueGrowth,
        expenseGrowth: metrics.expenseGrowth,
      },
    })
  }

  /**
   * Get historical KPI data for charts
   */
  async getHistoricalKPIs(
    userId: string,
    period: KPIPeriod,
    limit: number = 12
  ) {
    return await prisma.kPISnapshot.findMany({
      where: {
        userId,
        period,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    })
  }

  /**
   * Get KPI trend data for visualization
   */
  async getKPITrends(userId: string, months: number = 6) {
    const snapshots = await prisma.kPISnapshot.findMany({
      where: {
        userId,
        period: 'MONTHLY',
      },
      orderBy: {
        date: 'desc',
      },
      take: months,
    })

    return snapshots.reverse().map(snapshot => ({
      date: snapshot.date.toISOString().substring(0, 7),
      revenue: Number(snapshot.revenue),
      expenses: Number(snapshot.expenses),
      profit: Number(snapshot.netProfit),
      cashflow: Number(snapshot.operatingCashflow),
      profitMargin: Number(snapshot.profitMargin),
      liquidityRatio: Number(snapshot.liquidityRatio),
    }))
  }

  /**
   * Calculate and save current month KPIs
   */
  async updateCurrentMonthKPIs(userId: string) {
    const now = new Date()
    const metrics = await this.calculateKPIs(userId, 'MONTHLY', now)
    return await this.saveSnapshot(userId, 'MONTHLY', now, metrics)
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Calculate and save KPIs for all active users
 */
export async function calculateAllUsersKPIs(period: KPIPeriod = 'MONTHLY') {
  const users = await prisma.user.findMany()
  const calculator = new KPICalculatorService()

  for (const user of users) {
    try {
      const metrics = await calculator.calculateKPIs(user.id, period)
      await calculator.saveSnapshot(user.id, period, new Date(), metrics)
      console.log(`✅ KPIs calculated for user ${user.email}`)
    } catch (error) {
      console.error(`❌ Failed to calculate KPIs for user ${user.id}:`, error)
    }
  }
}

/**
 * Get dashboard KPI summary
 */
export async function getDashboardKPIs(userId: string) {
  const calculator = new KPICalculatorService()
  return await calculator.calculateKPIs(userId, 'MONTHLY')
}

/**
 * Get KPI chart data
 */
export async function getKPIChartData(userId: string, months: number = 6) {
  const calculator = new KPICalculatorService()
  return await calculator.getKPITrends(userId, months)
}


