/**
 * 💰 useFixedExpenses Hook
 * 
 * Custom hook for managing fixed expenses with caching and optimistic updates
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { FixedExpense } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'

interface UseFixedExpensesOptions {
  includeInactive?: boolean
  autoRefresh?: boolean
}

export function useFixedExpenses(options: UseFixedExpensesOptions = {}) {
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch all fixed expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.includeInactive) {
        params.append('includeInactive', 'true')
      }

      const response = await fetch(`/api/fixed-expenses?${params}`)
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać stałych wydatków')
      }

      const data = await response.json()
      setExpenses(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd'
      setError(message)
      toast({
        title: 'Błąd',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [options.includeInactive, toast])

  // Create new fixed expense
  const createExpense = useCallback(async (data: Omit<FixedExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'calendarEventId'>) => {
    try {
      const response = await fetch('/api/fixed-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Nie udało się utworzyć wydatku')
      }

      const newExpense = await response.json()
      
      // Optimistic update
      setExpenses(prev => [...prev, newExpense])
      
      toast({
        title: 'Sukces',
        description: 'Stały wydatek został dodany',
      })

      return newExpense
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd'
      toast({
        title: 'Błąd',
        description: message,
        variant: 'destructive',
      })
      throw err
    }
  }, [toast])

  // Update existing fixed expense
  const updateExpense = useCallback(async (id: string, data: Partial<FixedExpense>) => {
    try {
      const response = await fetch(`/api/fixed-expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Nie udało się zaktualizować wydatku')
      }

      const updatedExpense = await response.json()
      
      // Optimistic update
      setExpenses(prev => 
        prev.map(exp => exp.id === id ? updatedExpense : exp)
      )
      
      toast({
        title: 'Sukces',
        description: 'Stały wydatek został zaktualizowany',
      })

      return updatedExpense
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd'
      toast({
        title: 'Błąd',
        description: message,
        variant: 'destructive',
      })
      throw err
    }
  }, [toast])

  // Delete fixed expense
  const deleteExpense = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/fixed-expenses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Nie udało się usunąć wydatku')
      }

      // Optimistic update
      setExpenses(prev => prev.filter(exp => exp.id !== id))
      
      toast({
        title: 'Sukces',
        description: 'Stały wydatek został usunięty',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd'
      toast({
        title: 'Błąd',
        description: message,
        variant: 'destructive',
      })
      throw err
    }
  }, [toast])

  // Toggle active status
  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    return updateExpense(id, { isActive })
  }, [updateExpense])

  // Initial load
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Auto refresh (optional)
  useEffect(() => {
    if (!options.autoRefresh) return

    const interval = setInterval(() => {
      fetchExpenses()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [options.autoRefresh, fetchExpenses])

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    toggleActive,
  }
}










