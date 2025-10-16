'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Eye, Paperclip, Edit, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

type Expense = {
  id: string
  date: Date
  category: string | null
  grossAmount: number
  contractor: { name: string } | null
  contractorName: string | null
  attachmentPath: string | null
  notes: string | null
}

export function ExpensesList({ expenses }: { expenses: Expense[] }) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expensesList, setExpensesList] = useState(expenses)

  const filtered = expensesList.filter(
    (exp) =>
      exp.category?.toLowerCase().includes(search.toLowerCase()) ||
      exp.contractor?.name.toLowerCase().includes(search.toLowerCase()) ||
      exp.contractorName?.toLowerCase().includes(search.toLowerCase()) ||
      exp.notes?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten koszt? Ta operacja jest nieodwracalna.')) {
      return
    }

    setDeletingId(expenseId)
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExpensesList(prev => prev.filter(exp => exp.id !== expenseId))
      } else {
        alert('Błąd podczas usuwania kosztu')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Błąd podczas usuwania kosztu')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Szukaj kosztu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Kontrahent</TableHead>
              <TableHead>Wartość brutto</TableHead>
              <TableHead>Notatki</TableHead>
              <TableHead>Załącznik</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Brak kosztów
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>{expense.category || '-'}</TableCell>
                  <TableCell>{expense.contractorName || expense.contractor?.name || '-'}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(expense.grossAmount)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {expense.notes ? (
                      <div className="truncate" title={expense.notes}>
                        {expense.notes}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {expense.attachmentPath && (
                      <Badge variant="outline">
                        <Paperclip className="mr-1 h-3 w-3" />
                        Tak
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/expenses/${expense.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

