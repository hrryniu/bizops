/**
 * 💰 Fixed Expense Form
 * 
 * Form for creating and editing fixed expenses with Zod validation
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { FixedExpense } from '@prisma/client'
import { FIXED_EXPENSE_CATEGORIES } from '@/lib/services/fixed-expenses'

// Validation schema
const fixedExpenseFormSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(100, 'Nazwa może mieć max 100 znaków'),
  amount: z.string().min(1, 'Kwota jest wymagana').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Kwota musi być większa niż 0'
  ),
  dueDay: z.string().min(1, 'Dzień jest wymagany').refine(
    (val) => {
      const num = parseInt(val)
      return !isNaN(num) && num >= 1 && num <= 31
    },
    'Dzień musi być między 1 a 31'
  ),
  category: z.string().min(1, 'Kategoria jest wymagana'),
  recurrence: z.enum(['monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Wybierz cykliczność' })
  }),
  isActive: z.boolean(),
  syncWithCalendar: z.boolean(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof fixedExpenseFormSchema>

interface FixedExpenseFormProps {
  expense?: FixedExpense | null
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function FixedExpenseForm({ expense, onSubmit, onCancel }: FixedExpenseFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(fixedExpenseFormSchema),
    defaultValues: {
      name: expense?.name || '',
      amount: expense?.amount ? String(expense.amount) : '',
      dueDay: expense?.dueDay ? String(expense.dueDay) : '',
      category: expense?.category || '',
      recurrence: expense?.recurrence as 'monthly' | 'quarterly' | 'yearly' || 'monthly',
      isActive: expense?.isActive ?? true,
      syncWithCalendar: expense?.syncWithCalendar ?? false,
      notes: expense?.notes || '',
    },
  })

  const watchCategory = watch('category')
  const watchRecurrence = watch('recurrence')
  const watchIsActive = watch('isActive')
  const watchSyncWithCalendar = watch('syncWithCalendar')

  const handleFormSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      
      // Transform data
      const submitData = {
        name: data.name,
        amount: parseFloat(data.amount),
        dueDay: parseInt(data.dueDay),
        category: data.category,
        recurrence: data.recurrence,
        isActive: data.isActive,
        syncWithCalendar: data.syncWithCalendar,
        notes: data.notes || null,
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <Label htmlFor="name">Nazwa wydatku *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="np. ZUS, PIT, Czynsz, Prąd"
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <Label htmlFor="amount">Kwota (PLN) *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          {...register('amount')}
          placeholder="0.00"
          disabled={loading}
        />
        {errors.amount && (
          <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
        )}
      </div>

      {/* Due Day */}
      <div>
        <Label htmlFor="dueDay">Dzień płatności (1-31) *</Label>
        <Input
          id="dueDay"
          type="number"
          min="1"
          max="31"
          {...register('dueDay')}
          placeholder="np. 10"
          disabled={loading}
        />
        {errors.dueDay && (
          <p className="text-sm text-red-500 mt-1">{errors.dueDay.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Kategoria *</Label>
        <Select
          value={watchCategory}
          onValueChange={(value) => setValue('category', value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz kategorię" />
          </SelectTrigger>
          <SelectContent>
            {FIXED_EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Recurrence */}
      <div>
        <Label htmlFor="recurrence">Cykliczność *</Label>
        <Select
          value={watchRecurrence}
          onValueChange={(value) => setValue('recurrence', value as 'monthly' | 'quarterly' | 'yearly')}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz cykliczność" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Miesięczna</SelectItem>
            <SelectItem value="quarterly">Kwartalna</SelectItem>
            <SelectItem value="yearly">Roczna</SelectItem>
          </SelectContent>
        </Select>
        {errors.recurrence && (
          <p className="text-sm text-red-500 mt-1">{errors.recurrence.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notatki</Label>
        <Input
          id="notes"
          {...register('notes')}
          placeholder="Dodatkowe informacje..."
          disabled={loading}
        />
      </div>

      {/* Active Switch */}
      <div className="flex items-center justify-between">
        <Label htmlFor="isActive" className="cursor-pointer">
          Wydatek aktywny
        </Label>
        <Switch
          id="isActive"
          checked={watchIsActive}
          onCheckedChange={(checked) => setValue('isActive', checked)}
          disabled={loading}
        />
      </div>

      {/* Calendar Sync Switch */}
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="syncWithCalendar" className="cursor-pointer">
            Synchronizuj z kalendarzem
          </Label>
          <p className="text-xs text-muted-foreground">
            Automatycznie dodaj do Google Calendar
          </p>
        </div>
        <Switch
          id="syncWithCalendar"
          checked={watchSyncWithCalendar}
          onCheckedChange={(checked) => setValue('syncWithCalendar', checked)}
          disabled={loading}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Anuluj
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {expense ? 'Zapisz zmiany' : 'Dodaj wydatek'}
        </Button>
      </div>
    </form>
  )
}









