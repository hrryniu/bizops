/**
 * 💸 Tax & ZUS Calculator Service
 * 
 * Automatic calculation of Polish taxes and ZUS contributions:
 * - PIT (Personal Income Tax) - linear and scale
 * - CIT (Corporate Income Tax)
 * - ZUS (Social Insurance)
 * - VAT settlements
 */

import { prisma } from '@/lib/db'
import { TAX_CONFIG } from '@/lib/config'
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'

// ========================================
// Types
// ========================================

export type BusinessType = 'SOLE_PROPRIETORSHIP' | 'LIMITED_COMPANY'
export type TaxForm = 'PIT-36' | 'PIT-36L' | 'CIT-8'
export type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

export interface TaxCalculationInput {
  userId: string
  periodType: PeriodType
  periodStart: Date
  periodEnd: Date
  businessType: BusinessType
  taxForm: TaxForm
}

export interface TaxCalculationResult {
  totalRevenue: number
  totalExpenses: number
  taxableIncome: number
  pitAmount: number
  citAmount: number
  zusAmount: number
  vatAmount: number
  healthInsurance: number
  socialInsurance: number
  totalTaxLiability: number
  breakdown: TaxBreakdown
}

export interface TaxBreakdown {
  // Revenue breakdown
  revenueByCategory: Record<string, number>
  revenueByMonth: Record<string, number>
  
  // Expense breakdown
  expenseByCategory: Record<string, number>
  expenseByMonth: Record<string, number>
  
  // ZUS breakdown
  zusDetails: {
    emerytalna: number
    rentowa: number
    chorobowa: number
    wypadkowa: number
    zdrowotna: number
    fp: number
    fgsp: number
  }
  
  // VAT breakdown
  vatDetails: {
    vatInput: number    // VAT naliczony (from expenses)
    vatOutput: number   // VAT należny (from invoices)
    vatBalance: number  // VAT do zapłaty lub zwrotu
  }
}

// ========================================
// Tax Calculator Service
// ========================================

