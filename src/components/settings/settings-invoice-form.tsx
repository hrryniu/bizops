'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Save, Image as ImageIcon } from 'lucide-react'

interface Settings {
  id?: string
  showLogoOnInvoices?: boolean
}

interface SettingsInvoiceFormProps {
  settings?: Settings | null
}

export function SettingsInvoiceForm({ settings }: SettingsInvoiceFormProps) {
  const [showLogoOnInvoices, setShowLogoOnInvoices] = useState(settings?.showLogoOnInvoices ?? true)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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
          type: 'invoice',
          data: {
            showLogoOnInvoices,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Błąd podczas zapisywania ustawień')
      }

      toast({
        title: 'Ustawienia zapisane',
        description: 'Ustawienia faktur zostały pomyślnie zaktualizowane.',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {/* Logo on Invoices */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showLogoOnInvoices"
              checked={showLogoOnInvoices}
              onChange={(e) => setShowLogoOnInvoices(e.target.checked)}
              className="rounded border-gray-300 h-4 w-4"
            />
            <Label htmlFor="showLogoOnInvoices" className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Dodaj logo do wystawianych faktur
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {showLogoOnInvoices 
              ? "Logo firmy będzie wyświetlane na wszystkich generowanych fakturach PDF"
              : "Faktury będą generowane bez logo firmy"
            }
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
        <Save className="h-4 w-4" />
        {isLoading ? 'Zapisywanie...' : 'Zapisz ustawienia'}
      </Button>
    </form>
  )
}

