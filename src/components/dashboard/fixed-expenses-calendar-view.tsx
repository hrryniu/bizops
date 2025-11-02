/**
 * 📅 Fixed Expenses Calendar View
 * 
 * Monthly calendar view showing all fixed expenses
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { FixedExpense } from '@prisma/client'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns'

interface FixedExpensesCalendarViewProps {
  expenses: FixedExpense[]
}

export function FixedExpensesCalendarView({ expenses }: FixedExpensesCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get calendar days
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Helper to check if expense applies to current month
  const appliesToCurrentMonth = (expense: FixedExpense) => {
    if (!expense.isActive) return false

    const monthsSinceStart = 
      (currentDate.getFullYear() - new Date().getFullYear()) * 12 +
      (currentDate.getMonth() - new Date().getMonth())

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

  // Get expenses for each day
  const expensesByDay = useMemo(() => {
    const map = new Map<number, FixedExpense[]>()
    
    expenses
      .filter(appliesToCurrentMonth)
      .forEach(expense => {
        const day = expense.dueDay
        if (!map.has(day)) {
          map.set(day, [])
        }
        map.get(day)!.push(expense)
      })
    
    return map
  }, [expenses, currentDate])

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    return expenses
      .filter(appliesToCurrentMonth)
      .reduce((sum, expense) => sum + Number(expense.amount), 0)
  }, [expenses, currentDate])

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Category colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Podatki': 'bg-red-100 text-red-800 border-red-200',
      'Media': 'bg-blue-100 text-blue-800 border-blue-200',
      'Abonamenty': 'bg-purple-100 text-purple-800 border-purple-200',
      'Ubezpieczenia': 'bg-green-100 text-green-800 border-green-200',
      'Czynsz': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Wynagrodzenia': 'bg-pink-100 text-pink-800 border-pink-200',
      'ZUS': 'bg-orange-100 text-orange-800 border-orange-200',
      'Inne': 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Kalendarz stałych wydatków
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Suma na {currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}: {formatCurrency(monthlyTotal)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Dziś
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday headers */}
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for alignment */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dayNumber = day.getDate()
            const dayExpenses = expensesByDay.get(dayNumber) || []
            const dayTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

            return (
              <div
                key={day.toString()}
                className={`
                  aspect-square border rounded-lg p-2 flex flex-col gap-1 overflow-hidden
                  ${isToday ? 'border-primary border-2 bg-primary/5' : 'border-gray-200'}
                  ${dayExpenses.length > 0 ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isToday ? 'text-primary' : ''}`}>
                    {dayNumber}
                  </span>
                  {dayExpenses.length > 0 && (
                    <span className="text-xs font-bold text-gray-700">
                      {dayExpenses.length}
                    </span>
                  )}
                </div>

                {/* Expenses for this day */}
                {dayExpenses.length > 0 && (
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {dayExpenses.slice(0, 3).map((expense) => (
                      <div
                        key={expense.id}
                        className={`text-xs p-1 rounded border ${getCategoryColor(expense.category)}`}
                        title={`${expense.name} - ${formatCurrency(expense.amount)}`}
                      >
                        <div className="font-medium truncate">{expense.name}</div>
                        <div className="text-xs font-bold">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                    ))}
                    {dayExpenses.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayExpenses.length - 3} więcej
                      </div>
                    )}
                  </div>
                )}

                {/* Daily total */}
                {dayTotal > 0 && (
                  <div className="text-xs font-bold text-gray-700 pt-1 border-t">
                    {formatCurrency(dayTotal)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-semibold mb-2">Kategorie:</p>
          <div className="flex flex-wrap gap-2">
            {['Podatki', 'Media', 'Abonamenty', 'Ubezpieczenia', 'Czynsz', 'Wynagrodzenia', 'ZUS', 'Inne'].map(
              (category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className={getCategoryColor(category)}
                >
                  {category}
                </Badge>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


