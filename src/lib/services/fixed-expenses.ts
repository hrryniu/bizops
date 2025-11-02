/**
 * 💰 Fixed Expenses Service
 * 
 * Helper functions for calculating and managing fixed expenses
 */

import { FixedExpense } from '@prisma/client'
import { addMonths, format, startOfMonth } from 'date-fns'

export interface FixedExpenseWithMonth extends FixedExpense {
  monthLabel: string
  dueDate: Date
}

/**
 * Calculate which months a fixed expense applies to
 */
export function getExpenseMonths(
  expense: FixedExpense,
  startDate: Date,
  monthsCount: number
): Date[] {
  const months: Date[] = []
  
  for (let i = 0; i < monthsCount; i++) {
    const month = addMonths(startOfMonth(startDate), i)
    
    // Check if expense applies to this month based on recurrence
    if (shouldIncludeInMonth(expense, month, startDate)) {
      months.push(month)
    }
  }
  
  return months
}

/**
 * Check if an expense should be included in a specific month
 */
function shouldIncludeInMonth(
  expense: FixedExpense,
  month: Date,
  referenceDate: Date
): boolean {
  if (!expense.isActive) return false
  
  const monthsSinceReference = 
    (month.getFullYear() - referenceDate.getFullYear()) * 12 +
    (month.getMonth() - referenceDate.getMonth())
  
  switch (expense.recurrence) {
    case 'monthly':
      return true
    case 'quarterly':
      return monthsSinceReference % 3 === 0
    case 'yearly':
      return monthsSinceReference % 12 === 0
    default:
      return false
  }
}

/**
 * Get fixed expenses grouped by month
 */
export function groupExpensesByMonth(
  expenses: FixedExpense[],
  startDate: Date,
  monthsCount: number
): Map<string, FixedExpenseWithMonth[]> {
  const grouped = new Map<string, FixedExpenseWithMonth[]>()
  
  for (let i = 0; i < monthsCount; i++) {
    const month = addMonths(startOfMonth(startDate), i)
    const monthKey = format(month, 'yyyy-MM')
    const monthLabel = month.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
    
    const monthExpenses: FixedExpenseWithMonth[] = []
    
    for (const expense of expenses) {
      if (shouldIncludeInMonth(expense, month, startDate)) {
        const dueDate = new Date(month.getFullYear(), month.getMonth(), expense.dueDay)
        
        monthExpenses.push({
          ...expense,
          monthLabel,
          dueDate,
        })
      }
    }
    
    // Sort by due day
    monthExpenses.sort((a, b) => a.dueDay - b.dueDay)
    
    grouped.set(monthKey, monthExpenses)
  }
  
  return grouped
}

/**
 * Calculate total for a specific month
 */
export function calculateMonthTotal(
  expenses: FixedExpense[],
  month: Date
): number {
  return expenses
    .filter(expense => 
      expense.isActive && 
      shouldIncludeInMonth(expense, month, new Date())
    )
    .reduce((sum, expense) => sum + Number(expense.amount), 0)
}

/**
 * Get expenses for current month, next month, and month after
 */
export function getUpcomingExpenses(expenses: FixedExpense[]) {
  const now = new Date()
  const currentMonth = startOfMonth(now)
  
  const grouped = groupExpensesByMonth(expenses, currentMonth, 3)
  
  const currentMonthKey = format(currentMonth, 'yyyy-MM')
  const nextMonthKey = format(addMonths(currentMonth, 1), 'yyyy-MM')
  const nextNextMonthKey = format(addMonths(currentMonth, 2), 'yyyy-MM')
  
  return {
    current: {
      month: currentMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
      expenses: grouped.get(currentMonthKey) || [],
      total: calculateMonthTotal(expenses, currentMonth),
    },
    next: {
      month: addMonths(currentMonth, 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
      expenses: grouped.get(nextMonthKey) || [],
      total: calculateMonthTotal(expenses, addMonths(currentMonth, 1)),
    },
    nextNext: {
      month: addMonths(currentMonth, 2).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
      expenses: grouped.get(nextNextMonthKey) || [],
      total: calculateMonthTotal(expenses, addMonths(currentMonth, 2)),
    },
  }
}

/**
 * Get expense categories
 */
export const FIXED_EXPENSE_CATEGORIES = [
  'Podatki',
  'Media',
  'Abonamenty',
  'Ubezpieczenia',
  'Czynsz',
  'Wynagrodzenia',
  'ZUS',
  'Inne',
] as const

export type FixedExpenseCategory = typeof FIXED_EXPENSE_CATEGORIES[number]


