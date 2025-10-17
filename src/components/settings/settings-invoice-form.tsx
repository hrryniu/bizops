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
    preview: 'data:image/svg+xml;utf8,<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="280" fill="%23ffffff"/><rect x="10" y="10" width="180" height="35" fill="%233b82f6"/><text x="100" y="30" font-family="Arial" font-size="12" fill="white" text-anchor="middle" font-weight="bold">FAKTURA VAT</text><text x="15" y="50" font-family="Arial" font-size="7" fill="%23333">FV/2024/001</text><text x="15" y="60" font-family="Arial" font-size="6" fill="%23666">Data: 15.01.2024</text><text x="15" y="80" font-family="Arial" font-size="7" fill="%23333" font-weight="bold">Sprzedawca:</text><text x="15" y="90" font-family="Arial" font-size="6" fill="%23666">ABC Services Sp. z o.o.</text><text x="15" y="98" font-family="Arial" font-size="6" fill="%23666">ul. Kwiatowa 12</text><text x="15" y="106" font-family="Arial" font-size="6" fill="%23666">00-001 Warszawa</text><text x="110" y="80" font-family="Arial" font-size="7" fill="%23333" font-weight="bold">Nabywca:</text><text x="110" y="90" font-family="Arial" font-size="6" fill="%23666">XYZ Company Ltd.</text><text x="110" y="98" font-family="Arial" font-size="6" fill="%23666">ul. Słoneczna 45</text><text x="110" y="106" font-family="Arial" font-size="6" fill="%23666">02-222 Kraków</text><rect x="10" y="115" width="180" height="12" fill="%23f3f4f6"/><text x="15" y="123" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Nazwa usługi</text><text x="130" y="123" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Cena netto</text><text x="170" y="123" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">VAT</text><rect x="10" y="127" width="180" height="0.5" fill="%23d1d5db"/><text x="15" y="137" font-family="Arial" font-size="6" fill="%23555">Usługi konsultingowe</text><text x="130" y="137" font-family="Arial" font-size="6" fill="%23555">5 000,00</text><text x="170" y="137" font-family="Arial" font-size="6" fill="%23555">23%</text><text x="15" y="148" font-family="Arial" font-size="6" fill="%23555">Hosting i domena</text><text x="130" y="148" font-family="Arial" font-size="6" fill="%23555">450,00</text><text x="170" y="148" font-family="Arial" font-size="6" fill="%23555">23%</text><text x="15" y="159" font-family="Arial" font-size="6" fill="%23555">Wsparcie techniczne</text><text x="130" y="159" font-family="Arial" font-size="6" fill="%23555">1 200,00</text><text x="170" y="159" font-family="Arial" font-size="6" fill="%23555">23%</text><rect x="10" y="165" width="180" height="0.5" fill="%23d1d5db"/><rect x="10" y="175" width="180" height="35" fill="%233b82f6"/><text x="15" y="185" font-family="Arial" font-size="7" fill="white" font-weight="bold">Razem netto:</text><text x="170" y="185" font-family="Arial" font-size="7" fill="white" text-anchor="end" font-weight="bold">6 650,00 PLN</text><text x="15" y="195" font-family="Arial" font-size="7" fill="white" font-weight="bold">VAT 23%:</text><text x="170" y="195" font-family="Arial" font-size="7" fill="white" text-anchor="end" font-weight="bold">1 529,50 PLN</text><text x="15" y="205" font-family="Arial" font-size="8" fill="white" font-weight="bold">SUMA:</text><text x="170" y="205" font-family="Arial" font-size="8" fill="white" text-anchor="end" font-weight="bold">8 179,50 PLN</text><text x="15" y="225" font-family="Arial" font-size="5" fill="%23666">Termin płatności: 30.01.2024</text><text x="15" y="233" font-family="Arial" font-size="5" fill="%23666">Nr konta: 12 3456 7890 1234 5678 9012 3456</text></svg>',
  },
  {
    id: 'modern',
    name: 'Nowoczesny',
    description: 'Minimalistyczny design z czystymi liniami',
    preview: 'data:image/svg+xml;utf8,<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="280" fill="%23ffffff"/><text x="20" y="25" font-family="Arial" font-size="14" fill="%23000" font-weight="bold">FAKTURA</text><text x="20" y="38" font-family="Arial" font-size="7" fill="%23666">NR 2024/01/042</text><text x="180" y="25" font-family="Arial" font-size="7" fill="%23666" text-anchor="end">15.01.2024</text><text x="20" y="55" font-family="Arial" font-size="6" fill="%23999">WYSTAWCA</text><text x="20" y="65" font-family="Arial" font-size="7" fill="%23333">TechSolutions Sp. z o.o.</text><text x="20" y="73" font-family="Arial" font-size="6" fill="%23666">ul. Nowoczesna 88</text><text x="20" y="81" font-family="Arial" font-size="6" fill="%23666">NIP: 1234567890</text><text x="110" y="55" font-family="Arial" font-size="6" fill="%23999">ODBIORCA</text><text x="110" y="65" font-family="Arial" font-size="7" fill="%23333">Digital Agency</text><text x="110" y="73" font-family="Arial" font-size="6" fill="%23666">ul. Biznesowa 21</text><text x="110" y="81" font-family="Arial" font-size="6" fill="%23666">NIP: 9876543210</text><line x1="20" y1="92" x2="180" y2="92" stroke="%23e5e7eb" stroke-width="1"/><text x="20" y="105" font-family="Arial" font-size="6" fill="%23999" font-weight="bold">POZYCJA</text><text x="130" y="105" font-family="Arial" font-size="6" fill="%23999" font-weight="bold" text-anchor="end">NETTO</text><text x="165" y="105" font-family="Arial" font-size="6" fill="%23999" font-weight="bold" text-anchor="end">VAT</text><text x="180" y="105" font-family="Arial" font-size="6" fill="%23999" font-weight="bold" text-anchor="end">BRUTTO</text><rect x="20" y="110" width="160" height="10" fill="%23f9fafb"/><text x="22" y="117" font-family="Arial" font-size="6" fill="%23333">Projekt strony internetowej</text><text x="130" y="117" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">8 000</text><text x="165" y="117" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">1 840</text><text x="180" y="117" font-family="Arial" font-size="6" fill="%23333" text-anchor="end" font-weight="bold">9 840</text><rect x="20" y="120" width="160" height="10" fill="%23ffffff"/><text x="22" y="127" font-family="Arial" font-size="6" fill="%23333">Optymalizacja SEO</text><text x="130" y="127" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">2 500</text><text x="165" y="127" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">575</text><text x="180" y="127" font-family="Arial" font-size="6" fill="%23333" text-anchor="end" font-weight="bold">3 075</text><rect x="20" y="130" width="160" height="10" fill="%23f9fafb"/><text x="22" y="137" font-family="Arial" font-size="6" fill="%23333">Copywriting (10 stron)</text><text x="130" y="137" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">1 500</text><text x="165" y="137" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">345</text><text x="180" y="137" font-family="Arial" font-size="6" fill="%23333" text-anchor="end" font-weight="bold">1 845</text><line x1="20" y1="150" x2="180" y2="150" stroke="%23e5e7eb" stroke-width="1"/><text x="100" y="165" font-family="Arial" font-size="7" fill="%23333" font-weight="bold">SUMA KOŃCOWA:</text><text x="180" y="165" font-family="Arial" font-size="10" fill="%23000" text-anchor="end" font-weight="bold">14 760 PLN</text><text x="20" y="185" font-family="Arial" font-size="5" fill="%23999">Zapłać do: 29.01.2024</text><text x="20" y="193" font-family="Arial" font-size="5" fill="%23999">Forma płatności: Przelew</text></svg>',
  },
  {
    id: 'minimal',
    name: 'Minimalny',
    description: 'Prosty układ z podstawowymi informacjami',
    preview: 'data:image/svg+xml;utf8,<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="280" fill="%23ffffff"/><text x="30" y="30" font-family="Arial" font-size="10" fill="%23333" font-weight="bold">Faktura 001/2024</text><text x="30" y="45" font-family="Arial" font-size="6" fill="%23666">Data wystawienia: 15 stycznia 2024</text><text x="150" y="45" font-family="Arial" font-size="6" fill="%23666">Termin: 30 dni</text><text x="30" y="65" font-family="Arial" font-size="6" fill="%23333" font-weight="bold">Od:</text><text x="30" y="73" font-family="Arial" font-size="6" fill="%23666">MinimalCo</text><text x="30" y="81" font-family="Arial" font-size="6" fill="%23666">ul. Prosta 5, Warszawa</text><text x="110" y="65" font-family="Arial" font-size="6" fill="%23333" font-weight="bold">Dla:</text><text x="110" y="73" font-family="Arial" font-size="6" fill="%23666">Klient SA</text><text x="110" y="81" font-family="Arial" font-size="6" fill="%23666">ul. Długa 10, Gdańsk</text><rect x="30" y="95" width="140" height="8" fill="%23f3f4f6"/><text x="32" y="101" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Opis</text><text x="120" y="101" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Kwota</text><text x="32" y="111" font-family="Arial" font-size="6" fill="%23555">Usługi programistyczne - Styczeń 2024</text><text x="155" y="111" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">6 150,00</text><text x="32" y="121" font-family="Arial" font-size="6" fill="%23555">Konsultacje techniczne (5h)</text><text x="155" y="121" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">750,00</text><text x="32" y="131" font-family="Arial" font-size="6" fill="%23555">Dokumentacja projektu</text><text x="155" y="131" font-family="Arial" font-size="6" fill="%23555" text-anchor="end">450,00</text><line x1="30" y1="138" x2="170" y2="138" stroke="%23d1d5db" stroke-width="0.5"/><text x="32" y="150" font-family="Arial" font-size="6" fill="%23333">Suma netto:</text><text x="155" y="150" font-family="Arial" font-size="6" fill="%23333" text-anchor="end">7 350,00</text><text x="32" y="160" font-family="Arial" font-size="6" fill="%23333">VAT 23%:</text><text x="155" y="160" font-family="Arial" font-size="6" fill="%23333" text-anchor="end">1 690,50</text><text x="32" y="173" font-family="Arial" font-size="8" fill="%23000" font-weight="bold">Do zapłaty:</text><text x="155" y="173" font-family="Arial" font-size="8" fill="%23000" text-anchor="end" font-weight="bold">9 040,50 PLN</text><text x="30" y="195" font-family="Arial" font-size="5" fill="%23999">Numer konta: PL 12 3456 7890 1234 5678 9012 3456</text></svg>',
  },
  {
    id: 'professional',
    name: 'Profesjonalny',
    description: 'Elegancki szablon dla biznesu',
    preview: 'data:image/svg+xml;utf8,<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad" x1="0%%" y1="0%%" x2="0%%" y2="100%%"><stop offset="0%%" style="stop-color:%232c3e50;stop-opacity:1"/><stop offset="100%%" style="stop-color:%2334495e;stop-opacity:1"/></linearGradient></defs><rect width="200" height="280" fill="%23ffffff"/><rect width="200" height="45" fill="url(%23grad)"/><text x="15" y="20" font-family="Arial" font-size="11" fill="%23ffffff" font-weight="bold">ELITE BUSINESS</text><text x="15" y="30" font-family="Arial" font-size="6" fill="%23ecf0f1">Premium Solutions</text><text x="185" y="25" font-family="Arial" font-size="8" fill="%23ecf0f1" text-anchor="end" font-weight="bold">INVOICE</text><text x="185" y="35" font-family="Arial" font-size="6" fill="%23bdc3c7" text-anchor="end">INV-2024-0156</text><rect x="15" y="55" width="85" height="35" fill="%23f8f9fa" stroke="%23dee2e6" stroke-width="0.5"/><text x="18" y="62" font-family="Arial" font-size="5" fill="%23495057" font-weight="bold">WYSTAWCA</text><text x="18" y="70" font-family="Arial" font-size="6" fill="%23212529">Elite Business Sp. z o.o.</text><text x="18" y="77" font-family="Arial" font-size="5" fill="%23495057">ul. Prestiżowa 1</text><text x="18" y="83" font-family="Arial" font-size="5" fill="%23495057">NIP: 5432109876</text><rect x="105" y="55" width="80" height="35" fill="%23f8f9fa" stroke="%23dee2e6" stroke-width="0.5"/><text x="108" y="62" font-family="Arial" font-size="5" fill="%23495057" font-weight="bold">KLIENT</text><text x="108" y="70" font-family="Arial" font-size="6" fill="%23212529">Corporate Ltd.</text><text x="108" y="77" font-family="Arial" font-size="5" fill="%23495057">ul. Biznesowa 50</text><text x="108" y="83" font-family="Arial" font-size="5" fill="%23495057">NIP: 0987654321</text><text x="15" y="100" font-family="Arial" font-size="5" fill="%23495057">Data: 15.01.2024</text><text x="185" y="100" font-family="Arial" font-size="5" fill="%23495057" text-anchor="end">Termin: 29.01.2024</text><rect x="15" y="107" width="170" height="12" fill="%232c3e50"/><text x="18" y="115" font-family="Arial" font-size="5" fill="%23ffffff" font-weight="bold">NAZWA USŁUGI</text><text x="110" y="115" font-family="Arial" font-size="5" fill="%23ffffff" font-weight="bold" text-anchor="end">NETTO</text><text x="140" y="115" font-family="Arial" font-size="5" fill="%23ffffff" font-weight="bold" text-anchor="end">VAT</text><text x="182" y="115" font-family="Arial" font-size="5" fill="%23ffffff" font-weight="bold" text-anchor="end">BRUTTO</text><rect x="15" y="119" width="170" height="10" fill="%23f8f9fa"/><text x="18" y="126" font-family="Arial" font-size="6" fill="%23212529">Strategia marketingowa Q1</text><text x="110" y="126" font-family="Arial" font-size="6" fill="%23495057" text-anchor="end">15 000</text><text x="140" y="126" font-family="Arial" font-size="6" fill="%23495057" text-anchor="end">3 450</text><text x="182" y="126" font-family="Arial" font-size="6" fill="%23212529" text-anchor="end">18 450</text><rect x="15" y="129" width="170" height="10" fill="%23ffffff"/><text x="18" y="136" font-family="Arial" font-size="6" fill="%23212529">Kampania reklamowa</text><text x="110" y="136" font-family="Arial" font-size="6" fill="%23495057" text-anchor="end">8 500</text><text x="140" y="136" font-family="Arial" font-size="6" fill="%23495057" text-anchor="end">1 955</text><text x="182" y="136" font-family="Arial" font-size="6" fill="%23212529" text-anchor="end">10 455</text><rect x="15" y="139" width="170" height="10" fill="%23f8f9fa"/><text x="18" y="146" font-family="Arial" font-size="6" fill="%23212529">Analiza konkurencji</text><text x="110" y="146" font-family="Arial" font-size="6" fill="%23495057" text-anchor="end">4 200</text><text x="140" y="146" font-family="Arial" font-size="6" fill="%23495057" text-anchor="end">966</text><text x="182" y="146" font-family="Arial" font-size="6" fill="%23212529" text-anchor="end">5 166</text><rect x="15" y="149" width="170" height="10" fill="%23ffffff"/><text x="18" y="156" font-family="Arial" font-size="6" fill="%23212529">Raport miesięczny</text><text x="110" y="156" font-family="Arial" font-size="6" fill="%23495057" text-anchor="end">2 800</text><text x="140" y="156" font-family="Arial" font-size="6" fill="%23495057" text-anchor="end">644</text><text x="182" y="156" font-family="Arial" font-size="6" fill="%23212529" text-anchor="end">3 444</text><rect x="15" y="170" width="170" height="25" fill="%232c3e50"/><text x="18" y="179" font-family="Arial" font-size="6" fill="%23ecf0f1">Razem netto:</text><text x="182" y="179" font-family="Arial" font-size="6" fill="%23ffffff" text-anchor="end">30 500,00 PLN</text><text x="18" y="187" font-family="Arial" font-size="6" fill="%23ecf0f1">VAT 23%%:</text><text x="182" y="187" font-family="Arial" font-size="6" fill="%23ffffff" text-anchor="end">7 015,00 PLN</text><text x="18" y="192" font-family="Arial" font-size="1" fill="%23bdc3c7">─────────────────────────────</text><text x="18" y="195" font-family="Arial" font-size="8" fill="%23ffffff" font-weight="bold">SUMA:</text><text x="182" y="195" font-family="Arial" font-size="9" fill="%23ffffff" text-anchor="end" font-weight="bold">37 515,00 PLN</text><text x="15" y="210" font-family="Arial" font-size="5" fill="%23495057">Forma płatności: Przelew bankowy</text><text x="15" y="218" font-family="Arial" font-size="5" fill="%23495057">Bank: PKO BP SA</text><text x="15" y="226" font-family="Arial" font-size="5" fill="%23495057">Nr konta: 98 7654 3210 9876 5432 1098 7654</text></svg>',
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