export class TaxCalculatorService {
  /**
   * Calculate taxes for a specific period
   */
  async calculateTaxes(input: TaxCalculationInput): Promise<TaxCalculationResult> {
    // Fetch all invoices (revenue) for the period
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: input.userId,
        issueDate: {
          gte: input.periodStart,
          lte: input.periodEnd,
        },
        status: {
          in: ['ISSUED', 'PAID'],
        },
      },
      include: {
        items: true,
      },
    })

    // Fetch all expenses for the period
    const expenses = await prisma.expense.findMany({
      where: {
        userId: input.userId,
        date: {
          gte: input.periodStart,
          lte: input.periodEnd,
        },
        isInstallment: false, // Exclude installment purchases
      },
    })

    // Calculate totals
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalNet), 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.netAmount), 0)
    const taxableIncome = totalRevenue - totalExpenses

    // Calculate ZUS
    const zusResult = this.calculateZUS(input.businessType)
    
    // Calculate health insurance (based on income)
    const healthInsurance = this.calculateHealthInsurance(taxableIncome, input.businessType)
    
    // Calculate PIT or CIT
    let pitAmount = 0
    let citAmount = 0

    if (input.businessType === 'SOLE_PROPRIETORSHIP') {
      pitAmount = this.calculatePIT(taxableIncome, input.taxForm, healthInsurance)
    } else {
      citAmount = this.calculateCIT(taxableIncome)
    }

    // Calculate VAT
    const vatResult = this.calculateVAT(invoices, expenses)

    // Build breakdown
    const breakdown = this.buildBreakdown(invoices, expenses, zusResult, vatResult)

    const totalTaxLiability = pitAmount + citAmount + zusResult.total + vatResult.vatBalance

    return {
      totalRevenue,
      totalExpenses,
      taxableIncome,
      pitAmount,
      citAmount,
      zusAmount: zusResult.total,
      vatAmount: vatResult.vatBalance,
      healthInsurance,
      socialInsurance: zusResult.total - zusResult.zdrowotna,
      totalTaxLiability,
      breakdown,
    }
  }

  /**
   * Calculate ZUS contributions (fixed amounts + percentage-based)
   */
  private calculateZUS(businessType: BusinessType): {
    emerytalna: number
    rentowa: number
    chorobowa: number
    wypadkowa: number
    zdrowotna: number
    fp: number
    fgsp: number
    total: number
  } {
    const config = TAX_CONFIG.zus

    // Fixed monthly contributions
    const emerytalna = config.emerytalna
    const rentowa = config.rentowa
    const chorobowa = config.chorobowa
    const wypadkowa = config.wypadkowa
    const fp = config.fp
    const fgsp = config.fgsp

    // Health insurance is based on income (simplified calculation)
    // Minimum: ~381 PLN, Maximum: ~1200 PLN (2025 rates)
    const zdrowotna = 381.81 // Simplified - should be calculated based on income

    const total = emerytalna + rentowa + chorobowa + wypadkowa + zdrowotna + fp + fgsp

    return {
      emerytalna,
      rentowa,
      chorobowa,
      wypadkowa,
      zdrowotna,
      fp,
      fgsp,
      total,
    }
  }

  /**
   * Calculate health insurance contribution
   */
  private calculateHealthInsurance(income: number, businessType: BusinessType): number {
    if (businessType === 'LIMITED_COMPANY') {
      return 0 // Different rules for companies
    }

    // Health insurance is 9% of income base
    // Simplified calculation - actual is more complex
    const baseAmount = Math.min(Math.max(income * 0.6, 4242.00), 13333.00)
    return baseAmount * TAX_CONFIG.zus.zdrowotnaRate
  }

  /**
   * Calculate PIT (Personal Income Tax)
   */
  private calculatePIT(
    taxableIncome: number,
    taxForm: TaxForm,
    healthInsurance: number
  ): number {
    if (taxableIncome <= 0) return 0

    let tax = 0

    if (taxForm === 'PIT-36L') {
      // Linear tax (19%)
      tax = taxableIncome * TAX_CONFIG.pit.linearRate
    } else {
      // Progressive tax scale
      const threshold = TAX_CONFIG.pit.scaleThreshold
      const allowance = TAX_CONFIG.pit.allowance

      if (taxableIncome <= allowance) {
        return 0
      }

      const taxableAfterAllowance = taxableIncome - allowance

      if (taxableAfterAllowance <= threshold) {
        tax = taxableAfterAllowance * TAX_CONFIG.pit.scaleRate1
      } else {
        const taxOnThreshold = threshold * TAX_CONFIG.pit.scaleRate1
        const taxAboveThreshold = (taxableAfterAllowance - threshold) * TAX_CONFIG.pit.scaleRate2
        tax = taxOnThreshold + taxAboveThreshold
      }
    }

    // Subtract health insurance contribution (7.75% of contribution)
    const healthDeduction = healthInsurance * 0.0775
    tax = Math.max(0, tax - healthDeduction)

    return Math.round(tax * 100) / 100
  }

  /**
   * Calculate CIT (Corporate Income Tax)
   */
  private calculateCIT(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0

    // Standard CIT rate in Poland: 19%
    // Small companies (<2M EUR revenue): 9%
    const rate = taxableIncome < 2000000 ? 0.09 : 0.19

    return Math.round(taxableIncome * rate * 100) / 100
  }

  /**
   * Calculate VAT settlement
   */
  private calculateVAT(
    invoices: any[],
    expenses: any[]
  ): {
    vatInput: number
    vatOutput: number
    vatBalance: number
  } {
    // VAT Output (from issued invoices)
    const vatOutput = invoices.reduce((sum, inv) => sum + Number(inv.totalVat), 0)

    // VAT Input (from expenses)
    const vatInput = expenses.reduce((sum, exp) => sum + Number(exp.vatAmount), 0)

    // VAT Balance (positive = to pay, negative = to receive)
    const vatBalance = vatOutput - vatInput

    return {
      vatInput,
      vatOutput,
      vatBalance,
    }
  }

  /**
   * Build detailed breakdown
   */
  private buildBreakdown(
    invoices: any[],
    expenses: any[],
    zusResult: any,
    vatResult: any
  ): TaxBreakdown {
    // Revenue by category (invoice items)
    const revenueByCategory: Record<string, number> = {}
    invoices.forEach(inv => {
      inv.items?.forEach((item: any) => {
        const category = item.name.split(' ')[0] // Simple categorization
        revenueByCategory[category] = (revenueByCategory[category] || 0) + Number(item.lineNet)
      })
    })

    // Revenue by month
    const revenueByMonth: Record<string, number> = {}
    invoices.forEach(inv => {
      const month = inv.issueDate.toISOString().substring(0, 7)
      revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(inv.totalNet)
    })

    // Expense by category
    const expenseByCategory: Record<string, number> = {}
    expenses.forEach(exp => {
      const category = exp.category || 'Inne'
      expenseByCategory[category] = (expenseByCategory[category] || 0) + Number(exp.netAmount)
    })

    // Expense by month
    const expenseByMonth: Record<string, number> = {}
    expenses.forEach(exp => {
      const month = exp.date.toISOString().substring(0, 7)
      expenseByMonth[month] = (expenseByMonth[month] || 0) + Number(exp.netAmount)
    })

    return {
      revenueByCategory,
      revenueByMonth,
      expenseByCategory,
      expenseByMonth,
      zusDetails: zusResult,
      vatDetails: vatResult,
    }
  }

  /**
   * Save calculation to database
   */
  async saveCalculation(
    input: TaxCalculationInput,
    result: TaxCalculationResult
  ) {
    return await prisma.taxCalculation.create({
      data: {
        userId: input.userId,
        periodType: input.periodType,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        businessType: input.businessType,
        taxForm: input.taxForm,
        totalRevenue: result.totalRevenue,
        totalExpenses: result.totalExpenses,
        taxableIncome: result.taxableIncome,
        pitAmount: result.pitAmount,
        citAmount: result.citAmount,
        zusAmount: result.zusAmount,
        vatAmount: result.vatAmount,
        healthInsurance: result.healthInsurance,
        socialInsurance: result.socialInsurance,
        totalTaxLiability: result.totalTaxLiability,
        calculationData: JSON.stringify(result.breakdown),
        status: 'DRAFT',
      },
    })
  }

  /**
   * Generate tax summary report as CSV
   */
  async generateCSV(calculationId: string): Promise<string> {
    const calculation = await prisma.taxCalculation.findUnique({
      where: { id: calculationId },
    })

    if (!calculation) {
      throw new Error('Calculation not found')
    }

    const breakdown = JSON.parse(calculation.calculationData || '{}')

    let csv = 'Typ,Kategoria,Kwota\n'
    csv += `Przychody,Razem,${calculation.totalRevenue}\n`
    csv += `Koszty,Razem,${calculation.totalExpenses}\n`
    csv += `Dochód,Do opodatkowania,${calculation.taxableIncome}\n`
    csv += `PIT,Do zapłaty,${calculation.pitAmount}\n`
    csv += `CIT,Do zapłaty,${calculation.citAmount}\n`
    csv += `ZUS,Razem,${calculation.zusAmount}\n`
    csv += `VAT,Do rozliczenia,${calculation.vatAmount}\n`
    csv += `SUMA,Zobowiązania podatkowe,${calculation.totalTaxLiability}\n`

    // Add breakdown details
    csv += '\n\nPrzychody wg kategorii\n'
    csv += 'Kategoria,Kwota\n'
    Object.entries(breakdown.revenueByCategory || {}).forEach(([cat, amount]) => {
      csv += `${cat},${amount}\n`
    })

    csv += '\n\nKoszty wg kategorii\n'
    csv += 'Kategoria,Kwota\n'
    Object.entries(breakdown.expenseByCategory || {}).forEach(([cat, amount]) => {
      csv += `${cat},${amount}\n`
    })

    return csv
  }

  /**
   * Get tax calculation summary for a period
   */
  async getSummary(
    userId: string,
    periodType: PeriodType,
    date: Date
  ) {
    let periodStart: Date
    let periodEnd: Date

    switch (periodType) {
      case 'MONTHLY':
        periodStart = startOfMonth(date)
        periodEnd = endOfMonth(date)
        break
      case 'QUARTERLY':
        periodStart = startOfQuarter(date)
        periodEnd = endOfQuarter(date)
        break
      case 'ANNUAL':
        periodStart = startOfYear(date)
        periodEnd = endOfYear(date)
        break
    }

    return await prisma.taxCalculation.findFirst({
      where: {
        userId,
        periodType,
        periodStart: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Calculate taxes for current month
 */
export async function calculateCurrentMonth(
  userId: string,
  businessType: BusinessType,
  taxForm: TaxForm
) {
  const calculator = new TaxCalculatorService()
  const now = new Date()

  const input: TaxCalculationInput = {
    userId,
    periodType: 'MONTHLY',
    periodStart: startOfMonth(now),
    periodEnd: endOfMonth(now),
    businessType,
    taxForm,
  }

  const result = await calculator.calculateTaxes(input)
  await calculator.saveCalculation(input, result)

  return result
}

/**
 * Calculate taxes for current quarter
 */
export async function calculateCurrentQuarter(
  userId: string,
  businessType: BusinessType,
  taxForm: TaxForm
) {
  const calculator = new TaxCalculatorService()
  const now = new Date()

  const input: TaxCalculationInput = {
    userId,
    periodType: 'QUARTERLY',
    periodStart: startOfQuarter(now),
    periodEnd: endOfQuarter(now),
    businessType,
    taxForm,
  }

  const result = await calculator.calculateTaxes(input)
  await calculator.saveCalculation(input, result)

  return result
}

/**
 * Calculate taxes for full year
 */
export async function calculateCurrentYear(
  userId: string,
  businessType: BusinessType,
  taxForm: TaxForm
) {
  const calculator = new TaxCalculatorService()
  const now = new Date()

  const input: TaxCalculationInput = {
    userId,
    periodType: 'ANNUAL',
    periodStart: startOfYear(now),
    periodEnd: endOfYear(now),
    businessType,
    taxForm,
  }

  const result = await calculator.calculateTaxes(input)
  await calculator.saveCalculation(input, result)

  return result
}








