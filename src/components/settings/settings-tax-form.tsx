'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Save, Plus, X, Receipt, Calendar, FolderOpen } from 'lucide-react'

interface Settings {
  id?: string
  taxFormLabel?: string | null
  isVatPayer?: boolean
  defaultVatRates?: string
  calendarTemplates?: string
  expenseCategories?: string
}

interface SettingsTaxFormProps {
  settings?: Settings | null
}

interface VatRate {
  id: string
  label: string
  value: string
}

interface CalendarTemplate {
  id: string
  key: string
  title: string
  description: string
  daysOffset: number
}

export function SettingsTaxForm({ settings }: SettingsTaxFormProps) {
  const [taxFormLabel, setTaxFormLabel] = useState(settings?.taxFormLabel || '')
  const [isVatPayer, setIsVatPayer] = useState(settings?.isVatPayer ?? true)
  const [vatRates, setVatRates] = useState<VatRate[]>([])
  const [calendarTemplates, setCalendarTemplates] = useState<CalendarTemplate[]>([])
  const [expenseCategories, setExpenseCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Parse JSON strings on mount
  useEffect(() => {
    try {
      const defaultVatRates = settings?.defaultVatRates 
        ? JSON.parse(settings.defaultVatRates)
        : ['23', '8', '5', '0', 'zw']
      
      const vatRatesData = defaultVatRates.map((rate: string, index: number) => ({
        id: `vat-${index}`,
        label: rate === 'zw' ? 'Zwolniony' : `${rate}%`,
        value: rate,
      }))
      setVatRates(vatRatesData)

      const templates = settings?.calendarTemplates 
        ? JSON.parse(settings.calendarTemplates)
        : [
            { id: 'template-1', key: 'VAT_JPK', title: 'JPK_VAT', description: 'Złożenie JPK_VAT', daysOffset: 25 },
            { id: 'template-2', key: 'PIT_ANNUAL', title: 'PIT roczny', description: 'Rozliczenie roczne PIT', daysOffset: 365 },
            { id: 'template-3', key: 'ZUS', title: 'ZUS', description: 'Składki ZUS', daysOffset: 15 },
          ]
      setCalendarTemplates(templates)

      const categories = settings?.expenseCategories 
        ? JSON.parse(settings.expenseCategories)
        : ['Biuro', 'Transport', 'Wyposażenie', 'Marketing', 'Usługi', 'Inne']
      setExpenseCategories(categories)
    } catch (error) {
      console.error('Error parsing settings:', error)
    }
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'tax',
          data: {
            taxFormLabel,
            isVatPayer,
            defaultVatRates: JSON.stringify(vatRates.map(r => r.value)),
            calendarTemplates: JSON.stringify(calendarTemplates),
            expenseCategories: JSON.stringify(expenseCategories),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Błąd podczas zapisywania ustawień')
      }

      toast({
        title: 'Ustawienia zapisane',
        description: 'Konfiguracja podatków została pomyślnie zaktualizowana.',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się zapisać ustawień. Spróbuj ponownie.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addVatRate = () => {
    const newRate: VatRate = {
      id: `vat-${Date.now()}`,
      label: 'Nowa stawka',
      value: '0',
    }
    setVatRates([...vatRates, newRate])
  }

  const removeVatRate = (id: string) => {
    setVatRates(vatRates.filter(rate => rate.id !== id))
  }

  const updateVatRate = (id: string, field: keyof VatRate, value: string) => {
    setVatRates(vatRates.map(rate => 
      rate.id === id ? { ...rate, [field]: value } : rate
    ))
  }

  const addCalendarTemplate = () => {
    const newTemplate: CalendarTemplate = {
      id: `template-${Date.now()}`,
      key: 'NEW_TEMPLATE',
      title: 'Nowy szablon',
      description: 'Opis nowego szablonu',
      daysOffset: 30,
    }
    setCalendarTemplates([...calendarTemplates, newTemplate])
  }

  const removeCalendarTemplate = (id: string) => {
    setCalendarTemplates(calendarTemplates.filter(template => template.id !== id))
  }

  const updateCalendarTemplate = (id: string, field: keyof CalendarTemplate, value: string | number) => {
    setCalendarTemplates(calendarTemplates.map(template => 
      template.id === id ? { ...template, [field]: value } : template
    ))
  }

  const addExpenseCategory = () => {
    if (newCategory.trim() && !expenseCategories.includes(newCategory.trim())) {
      setExpenseCategories([...expenseCategories, newCategory.trim()])
      setNewCategory('')
    }
  }

  const removeExpenseCategory = (category: string) => {
    setExpenseCategories(expenseCategories.filter(c => c !== category))
  }

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addExpenseCategory()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {/* VAT Payer Status */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isVatPayer"
              checked={isVatPayer}
              onChange={(e) => setIsVatPayer(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isVatPayer" className="text-sm font-medium">
              Firma jest płatnikiem VAT
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {isVatPayer 
              ? "Firma jest zarejestrowana jako płatnik VAT. Dostępne są wszystkie funkcjonalności podatkowe."
              : "Firma nie jest płatnikiem VAT. Faktury będą generowane ze stawką ZW (zwolniony) i odpowiednią notatką prawną."
            }
          </p>
        </div>

        {/* Tax Form Label */}
        <div className="space-y-2">
          <Label htmlFor="taxFormLabel" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Etykieta formy podatkowej
          </Label>
          <Input
            id="taxFormLabel"
            value={taxFormLabel}
            onChange={(e) => setTaxFormLabel(e.target.value)}
            placeholder="np. liniowy 19%"
          />
          <p className="text-xs text-muted-foreground">
            Opis formy podatkowej, która będzie wyświetlana na fakturach
          </p>
        </div>

        {/* VAT Rates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Domyślne stawki VAT</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVatRate}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Dodaj stawkę
            </Button>
          </div>
          
          <div className="space-y-2">
            {vatRates.map((rate) => (
              <div key={rate.id} className="flex items-center gap-2">
                <Input
                  value={rate.label}
                  onChange={(e) => updateVatRate(rate.id, 'label', e.target.value)}
                  placeholder="Etykieta (np. 23%)"
                  className="flex-1"
                />
                <Input
                  value={rate.value}
                  onChange={(e) => updateVatRate(rate.id, 'value', e.target.value)}
                  placeholder="Wartość (np. 23)"
                  className="w-20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeVatRate(rate.id)}
                  className="px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Kategorie kosztów
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Zdefiniuj kategorie, które będą dostępne przy dodawaniu kosztów
          </p>
          
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={handleCategoryKeyDown}
              placeholder="Nazwa nowej kategorii (np. Telefon)"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addExpenseCategory}
              disabled={!newCategory.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Dodaj
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {expenseCategories.map((category) => (
              <Badge key={category} variant="secondary" className="text-sm py-1 px-3 flex items-center gap-2">
                {category}
                <button
                  type="button"
                  onClick={() => removeExpenseCategory(category)}
                  className="hover:text-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Calendar Templates - only show for VAT payers */}
        {isVatPayer && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Szablony kalendarza podatkowego
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCalendarTemplate}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Dodaj szablon
              </Button>
            </div>
            
            <div className="space-y-3">
              {calendarTemplates.map((template) => (
                <div key={template.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={template.title}
                      onChange={(e) => updateCalendarTemplate(template.id, 'title', e.target.value)}
                      placeholder="Tytuł (np. JPK_VAT)"
                      className="flex-1"
                    />
                    <Input
                      value={template.daysOffset}
                      onChange={(e) => updateCalendarTemplate(template.id, 'daysOffset', parseInt(e.target.value) || 0)}
                      placeholder="Dni"
                      type="number"
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCalendarTemplate(template.id)}
                      className="px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    value={template.description}
                    onChange={(e) => updateCalendarTemplate(template.id, 'description', e.target.value)}
                    placeholder="Opis szablonu"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
        <Save className="h-4 w-4" />
        {isLoading ? 'Zapisywanie...' : 'Zapisz ustawienia'}
      </Button>
    </form>
  )
}

