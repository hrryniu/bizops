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
    description: 'Czysty układ inspirowany afaktury.pl',
    preview: 'data:image/svg+xml;utf8,<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="280" fill="%23ffffff"/><text x="20" y="20" font-family="Arial" font-size="8" fill="%2300a86b" font-weight="bold">a</text><text x="30" y="20" font-family="Arial" font-size="8" fill="%23000" font-weight="bold">faktury.pl</text><text x="180" y="20" font-family="Arial" font-size="6" fill="%23666" text-anchor="end">Data wystawienia: 2022-02-21</text><text x="180" y="28" font-family="Arial" font-size="6" fill="%23666" text-anchor="end">Data sprzedaży: 2022-02-21</text><text x="20" y="45" font-family="Arial" font-size="12" fill="%23000" font-weight="bold">Faktura nr: 3/02-2022</text><line x1="20" y1="50" x2="180" y2="50" stroke="%23000" stroke-width="2"/><text x="20" y="65" font-family="Arial" font-size="7" fill="%23000" font-weight="bold">Sprzedawca</text><line x1="20" y1="68" x2="100" y2="68" stroke="%23000" stroke-width="1"/><text x="20" y="75" font-family="Arial" font-size="6" fill="%23333">Nazwa firmy</text><text x="20" y="82" font-family="Arial" font-size="6" fill="%23333">adres ulica</text><text x="20" y="89" font-family="Arial" font-size="6" fill="%23333">00-950 Warszawa</text><text x="20" y="96" font-family="Arial" font-size="6" fill="%23333">NIP: 987987987</text><text x="20" y="103" font-family="Arial" font-size="6" fill="%23333">e-mail: info@egrupa.pl</text><text x="20" y="110" font-family="Arial" font-size="6" fill="%23333">Nr konta - 59 2480 0002 2201 XXXX 6181 XXXX</text><text x="20" y="117" font-family="Arial" font-size="6" fill="%23333">Nr SWIFT/BIC: BPKOPLPW</text><line x1="100" y1="60" x2="100" y2="125" stroke="%23000" stroke-width="1"/><text x="110" y="65" font-family="Arial" font-size="7" fill="%23000" font-weight="bold">Nabywca</text><line x1="110" y1="68" x2="180" y2="68" stroke="%23000" stroke-width="1"/><text x="110" y="75" font-family="Arial" font-size="6" fill="%23333">Kontrahent pojedynczy</text><text x="110" y="82" font-family="Arial" font-size="6" fill="%23333">Markowa 45</text><text x="110" y="89" font-family="Arial" font-size="6" fill="%23333">NIP: 123412344234</text><text x="110" y="96" font-family="Arial" font-size="6" fill="%23333">tel: 34 123412341234</text><text x="110" y="103" font-family="Arial" font-size="6" fill="%23333">e-mail: jan.kowalski@gmail.com</text><rect x="20" y="130" width="160" height="8" fill="%23f3f4f6"/><text x="22" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">lp.</text><text x="35" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Nazwa towaru/usługi</text><text x="100" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Ilość</text><text x="120" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Cena netto</text><text x="140" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">VAT</text><text x="160" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Kwota brutto</text><line x1="20" y1="138" x2="180" y2="138" stroke="%23d1d5db" stroke-width="0.5"/><text x="22" y="147" font-family="Arial" font-size="6" fill="%23555">1</text><text x="35" y="147" font-family="Arial" font-size="6" fill="%23555">Produkt 1</text><text x="100" y="147" font-family="Arial" font-size="6" fill="%23555">1.0</text><text x="120" y="147" font-family="Arial" font-size="6" fill="%23555">100.00</text><text x="140" y="147" font-family="Arial" font-size="6" fill="%23555">23%</text><text x="160" y="147" font-family="Arial" font-size="6" fill="%23555">123.00</text><text x="22" y="157" font-family="Arial" font-size="6" fill="%23555">2</text><text x="35" y="157" font-family="Arial" font-size="6" fill="%23555">Usługa 1</text><text x="100" y="157" font-family="Arial" font-size="6" fill="%23555">1.0</text><text x="120" y="157" font-family="Arial" font-size="6" fill="%23555">333.00</text><text x="140" y="157" font-family="Arial" font-size="6" fill="%23555">23%</text><text x="160" y="157" font-family="Arial" font-size="6" fill="%23555">409.59</text><line x1="20" y1="165" x2="180" y2="165" stroke="%23d1d5db" stroke-width="0.5"/><text x="160" y="175" font-family="Arial" font-size="7" fill="%23333" text-anchor="end">SUMA: 942.18</text><rect x="20" y="180" width="80" height="25" fill="%23f8f9fa" stroke="%23d1d5db" stroke-width="0.5"/><text x="22" y="188" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Stawka VAT</text><text x="22" y="195" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Netto</text><text x="22" y="202" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">VAT</text><text x="22" y="209" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Brutto</text><text x="50" y="188" font-family="Arial" font-size="5" fill="%23555">23%</text><text x="50" y="195" font-family="Arial" font-size="5" fill="%23555">766.00</text><text x="50" y="202" font-family="Arial" font-size="5" fill="%23555">176.18</text><text x="50" y="209" font-family="Arial" font-size="5" fill="%23555">942.18</text><text x="20" y="220" font-family="Arial" font-size="6" fill="%23333">Sposób zapłaty: przelew</text><text x="20" y="228" font-family="Arial" font-size="6" fill="%23333">Termin zapłaty: 14 dni 2022-03-07</text><text x="20" y="240" font-family="Arial" font-size="10" fill="%23000" font-weight="bold">Razem do zapłaty: 942.18 PLN</text><line x1="20" y1="245" x2="180" y2="245" stroke="%23000" stroke-width="2"/><text x="20" y="255" font-family="Arial" font-size="6" fill="%23333">Kwota słownie: dziewięćset czterdzieści dwa PLN 18/100</text><rect x="80" y="260" width="40" height="15" fill="none" stroke="%23000" stroke-width="2"/><text x="100" y="270" font-family="Arial" font-size="5" fill="%23333" text-anchor="middle">Pieczęć graficzna</text></svg>',
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
    description: 'Szablon inspirowany CargoLink - elegancki dla biznesu',
    preview: 'data:image/svg+xml;utf8,<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="280" fill="%23ffffff"/><circle cx="25" cy="20" r="8" fill="%230066cc"/><text x="25" y="24" font-family="Arial" font-size="6" fill="%23ffffff" text-anchor="middle" font-weight="bold">C</text><text x="35" y="20" font-family="Arial" font-size="8" fill="%230066cc" font-weight="bold">CARGOLINK</text><text x="180" y="15" font-family="Arial" font-size="8" fill="%23000" font-weight="bold" text-anchor="end">FAKTURA</text><text x="180" y="25" font-family="Arial" font-size="7" fill="%23666" text-anchor="end">06/11/22</text><text x="180" y="35" font-family="Arial" font-size="6" fill="%23666" text-anchor="end">Wystawienie: 2022-11-24</text><text x="180" y="43" font-family="Arial" font-size="6" fill="%23666" text-anchor="end">Wykonanie: 2022-11-24</text><text x="20" y="60" font-family="Arial" font-size="7" fill="%23000" font-weight="bold">SPRZEDAWCA</text><text x="20" y="70" font-family="Arial" font-size="7" fill="%23333" font-weight="bold">OMILINK Sp. z o.o.</text><text x="20" y="78" font-family="Arial" font-size="6" fill="%23666">handlujący jako: CargoLink</text><text x="20" y="86" font-family="Arial" font-size="6" fill="%23666">NIP: 5842816354</text><text x="20" y="94" font-family="Arial" font-size="6" fill="%23666">Szafera 3</text><text x="20" y="102" font-family="Arial" font-size="6" fill="%23666">80-299 Gdańsk, Polska</text><text x="110" y="60" font-family="Arial" font-size="7" fill="%23000" font-weight="bold">NABYWCA</text><text x="110" y="70" font-family="Arial" font-size="7" fill="%23333" font-weight="bold">Big Value Sp. z o.o.</text><text x="110" y="78" font-family="Arial" font-size="6" fill="%23666">NIP: 1234567878</text><text x="110" y="86" font-family="Arial" font-size="6" fill="%23666">Przykładowa 11</text><text x="110" y="94" font-family="Arial" font-size="6" fill="%23666">80-299 Gdańsk, Polska</text><text x="20" y="115" font-family="Arial" font-size="6" fill="%23666">sprzedawca nr ref.: PO/0001/9/2019, PO/0002/9/2019,PO/0003/9/2019</text><text x="20" y="123" font-family="Arial" font-size="6" fill="%23666">nabywca nr ref.: PO/0001/9/2019</text><rect x="20" y="130" width="160" height="8" fill="%23f3f4f6"/><text x="22" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">#</text><text x="35" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Nazwa</text><text x="100" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Cena netto</text><text x="130" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Ilość</text><text x="150" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">j.m.</text><text x="170" y="136" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">Razem</text><line x1="20" y1="138" x2="180" y2="138" stroke="%23d1d5db" stroke-width="0.5"/><text x="22" y="147" font-family="Arial" font-size="6" fill="%23555">1</text><text x="35" y="147" font-family="Arial" font-size="6" fill="%23555">fracht 2.1 A-B</text><text x="100" y="147" font-family="Arial" font-size="6" fill="%23555">1000.00</text><text x="130" y="147" font-family="Arial" font-size="6" fill="%23555">2.00</text><text x="150" y="147" font-family="Arial" font-size="6" fill="%23555">freight</text><text x="170" y="147" font-family="Arial" font-size="6" fill="%23555">2,460.00</text><text x="22" y="157" font-family="Arial" font-size="6" fill="%23555">2</text><text x="35" y="157" font-family="Arial" font-size="6" fill="%23555">opłata dokumentacyjna</text><text x="100" y="157" font-family="Arial" font-size="6" fill="%23555">200.00</text><text x="130" y="157" font-family="Arial" font-size="6" fill="%23555">1.00</text><text x="150" y="157" font-family="Arial" font-size="6" fill="%23555">usługa</text><text x="170" y="157" font-family="Arial" font-size="6" fill="%23555">216.00</text><line x1="20" y1="165" x2="180" y2="165" stroke="%23d1d5db" stroke-width="0.5"/><rect x="20" y="170" width="80" height="20" fill="%23f8f9fa" stroke="%23d1d5db" stroke-width="0.5"/><text x="22" y="178" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">netto</text><text x="22" y="185" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">%</text><text x="22" y="192" font-family="Arial" font-size="5" fill="%23333" font-weight="bold">VAT</text><text x="50" y="178" font-family="Arial" font-size="5" fill="%23555">2000.00</text><text x="50" y="185" font-family="Arial" font-size="5" fill="%23555">23.00%</text><text x="50" y="192" font-family="Arial" font-size="5" fill="%23555">460.00</text><text x="70" y="178" font-family="Arial" font-size="5" fill="%23555">200.00</text><text x="70" y="185" font-family="Arial" font-size="5" fill="%23555">8.00%</text><text x="70" y="192" font-family="Arial" font-size="5" fill="%23555">16.00</text><text x="110" y="175" font-family="Arial" font-size="7" fill="%23000" font-weight="bold">NALEŻNOŚCI RAZEM</text><text x="180" y="175" font-family="Arial" font-size="10" fill="%23000" text-anchor="end" font-weight="bold">2,676.00 PLN</text><text x="110" y="185" font-family="Arial" font-size="6" fill="%23666">metoda płatności: przelew</text><text x="110" y="193" font-family="Arial" font-size="6" fill="%23666">termin płatności: 2022-12-06 (termin dni:12)</text><text x="20" y="210" font-family="Arial" font-size="6" fill="%23000" font-weight="bold">KONTA BANKOWE</text><text x="20" y="218" font-family="Arial" font-size="6" fill="%23666">IDEA BANK BIC: IEEAPLPA</text><text x="20" y="226" font-family="Arial" font-size="6" fill="%23666">PLN: PL 24 1950 0001 2006 1318 9231 0002</text><text x="20" y="240" font-family="Arial" font-size="6" fill="%23000" font-weight="bold">UWAGI</text><text x="20" y="248" font-family="Arial" font-size="6" fill="%23dc2626" font-weight="bold">UWAGA!!!! ZMIANA NUMERU RACHUNKU BANKOWEGO</text><line x1="20" y1="260" x2="100" y2="260" stroke="%23666" stroke-dasharray="2,2"/><line x1="110" y1="260" x2="180" y2="260" stroke="%23666" stroke-dasharray="2,2"/><text x="20" y="270" font-family="Arial" font-size="5" fill="%23666">podpis sprzedawcy</text><text x="110" y="270" font-family="Arial" font-size="5" fill="%23666">podpis nabywcy</text></svg>',
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

