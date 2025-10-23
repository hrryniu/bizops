/**
 * 💧 Cashflow Forecasting Service
 * 
 * Predicts future cashflow using statistical models:
 * - Moving averages
 * - Linear regression
 * - Seasonal decomposition
 * - Liquidity alerts
 */

import { prisma } from '@/lib/db'
import { ANALYTICS_CONFIG } from '@/lib/config'
import { 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  format,
  differenceInMonths 
} from 'date-fns'
import { linearRegression, linearRegressionLine } from 'simple-statistics'

// ========================================
// Types
// ========================================

export interface CashflowPrediction {
  date: Date
  expectedRevenue: number
  expectedExpenses: number
  expectedCashflow: number
  cumulativeCashflow: number
  confidence: number
}

export interface CashflowForecastResult {
  predictions: CashflowPrediction[]
  currentBalance: number
  minimumBalance: number
  maximumBalance: number
  alerts: CashflowAlert[]
  modelAccuracy: number
}

export interface CashflowAlert {
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  date: Date
  amount: number
}

export interface HistoricalData {
  date: Date
  revenue: number
  expenses: number
  cashflow: number
}

// ========================================
// Cashflow Forecast Service
// ========================================

export class CashflowForecastService {
  /**
   * Generate cashflow forecast for upcoming months
   */
  async generateForecast(
    userId: string,
    horizonMonths: number = ANALYTICS_CONFIG.cashflowForecast.horizonMonths
  ): Promise<CashflowForecastResult> {
    // Get historical data (last 12 months)
    const historicalData = await this.getHistoricalData(userId, 12)

    if (historicalData.length < 3) {
      throw new Error('Insufficient historical data for forecasting (minimum 3 months required)')
    }

    // Generate predictions
    const predictions = await this.predictFutureCashflow(
      historicalData,
      horizonMonths
    )

    // Calculate current balance estimate
    const currentBalance = await this.estimateCurrentBalance(userId)

    // Calculate cumulative cashflow with current balance
    let cumulativeBalance = currentBalance
    const predictionsWithCumulative = predictions.map(pred => {
      cumulativeBalance += pred.expectedCashflow
      return {
        ...pred,
        cumulativeCashflow: cumulativeBalance,
      }
    })

    // Find min and max
    const balances = predictionsWithCumulative.map(p => p.cumulativeCashflow)
    const minimumBalance = Math.min(...balances)
    const maximumBalance = Math.max(...balances)

    // Generate alerts
    const alerts = this.generateAlerts(predictionsWithCumulative, currentBalance)

    // Calculate model accuracy
    const modelAccuracy = this.calculateModelAccuracy(historicalData)

    // Save predictions to database
    await this.savePredictions(userId, predictionsWithCumulative)

    return {
      predictions: predictionsWithCumulative,
      currentBalance,
      minimumBalance,
      maximumBalance,
      alerts,
      modelAccuracy,
    }
  }

  /**
   * Get historical cashflow data
   */
  private async getHistoricalData(
    userId: string,
    months: number
  ): Promise<HistoricalData[]> {
    const data: HistoricalData[] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)

      // Get revenue
      const invoices = await prisma.invoice.findMany({
        where: {
          userId,
          issueDate: { gte: start, lte: end },
          status: { in: ['ISSUED', 'PAID'] },
        },
      })

