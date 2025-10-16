'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2, FileText } from 'lucide-react'
import { formatDate, calculateLineItem } from '@/lib/utils'
import { InvoiceFileParser } from '@/components/invoices/invoice-file-parser'
import { TemplatePreviewDialog } from '@/components/invoices/template-preview-dialog'
import { InvoiceReaderUpload } from '@/components/invoices/invoice-reader-upload'
import { Eye } from 'lucide-react'

type ParsedInvoiceData = {
  invoiceNumber?: string
  issueDate?: string
  dueDate?: string
  buyerName?: string
  buyerNIP?: string
  buyerAddress?: string
  totalNet?: number
  totalVat?: number
  totalGross?: number
  items?: Array<{
    name: string
    quantity: number
    unit: string
    netPrice: number
    vatRate: string
    lineGross: number
  }>
}

type Contractor = {
  id: string
  name: string
  nip: string | null
  address: string | null
}

type BankAccount = {
  name: string
  accountNumber: string
  isDefault: boolean
}

type InvoiceItem = {
  id: string
  name: string
  quantity: string
  unit: string
  netPrice: string
  vatRate: string
  discount: string
  lineNet: string
  lineVat: string
  lineGross: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [showFileParser, setShowFileParser] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [previewTemplate, setPreviewTemplate] = useState<'modern' | 'classic' | 'minimal' | null>(null)
  const [isPrivatePerson, setIsPrivatePerson] = useState(false)
  const [privatePerson, setPrivatePerson] = useState({
    firstName: '',
    lastName: '',
  })
  const [formData, setFormData] = useState({
    number: '',
    issueDate: formatDate(new Date(), 'short').split('.').reverse().join('-'),
    saleDate: '',
    dueDate: '',
    paymentMethod: '',
    selectedBankAccount: '',
    buyerId: '',
    notes: '',
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      name: '',
      quantity: '1',
      unit: 'szt',
      netPrice: '0',
      vatRate: '23',
      discount: '0',
      lineNet: '0',
      lineVat: '0',
      lineGross: '0',
    },
  ])

  useEffect(() => {
    fetchContractors()
    fetchBankAccounts()
  }, [])

  const fetchContractors = async () => {
    try {
      const response = await fetch('/api/contractors')
      if (response.ok) {
        const data = await response.json()
        setContractors(data)
      }
    } catch (error) {
      console.error('Failed to fetch contractors:', error)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings?.bankAccounts) {
          const accounts = JSON.parse(data.settings.bankAccounts)
          setBankAccounts(accounts)
          // Set default account if available
          const defaultAccount = accounts.find((acc: BankAccount) => acc.isDefault)
          if (defaultAccount) {
            setFormData(prev => ({ ...prev, selectedBankAccount: defaultAccount.name }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error)
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        
        // Recalculate line totals
        if (['quantity', 'netPrice', 'vatRate', 'discount'].includes(field)) {
          const totals = calculateLineItem(
            updated.quantity,
            updated.netPrice,
            updated.vatRate,
            updated.discount
          )
          updated.lineNet = totals.lineNet
          updated.lineVat = totals.lineVat
          updated.lineGross = totals.lineGross
        }
        
        return updated
      }
      return item
    }))
  }

  const addItem = () => {
    const newId = (Math.max(...items.map(i => parseInt(i.id))) + 1).toString()
    setItems([...items, {
      id: newId,
      name: '',
      quantity: '1',
      unit: 'szt',
      netPrice: '0',
      vatRate: '23',
      discount: '0',
      lineNet: '0',
      lineVat: '0',
      lineGross: '0',
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const calculateTotals = () => {
    const totals = items.reduce((acc, item) => ({
      net: acc.net + parseFloat(item.lineNet),
      vat: acc.vat + parseFloat(item.lineVat),
      gross: acc.gross + parseFloat(item.lineGross),
    }), { net: 0, vat: 0, gross: 0 })

    return {
      totalNet: totals.net.toFixed(2),
      totalVat: totals.vat.toFixed(2),
      totalGross: totals.gross.toFixed(2),
    }
  }

  const handleFileDataParsed = (data: ParsedInvoiceData) => {
    // Wypełnij formularz danymi z pliku
    if (data.invoiceNumber) {
      setFormData(prev => ({ ...prev, number: data.invoiceNumber! }))
    }
    if (data.issueDate) {
      setFormData(prev => ({ ...prev, issueDate: data.issueDate! }))
    }
    if (data.dueDate) {
      setFormData(prev => ({ ...prev, dueDate: data.dueDate! }))
    }
    
    // Dodaj pozycje jeśli zostały wykryte
    if (data.items && data.items.length > 0) {
      const newItems = data.items.map((item, index) => ({
        id: (index + 1).toString(),
        name: item.name,
        quantity: item.quantity.toString(),
        unit: item.unit,
        netPrice: item.netPrice.toString(),
        vatRate: item.vatRate,
        discount: '0',
        lineNet: item.lineGross.toString(),
        lineVat: '0',
        lineGross: item.lineGross.toString(),
      }))
      setItems(newItems)
    }
    
    setShowFileParser(false)
    toast({
      title: 'Dane wczytane',
      description: 'Formularz został wypełniony danymi z pliku.',
    })
  }

  const handleInvoiceReaderData = (data: any) => {
    // Wypełnij formularz danymi z invoice-reader
    if (data.invoiceNumber) {
      setFormData(prev => ({ ...prev, number: data.invoiceNumber }))
    }
    if (data.issueDate) {
      setFormData(prev => ({ ...prev, issueDate: data.issueDate }))
    }
    if (data.saleDate) {
      setFormData(prev => ({ ...prev, saleDate: data.saleDate }))
    }
    
    // Dodaj pozycje
    if (data.positions && data.positions.length > 0) {
      const newItems = data.positions.map((pos: any, index: number) => ({
        id: (index + 1).toString(),
        name: pos.name,
        quantity: pos.quantity?.toString() || '1',
        unit: pos.unit || 'szt',
        netPrice: pos.unitPrice?.value?.toString() || pos.net?.value?.toString() || '0',
        vatRate: pos.vatRate || '23',
        discount: '0',
        lineNet: pos.net?.value?.toString() || '0',
        lineVat: pos.vat?.value?.toString() || '0',
        lineGross: pos.gross?.value?.toString() || '0',
      }))
      setItems(newItems)
    }
    
    toast({
      title: 'Dane rozpoznane',
      description: `Formularz wypełniony automatycznie (pewność: ${Math.round(data.confidence * 100)}%)`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Walidacja dla osoby prywatnej
    if (isPrivatePerson) {
      if (!privatePerson.firstName || !privatePerson.lastName) {
        toast({
          title: 'Błąd',
          description: 'Proszę podać imię i nazwisko nabywcy',
          variant: 'destructive',
        })
        return
      }
    }
    
    setLoading(true)

    try {
      const totals = calculateTotals()
      const invoiceData = {
        ...formData,
        // Jeśli osoba prywatna, buyerId będzie puste, ale dodajemy dane osoby
        ...(isPrivatePerson ? {
          buyerId: null,
          buyerPrivatePerson: `${privatePerson.firstName} ${privatePerson.lastName}`,
        } : {}),
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          netPrice: item.netPrice,
          vatRate: item.vatRate,
          discount: item.discount,
          lineNet: item.lineNet,
          lineVat: item.lineVat,
          lineGross: item.lineGross,
        })),
        ...totals,
        template: selectedTemplate,
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        const invoice = await response.json()
        toast({
          title: 'Utworzono',
          description: 'Faktura została utworzona',
        })
        router.push(`/invoices/${invoice.id}`)
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się utworzyć faktury',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nowa faktura</h1>
        <p className="text-muted-foreground">Utwórz nową fakturę przychodową</p>
      </div>

      {/* Inteligentne rozpoznawanie faktur */}
      <InvoiceReaderUpload onDataExtracted={handleInvoiceReaderData} />

      {/* Wybór szablonu faktury */}
      <Card>
        <CardHeader>
          <CardTitle>Szablon faktury</CardTitle>
          <CardDescription>Wybierz szablon dla swojej faktury</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Szablon Modern */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedTemplate === 'modern' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate('modern')}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Modern</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewTemplate('modern')
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Czysty, nowoczesny design</p>
                <div className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MODERN</span>
                </div>
              </div>
            </div>

            {/* Szablon Classic */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedTemplate === 'classic' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate('classic')}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Classic</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewTemplate('classic')
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Tradycyjny, elegancki styl</p>
                <div className="h-16 bg-gradient-to-r from-gray-700 to-gray-800 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CLASSIC</span>
                </div>
              </div>
            </div>

            {/* Szablon Minimal */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedTemplate === 'minimal' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate('minimal')}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Minimal</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewTemplate('minimal')
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Prosty, minimalistyczny</p>
                <div className="h-16 bg-gradient-to-r from-green-500 to-green-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MINIMAL</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Podstawowe informacje */}
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number">Numer faktury *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Typ nabywcy</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isPrivatePerson}
                      onChange={() => {
                        setIsPrivatePerson(false)
                        setPrivatePerson({ firstName: '', lastName: '' })
                      }}
                      className="w-4 h-4"
                    />
                    <span>Firma</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isPrivatePerson}
                      onChange={() => {
                        setIsPrivatePerson(true)
                        setFormData({ ...formData, buyerId: '' })
                      }}
                      className="w-4 h-4"
                    />
                    <span>Osoba prywatna</span>
                  </label>
                </div>
              </div>
            </div>

            {!isPrivatePerson ? (
              <div className="space-y-2">
                <Label htmlFor="buyerId">Wybierz nabywcę (firma)</Label>
                <Select value={formData.buyerId} onValueChange={(value) => setFormData({ ...formData, buyerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz nabywcę" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Imię *</Label>
                  <Input
                    id="firstName"
                    value={privatePerson.firstName}
                    onChange={(e) => setPrivatePerson({ ...privatePerson, firstName: e.target.value })}
                    required={isPrivatePerson}
                    placeholder="Jan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nazwisko *</Label>
                  <Input
                    id="lastName"
                    value={privatePerson.lastName}
                    onChange={(e) => setPrivatePerson({ ...privatePerson, lastName: e.target.value })}
                    required={isPrivatePerson}
                    placeholder="Kowalski"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Data wystawienia *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDate">Data sprzedaży</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Termin płatności</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Metoda płatności</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz metodę" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="przelew">Przelew</SelectItem>
                    <SelectItem value="gotówka">Gotówka</SelectItem>
                    <SelectItem value="karta">Karta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.paymentMethod === 'przelew' && bankAccounts.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="selectedBankAccount">Konto bankowe</Label>
                  <Select value={formData.selectedBankAccount} onValueChange={(value) => setFormData({ ...formData, selectedBankAccount: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz konto" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.name} value={account.name}>
                          {account.name} - {account.accountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notatki</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pozycje faktury */}
        <Card>
          <CardHeader>
            <CardTitle>Pozycje faktury</CardTitle>
            <CardDescription>Dodaj produkty lub usługi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="grid gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Pozycja {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Nazwa *</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ilość *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jednostka</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cena netto *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.netPrice}
                      onChange={(e) => updateItem(item.id, 'netPrice', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT</Label>
                    <Select value={item.vatRate} onValueChange={(value) => updateItem(item.id, 'vatRate', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="23">23%</SelectItem>
                        <SelectItem value="8">8%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="zw">ZW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Rabat (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Netto</Label>
                    <Input value={item.lineNet} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT</Label>
                    <Input value={item.lineVat} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Brutto</Label>
                    <Input value={item.lineGross} readOnly className="bg-muted" />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj pozycję
            </Button>
          </CardContent>
        </Card>

        {/* Podsumowanie */}
        <Card>
          <CardHeader>
            <CardTitle>Podsumowanie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Netto:</span>
                <span>{parseFloat(totals.totalNet).toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT:</span>
                <span>{parseFloat(totals.totalVat).toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Brutto:</span>
                <span>{parseFloat(totals.totalGross).toFixed(2)} zł</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Zapisz jako szkic'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Anuluj
          </Button>
        </div>
      </form>

      {showFileParser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <InvoiceFileParser
              onDataParsed={handleFileDataParsed}
              onCancel={() => setShowFileParser(false)}
            />
          </div>
        </div>
      )}

      {previewTemplate && (
        <TemplatePreviewDialog
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  )
}