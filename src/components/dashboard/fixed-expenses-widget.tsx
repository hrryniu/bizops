/**
 * 💰 Fixed Expenses Widget
 * 
 * Dashboard widget showing upcoming fixed expenses
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { FixedExpensesModal } from './fixed-expenses-modal'
import { FixedExpense } from '@prisma/client'

interface FixedExpensesWidgetProps {
  expenses: FixedExpense[]
}

export function FixedExpensesWidget({ expenses }: FixedExpensesWidgetProps) {
  const [showModal, setShowModal] = useState(false)

  // Calculate expenses for current and next 2 months
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Helper to check if expense applies to a given month
  const appliesToMonth = (expense: FixedExpense, monthOffset: number) => {
    if (!expense.isActive) return false
    
    const targetMonth = (currentMonth + monthOffset) % 12
    const monthsSinceStart = monthOffset
    
    switch (expense.recurrence) {
      case 'monthly':
        return true
      case 'quarterly':
        return monthsSinceStart % 3 === 0
      case 'yearly':
        return monthsSinceStart % 12 === 0
      default:
        return false
    }
  }

  // Get expenses for each month
  const currentMonthExpenses = expenses.filter(e => appliesToMonth(e, 0))
  const nextMonthExpenses = expenses.filter(e => appliesToMonth(e, 1))
  const nextNextMonthExpenses = expenses.filter(e => appliesToMonth(e, 2))

  // Calculate totals
  const currentTotal = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const nextTotal = nextMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const nextNextTotal = nextNextMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Format month names
  const getMonthName = (offset: number) => {
    const date = new Date(currentYear, currentMonth + offset, 1)
    return date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
  }

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowModal(true)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stałe wydatki</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Current Month - Bold */}
            <div className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold capitalize">{getMonthName(0)}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentMonthExpenses.length} {currentMonthExpenses.length === 1 ? 'wydatek' : 'wydatków'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(currentTotal)}</div>
                </div>
              </div>
            </div>

            {/* Next Months - Smaller text */}
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-between">
                <span className="capitalize">{getMonthName(1)}</span>
                <span className="font-medium">{formatCurrency(nextTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="capitalize">{getMonthName(2)}</span>
                <span className="font-medium">{formatCurrency(nextNextTotal)}</span>
              </div>
            </div>

            {/* Click indicator */}
            <div className="pt-2 flex items-center justify-end text-xs text-primary">
              <span>Zobacz szczegóły</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal with full details */}
      {showModal && (
        <FixedExpensesModal
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}