      const revenue = invoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0)

      // Get expenses
      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
          isInstallment: false,
        },
      })

      const expenseTotal = expenses.reduce((sum, exp) => sum + Number(exp.grossAmount), 0)

      data.push({
        date: start,
        revenue,
        expenses: expenseTotal,
        cashflow: revenue - expenseTotal,
      })
    }

    return data
  }

  /**
   * Predict future cashflow using multiple methods
   */
  private async predictFutureCashflow(
    historical: HistoricalData[],
    horizonMonths: number
  ): Promise<CashflowPrediction[]> {
    const predictions: CashflowPrediction[] = []

    // Calculate trends using linear regression
    const revenueTrend = this.calculateTrend(historical.map(h => h.revenue))
    const expenseTrend = this.calculateTrend(historical.map(h => h.expenses))

    // Calculate moving averages
    const revenueAvg = this.movingAverage(historical.map(h => h.revenue), 3)
    const expenseAvg = this.movingAverage(historical.map(h => h.expenses), 3)

    // Detect seasonality
    const revenueSeasonal = this.detectSeasonality(historical.map(h => h.revenue))
    const expenseSeasonal = this.detectSeasonality(historical.map(h => h.expenses))

    const lastDate = historical[historical.length - 1].date

    for (let i = 1; i <= horizonMonths; i++) {
      const futureDate = addMonths(lastDate, i)
      const monthIndex = futureDate.getMonth()

      // Predict revenue (trend + seasonality)
      const revenueTrendValue = revenueTrend.slope * (historical.length + i) + revenueTrend.intercept
      const revenueSeasonalFactor = revenueSeasonal[monthIndex] || 1
      const expectedRevenue = Math.max(0, revenueTrendValue * revenueSeasonalFactor)

      // Predict expenses (trend + seasonality)
      const expenseTrendValue = expenseTrend.slope * (historical.length + i) + expenseTrend.intercept
      const expenseSeasonalFactor = expenseSeasonal[monthIndex] || 1
      const expectedExpenses = Math.max(0, expenseTrendValue * expenseSeasonalFactor)

      // Calculate confidence (decreases with distance)
      const baseConfidence = ANALYTICS_CONFIG.cashflowForecast.confidenceThreshold
      const confidence = baseConfidence - (i - 1) * 0.05

      predictions.push({
        date: futureDate,
        expectedRevenue: Math.round(expectedRevenue * 100) / 100,
        expectedExpenses: Math.round(expectedExpenses * 100) / 100,
        expectedCashflow: Math.round((expectedRevenue - expectedExpenses) * 100) / 100,
        cumulativeCashflow: 0, // Will be calculated later
        confidence: Math.max(0.5, confidence),
      })
    }

    return predictions
  }

  /**
   * Calculate trend using linear regression
   */
  private calculateTrend(values: number[]): { slope: number; intercept: number } {
    const points: [number, number][] = values.map((v, i) => [i, v])
    
    try {
      const regression = linearRegression(points)
      const line = linearRegressionLine(regression)
      
      return {
        slope: regression.m,
        intercept: regression.b,
      }
    } catch {
      // Fallback to simple average if regression fails
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length
      return { slope: 0, intercept: avg }
    }
  }

  /**
   * Calculate moving average
   */
  private movingAverage(values: number[], window: number): number {
    const slice = values.slice(-window)
    return slice.reduce((sum, v) => sum + v, 0) / slice.length
  }

  /**
   * Detect seasonal patterns (monthly)
   */
  private detectSeasonality(values: number[]): Record<number, number> {
    // Group by month and calculate average factor
    const seasonal: Record<number, number[]> = {}
    const overallAvg = values.reduce((sum, v) => sum + v, 0) / values.length

    values.forEach((value, index) => {
      const month = index % 12
      if (!seasonal[month]) seasonal[month] = []
      seasonal[month].push(value / (overallAvg || 1))
    })

    // Calculate average seasonal factor for each month
    const seasonalFactors: Record<number, number> = {}
    Object.keys(seasonal).forEach(month => {
      const factors = seasonal[parseInt(month)]
      seasonalFactors[parseInt(month)] = factors.reduce((sum, f) => sum + f, 0) / factors.length
    })

    return seasonalFactors
  }

  /**
   * Estimate current balance from bank connections
   */
  private async estimateCurrentBalance(userId: string): number {
    // Try to get actual balance from bank connections
    const bankConnections = await prisma.bankConnection.findMany({
      where: {
        userId,
        isActive: true,
      },
    })

    if (bankConnections.length === 0) {
      // Estimate from invoices and expenses
      const paidInvoices = await prisma.invoice.findMany({
        where: {
          userId,
          status: 'PAID',
        },
      })

      const allExpenses = await prisma.expense.findMany({
        where: {
          userId,
        },
      })

      const totalInflow = paidInvoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0)
      const totalOutflow = allExpenses.reduce((sum, exp) => sum + Number(exp.grossAmount), 0)

      return totalInflow - totalOutflow
    }

    // Calculate balance from transactions
    let balance = 0

    for (const connection of bankConnections) {
      const transactions = await prisma.bankTransaction.findMany({
        where: {
          bankConnectionId: connection.id,
        },
      })

      transactions.forEach(txn => {
        if (txn.type === 'CREDIT') {
          balance += Number(txn.amount)
        } else {
          balance -= Number(txn.amount)
        }
      })
    }

    return balance
  }

  /**
   * Generate cashflow alerts
   */
  private generateAlerts(
    predictions: CashflowPrediction[],
    currentBalance: number
  ): CashflowAlert[] {
    const alerts: CashflowAlert[] = []
    const threshold = 5000 // Minimum safe balance (PLN)

    predictions.forEach(pred => {
      // Low balance warning
      if (pred.cumulativeCashflow < threshold && pred.cumulativeCashflow > 0) {
        alerts.push({
          severity: 'WARNING',
          message: `Niskie saldo przewidywane w ${format(pred.date, 'MMMM yyyy')}`,
          date: pred.date,
          amount: pred.cumulativeCashflow,
        })
      }

      // Negative cashflow critical
      if (pred.cumulativeCashflow < 0) {
        alerts.push({
          severity: 'CRITICAL',
          message: `Ujemny cashflow przewidywany w ${format(pred.date, 'MMMM yyyy')}`,
          date: pred.date,
          amount: pred.cumulativeCashflow,
        })
      }

      // Positive trend info
      if (pred.expectedCashflow > 10000) {
        alerts.push({
          severity: 'INFO',
          message: `Wysoki dodatni cashflow w ${format(pred.date, 'MMMM yyyy')}`,
          date: pred.date,
          amount: pred.expectedCashflow,
        })
      }
    })

    return alerts
  }

  /**
   * Calculate model accuracy (simplified)
   */
  private calculateModelAccuracy(historical: HistoricalData[]): number {
    if (historical.length < 2) return 0

    // Calculate coefficient of variation
    const values = historical.map(h => h.cashflow)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    const cv = mean !== 0 ? stdDev / Math.abs(mean) : 0

    // Convert to accuracy percentage (inverse of CV)
    const accuracy = Math.max(0, Math.min(1, 1 - cv)) * 100

    return Math.round(accuracy)
  }

  /**
   * Save predictions to database
   */
  private async savePredictions(
    userId: string,
    predictions: CashflowPrediction[]
  ) {
    for (const pred of predictions) {
      // Check if prediction exists
      const existing = await prisma.cashflowForecast.findFirst({
        where: {
          userId,
          forecastDate: pred.date,
          forecastType: 'PREDICTED',
        },
      })

      if (existing) {
        await prisma.cashflowForecast.update({
          where: { id: existing.id },
          data: {
            expectedRevenue: pred.expectedRevenue,
            expectedExpenses: pred.expectedExpenses,
            expectedCashflow: pred.expectedCashflow,
            cumulativeCashflow: pred.cumulativeCashflow,
            confidence: pred.confidence,
          },
        })
      } else {
        await prisma.cashflowForecast.create({
          data: {
            userId,
            forecastDate: pred.date,
            forecastType: 'PREDICTED',
            expectedRevenue: pred.expectedRevenue,
            expectedExpenses: pred.expectedExpenses,
            expectedCashflow: pred.expectedCashflow,
            cumulativeCashflow: pred.cumulativeCashflow,
            confidence: pred.confidence,
            modelVersion: 'v1.0',
          },
        })
      }
    }
  }

  /**
   * Update actual cashflow data
   */
  async updateActualCashflow(userId: string, date: Date) {
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    // Calculate actual values
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        issueDate: { gte: start, lte: end },
        status: { in: ['ISSUED', 'PAID'] },
      },
    })

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
    })

    const actualRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0)
    const actualExpenses = expenses.reduce((sum, exp) => sum + Number(exp.grossAmount), 0)
    const actualCashflow = actualRevenue - actualExpenses

    // Find prediction for this month
    const prediction = await prisma.cashflowForecast.findFirst({
      where: {
        userId,
        forecastDate: start,
        forecastType: 'PREDICTED',
      },
    })

    if (prediction) {
      // Calculate variance
      const variance = actualCashflow - Number(prediction.expectedCashflow)

      // Update with actual data
      await prisma.cashflowForecast.update({
        where: { id: prediction.id },
        data: {
          actualRevenue,
          actualExpenses,
          actualCashflow,
          variance,
        },
      })
    }
  }

  /**
   * Get forecast visualization data
   */
  async getForecastChartData(userId: string) {
    const forecasts = await prisma.cashflowForecast.findMany({
      where: {
        userId,
      },
      orderBy: {
        forecastDate: 'asc',
      },
    })

    return forecasts.map(f => ({
      date: format(f.forecastDate, 'yyyy-MM'),
      predicted: Number(f.expectedCashflow),
      actual: f.actualCashflow ? Number(f.actualCashflow) : null,
      cumulativePredicted: Number(f.cumulativeCashflow),
      confidence: Number(f.confidence),
    }))
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Generate forecast for a user
 */
export async function generateUserForecast(userId: string, months: number = 3) {
  const service = new CashflowForecastService()
  return await service.generateForecast(userId, months)
}

/**
 * Update actual cashflow for current month
 */
export async function updateCurrentMonthActuals(userId: string) {
  const service = new CashflowForecastService()
  const now = new Date()
  await service.updateActualCashflow(userId, now)
}

/**
 * Get forecast chart data
 */
export async function getForecastData(userId: string) {
  const service = new CashflowForecastService()
  return await service.getForecastChartData(userId)
}

