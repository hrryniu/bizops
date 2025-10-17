'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Save, FileText, Image as ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Settings {
  id?: string
  showLogoOnInvoices?: boolean
  invoiceTemplate?: string
}

interface SettingsInvoiceFormProps {
  settings?: Settings | null
}

const INVOICE_TEMPLATES = [
  {
    id: 'classic',
    name: 'Klasyczny',
    description: 'Tradycyjny układ z wszystkimi informacjami',
    preview: '/templates/classic-preview.png',
  },
  {
    id: 'modern',
    name: 'Nowoczesny',
    description: 'Minimalistyczny design z czystymi liniami',
    preview: '/templates/modern-preview.png',
  },
  {
    id: 'minimal',
    name: 'Minimalny',
    description: 'Prosty układ z podstawowymi informacjami',
    preview: '/templates/minimal-preview.png',
  },
  {
    id: 'professional',
    name: 'Profesjonalny',
    description: 'Elegancki szablon dla biznesu',
    preview: '/templates/professional-preview.png',
  },
]

export function SettingsInvoiceForm({ settings }: SettingsInvoiceFormProps) {
  const [showLogoOnInvoices, setShowLogoOnInvoices] = useState(settings?.showLogoOnInvoices ?? true)
  const [invoiceTemplate, setInvoiceTemplate] = useState(settings?.invoiceTemplate || 'classic')
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
            invoiceTemplate,
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

        {/* Invoice Template */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Szablon faktury
          </Label>
          <p className="text-xs text-muted-foreground">
            Wybierz szablon, który będzie używany do generowania faktur PDF
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {INVOICE_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  invoiceTemplate === template.id
                    ? 'border-2 border-primary shadow-lg'
                    : 'border-2 border-transparent'
                }`}
                onClick={() => setInvoiceTemplate(template.id)}
              >
                <div className="p-4 space-y-3">
                  <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  {invoiceTemplate === template.id && (
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      Wybrany
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
        <Save className="h-4 w-4" />
        {isLoading ? 'Zapisywanie...' : 'Zapisz ustawienia'}
      </Button>
    </form>
  )
}

