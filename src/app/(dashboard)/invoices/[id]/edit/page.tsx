'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { formatDate, calculateLineItem } from '@/lib/utils'
import Link from 'next/link'

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
  isForeign: boolean
  bicSwift?: string
  correspondentBankBic?: string
  correspondentBankAddress?: string
  currency?: string
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

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isVatPayer, setIsVatPayer] = useState(true)
  const [isPrivatePerson, setIsPrivatePerson] = useState(false)
  const [privatePerson, setPrivatePerson] = useState({
    firstName: '',
    lastName: '',
  })
  const [formData, setFormData] = useState({
    number: '',
    issueDate: '',
    saleDate: '',
    dueDate: '',
    paymentMethod: '',
    selectedBankAccount: '',
    currency: 'PLN',
    buyerId: '',
    notes: '',
  })
  const [items, setItems] = useState<InvoiceItem[]>([])

  useEffect(() => {
    fetchInvoiceData()
    fetchContractors()
    fetchBankAccounts()
  }, [invoiceId])

  const fetchInvoiceData = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const invoice = await response.json()
        
        // Check if invoice is DRAFT
        if (invoice.status !== 'DRAFT') {
          toast({
            title: 'Błąd',
            description: 'Można edytować tylko faktury będące szkicami',
            variant: 'destructive',
          })
          router.push(`/invoices/${invoiceId}`)
          return
        }
        
        // Set form data
        const formatDateForInput = (date: string | Date) => {
          if (!date) return ''
          const d = new Date(date)
          return d.toISOString().split('T')[0]
        }
        
        setFormData({
          number: invoice.number,
          issueDate: formatDateForInput(invoice.issueDate),
          saleDate: invoice.saleDate ? formatDateForInput(invoice.saleDate) : '',
          dueDate: invoice.dueDate ? formatDateForInput(invoice.dueDate) : '',
          paymentMethod: invoice.paymentMethod || '',
          selectedBankAccount: invoice.selectedBankAccount || '',
          currency: invoice.currency || 'PLN',
          buyerId: invoice.buyerId || '',
          notes: invoice.notes || '',
        })
        
        // Set buyer type
        if (invoice.buyerPrivatePerson) {
          setIsPrivatePerson(true)
          const [firstName, ...lastNameParts] = invoice.buyerPrivatePerson.split(' ')
          setPrivatePerson({
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
          })
        }
        
        // Set items
        const invoiceItems = invoice.items.map((item: any, index: number) => ({
          id: (index + 1).toString(),
          name: item.name,
          quantity: item.quantity.toString(),
          unit: item.unit || 'szt',
          netPrice: item.netPrice.toString(),
          vatRate: item.vatRate,
          discount: item.discount?.toString() || '0',
          lineNet: item.lineNet.toString(),
          lineVat: item.lineVat.toString(),
          lineGross: item.lineGross.toString(),
        }))
        setItems(invoiceItems.length > 0 ? invoiceItems : [{
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
        }])
      } else if (response.status === 404) {
        toast({
          title: 'Błąd',
          description: 'Faktura nie została znaleziona',
          variant: 'destructive',
        })
        router.push('/invoices')
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać danych faktury',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

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
        }
        
        // Set VAT payer status
        setIsVatPayer(data.settings?.isVatPayer ?? true)
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
    const defaultVatRate = isVatPayer ? '23' : 'zw'
    setItems([...items, {
      id: newId,
      name: '',
      quantity: '1',
      unit: 'szt',
      netPrice: '0',
      vatRate: defaultVatRate,
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

  const handleBankAccountChange = (accountName: string) => {
    const selectedAccount = bankAccounts.find(acc => acc.name === accountName)
    setFormData(prev => ({
      ...prev,
      selectedBankAccount: accountName,
      currency: selectedAccount?.currency || 'PLN'
    }))
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
      
      // Add VAT exemption note for non-VAT payers
      let notes = formData.notes || ''
      if (!isVatPayer) {
        const vatExemptionNote = "Podstawa prawna zwolnienia z VAT, zwolnienie przedmiotowe, art. 43 ust. 1"
        // Only add if not already present
        if (!notes.includes(vatExemptionNote)) {
          notes = notes ? `${notes}\n\n${vatExemptionNote}` : vatExemptionNote
        }
      }
      
      const invoiceData = {
        ...formData,
        notes,
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
      }

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        toast({
          title: 'Zapisano',
          description: 'Faktura została zaktualizowana',
        })
        router.push(`/invoices/${invoiceId}`)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować faktury',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Ładowanie danych...</p>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/invoices/${invoiceId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edytuj fakturę</h1>
        <p className="text-muted-foreground">Edytuj dane faktury {formData.number}</p>
      </div>

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
                  <Select value={formData.selectedBankAccount} onValueChange={handleBankAccountChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz konto" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.name} value={account.name}>
                          {account.name} - {account.accountNumber} {account.isForeign && `(${account.currency})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Currency selection - only show for foreign accounts */}
              {formData.paymentMethod === 'przelew' && formData.selectedBankAccount && (
                (() => {
                  const selectedAccount = bankAccounts.find(acc => acc.name === formData.selectedBankAccount)
                  return selectedAccount?.isForeign ? (
                    <div className="space-y-2">
                      <Label htmlFor="currency">Waluta faktury</Label>
                      <select
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="PLN">PLN - Złoty polski</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="USD">USD - Dolar amerykański</option>
                        <option value="GBP">GBP - Funt brytyjski</option>
                        <option value="CHF">CHF - Frank szwajcarski</option>
                        <option value="CZK">CZK - Korona czeska</option>
                        <option value="SEK">SEK - Korona szwedzka</option>
                        <option value="NOK">NOK - Korona norweska</option>
                        <option value="DKK">DKK - Korona duńska</option>
                      </select>
                    </div>
                  ) : null
                })()
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
            {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/invoices/${invoiceId}`)}
          >
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  )
}

