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
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIzMCIgZmlsbD0iIzMzNjZjYyIvPjxyZWN0IHg9IjEwIiB5PSI1MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjE1IiBmaWxsPSIjZTBlMGUwIi8+PHJlY3QgeD0iMTAiIHk9IjcwIiB3aWR0aD0iNjAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48cmVjdCB4PSIxMTAiIHk9IjUwIiB3aWR0aD0iODAiIGhlaWdodD0iMTUiIGZpbGw9IiNlMGUwZTAiLz48cmVjdCB4PSIxMTAiIHk9IjcwIiB3aWR0aD0iNjAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48cmVjdCB4PSIxMCIgeT0iMTAwIiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZjVmNWY1Ii8+PHJlY3QgeD0iMTAiIHk9IjEzMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSI4IiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjE0NSIgd2lkdGg9IjE4MCIgaGVpZ2h0PSI4IiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjE2MCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSI4IiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjE3NSIgd2lkdGg9IjE4MCIgaGVpZ2h0PSI4IiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjIwMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzMzNjZjYyIvPjxyZWN0IHg9IjEwIiB5PSIyMzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIxNSIgZmlsbD0iI2UwZTBlMCIvPjwvc3ZnPg==',
  },
  {
    id: 'modern',
    name: 'Nowoczesny',
    description: 'Minimalistyczny design z czystymi liniami',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSIyMCIgeT0iMzUiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjY2NjIi8+PHJlY3QgeD0iMjAiIHk9IjQ1IiB3aWR0aD0iNjAiIGhlaWdodD0iNCIgZmlsbD0iI2NjY2NjYyIvPjxyZWN0IHg9IjIwIiB5PSI4MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxIiBmaWxsPSIjZTBlMGUwIi8+PHJlY3QgeD0iMjAiIHk9IjEwMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI2IiBmaWxsPSIjZjVmNWY1Ii8+PHJlY3QgeD0iMjAiIHk9IjExNSIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI2IiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMjAiIHk9IjEzMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI2IiBmaWxsPSIjZjVmNWY1Ii8+PHJlY3QgeD0iMjAiIHk9IjE0NSIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI2IiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMjAiIHk9IjE4MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxIiBmaWxsPSIjZTBlMGUwIi8+PHJlY3QgeD0iMjAiIHk9IjIwMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjE1IiBmaWxsPSIjMDAwMDAwIi8+PC9zdmc+',
  },
  {
    id: 'minimal',
    name: 'Minimalny',
    description: 'Prosty układ z podstawowymi informacjami',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUiIGZpbGw9IiM2NjY2NjYiLz48cmVjdCB4PSIzMCIgeT0iNDUiIHdpZHRoPSI3MCIgaGVpZ2h0PSIzIiBmaWxsPSIjY2NjY2NjIi8+PHJlY3QgeD0iMTMwIiB5PSI0NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMiIGZpbGw9IiNjY2NjY2MiLz48cmVjdCB4PSIzMCIgeT0iOTAiIHdpZHRoPSIxNDAiIGhlaWdodD0iNSIgZmlsbD0iI2YwZjBmMCIvPjxyZWN0IHg9IjMwIiB5PSIxMDUiIHdpZHRoPSIxNDAiIGhlaWdodD0iNSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjMwIiB5PSIxMjAiIHdpZHRoPSIxNDAiIGhlaWdodD0iNSIgZmlsbD0iI2YwZjBmMCIvPjxyZWN0IHg9IjMwIiB5PSIxMzUiIHdpZHRoPSIxNDAiIGhlaWdodD0iNSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjMwIiB5PSIxODAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI4IiBmaWxsPSIjNjY2NjY2Ii8+PC9zdmc+',
  },
  {
    id: 'professional',
    name: 'Profesjonalny',
    description: 'Elegancki szablon dla biznesu',
    preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMmEyYTJhO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNGE0YTRhO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyODAiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI2dyYWQpIi8+PHJlY3QgeD0iMTUiIHk9IjEwIiB3aWR0aD0iODAiIGhlaWdodD0iOCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjE1IiB5PSIyMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYiIGZpbGw9IiNlZWVlZWUiLz48cmVjdCB4PSIxNSIgeT0iNjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSIxMiIgZmlsbD0iI2YwZjBmMCIvPjxyZWN0IHg9IjExNSIgeT0iNjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSIxMiIgZmlsbD0iI2YwZjBmMCIvPjxyZWN0IHg9IjE1IiB5PSIxMDAiIHdpZHRoPSIxNzAiIGhlaWdodD0iMTUiIGZpbGw9IiMyYTJhMmEiLz48cmVjdCB4PSIxNSIgeT0iMTIwIiB3aWR0aD0iMTcwIiBoZWlnaHQ9IjgiIGZpbGw9IiNmNWY1ZjUiLz48cmVjdCB4PSIxNSIgeT0iMTM1IiB3aWR0aD0iMTcwIiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIxNSIgeT0iMTUwIiB3aWR0aD0iMTcwIiBoZWlnaHQ9IjgiIGZpbGw9IiNmNWY1ZjUiLz48cmVjdCB4PSIxNSIgeT0iMTY1IiB3aWR0aD0iMTcwIiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIxNSIgeT0iMjIwIiB3aWR0aD0iNzAiIGhlaWdodD0iMjAiIGZpbGw9IiMyYTJhMmEiLz48L3N2Zz4=',
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
                  <div className="aspect-[3/4] bg-white dark:bg-muted rounded-lg flex items-center justify-center border overflow-hidden">
                    <img
                      src={template.preview}
                      alt={`Podgląd szablonu ${template.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image not found
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          const icon = document.createElement('div')
                          icon.innerHTML = '<svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
                          parent.appendChild(icon.firstChild!)
                        }
                      }}
                    />
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

