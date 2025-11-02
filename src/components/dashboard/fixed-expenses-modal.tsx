/**
 * 💰 Fixed Expenses Modal
 * 
 * Full-screen modal with detailed view, editing, and management of fixed expenses
 */

'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  MoreVertical,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/utils'
import { useFixedExpenses } from '@/hooks/useFixedExpenses'
import { FixedExpenseForm } from './fixed-expense-form'
import { FixedExpense } from '@prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FixedExpensesModalProps {
  open: boolean
  onClose: () => void
}

export function FixedExpensesModal({ open, onClose }: FixedExpensesModalProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(0) // 0 = current, 1 = next, 2 = next+1
  
  const { expenses, loading, createExpense, updateExpense, deleteExpense, toggleActive } = useFixedExpenses()

  // Calculate expenses for current and next 2 months
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const appliesToMonth = (expense: FixedExpense, monthOffset: number) => {
    if (!expense.isActive) return false
    
    switch (expense.recurrence) {
      case 'monthly':
        return true
      case 'quarterly':
        return monthOffset % 3 === 0
      case 'yearly':
        return monthOffset % 12 === 0
      default:
        return false
    }
  }

  const getMonthData = (monthOffset: number) => {
    const date = new Date(currentYear, currentMonth + monthOffset, 1)
    const monthName = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
    const monthExpenses = expenses
      .filter(e => appliesToMonth(e, monthOffset))
      .sort((a, b) => a.dueDay - b.dueDay)
    const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    
    return { monthName, monthExpenses, total }
  }

  const currentMonthData = getMonthData(0)
  const nextMonthData = getMonthData(1)
  const nextNextMonthData = getMonthData(2)

  const handleAddNew = () => {
    setEditingExpense(null)
    setShowForm(true)
  }

  const handleEdit = (expense: FixedExpense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleDelete = async (expense: FixedExpense) => {
    if (!confirm(`Czy na pewno chcesz usunąć wydatek "${expense.name}"?`)) {
      return
    }
    await deleteExpense(expense.id)
  }

  const handleToggleActive = async (expense: FixedExpense) => {
    await toggleActive(expense.id, !expense.isActive)
  }

  const handleSubmit = async (data: any) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data)
    } else {
      await createExpense(data)
    }
    setShowForm(false)
    setEditingExpense(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  // Category colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Podatki': 'bg-red-100 text-red-800',
      'Media': 'bg-blue-100 text-blue-800',
      'Abonamenty': 'bg-purple-100 text-purple-800',
      'Ubezpieczenia': 'bg-green-100 text-green-800',
      'Czynsz': 'bg-yellow-100 text-yellow-800',
      'Wynagrodzenia': 'bg-pink-100 text-pink-800',
      'ZUS': 'bg-orange-100 text-orange-800',
      'Inne': 'bg-gray-100 text-gray-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getRecurrenceLabel = (recurrence: string) => {
    const labels: Record<string, string> = {
      monthly: 'Miesięcznie',
      quarterly: 'Kwartalnie',
      yearly: 'Rocznie',
    }
    return labels[recurrence] || recurrence
  }

  const renderExpenseList = (monthExpenses: FixedExpense[], monthName: string, total: number) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        <div className="text-2xl font-bold">{formatCurrency(total)}</div>
      </div>

      {monthExpenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Brak wydatków w tym miesiącu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {monthExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{expense.name}</h4>
                  <Badge variant="outline" className={getCategoryColor(expense.category)}>
                    {expense.category}
                  </Badge>
                  {expense.syncWithCalendar && (
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>Dzień: {expense.dueDay}</span>
                  <span>•</span>
                  <span>{getRecurrenceLabel(expense.recurrence)}</span>
                  {expense.notes && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-xs">{expense.notes}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(expense)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(expense)}>
                      {expense.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(expense)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Stałe wydatki</DialogTitle>
            {!showForm && (
              <Button onClick={handleAddNew} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Dodaj nowy
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="mt-4">
          {showForm ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {editingExpense ? 'Edytuj wydatek' : 'Nowy wydatek'}
              </h3>
              <FixedExpenseForm
                expense={editingExpense}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="current">
                  Bieżący miesiąc
                </TabsTrigger>
                <TabsTrigger value="next">
                  Następny miesiąc
                </TabsTrigger>
                <TabsTrigger value="nextnext">
                  Za 2 miesiące
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="current" className="mt-6">
                {renderExpenseList(
                  currentMonthData.monthExpenses,
                  currentMonthData.monthName,
                  currentMonthData.total
                )}
              </TabsContent>
              
              <TabsContent value="next" className="mt-6">
                {renderExpenseList(
                  nextMonthData.monthExpenses,
                  nextMonthData.monthName,
                  nextMonthData.total
                )}
              </TabsContent>
              
              <TabsContent value="nextnext" className="mt-6">
                {renderExpenseList(
                  nextNextMonthData.monthExpenses,
                  nextNextMonthData.monthName,
                  nextNextMonthData.total
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Summary footer */}
          {!showForm && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Bieżący miesiąc</p>
                  <p className="text-xl font-bold">{formatCurrency(currentMonthData.total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Następny miesiąc</p>
                  <p className="text-xl font-bold">{formatCurrency(nextMonthData.total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Za 2 miesiące</p>
                  <p className="text-xl font-bold">{formatCurrency(nextNextMonthData.total)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}









