'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Receipt, Upload, X, FileText, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type Contractor = {
  id: string
  name: string
  nip: string | null
  address: string | null
}

type Expense = {
  id: string
  docNumber: string | null
  date: string
  issueDate: string | null
  saleDate: string | null
  category: string | null
  vatRate: string | null
  netAmount: number
  vatAmount: number
  grossAmount: number
  notes: string | null
  contractorId: string | null
  contractorName: string | null
  contractorNIP: string | null
  contractorAddress: string | null
  attachmentPath: string | null
  contractor: Contractor | null
}

export default function EditExpensePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [expense, setExpense] = useState<Expense | null>(null)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [useCustomContractor, setUseCustomContractor] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [customContractor, setCustomContractor] = useState({
    name: '',
    nip: '',
    address: '',
  })
  const [formData, setFormData] = useState({
    contractorId: '',
    docNumber: '',
    date: '',
    issueDate: '',
    saleDate: '',
    category: '',
    vatRate: '23',
    netAmount: '',
    vatAmount: '',
    grossAmount: '',
    notes: '',
  })

  useEffect(() => {
    fetchExpense()
    fetchContractors()
  }, [])

  const fetchExpense = async () => {
    try {
      const response = await fetch(`/api/expenses/${params.id}`)
      if (response.ok) {
        const data: Expense = await response.json()
        setExpense(data)
        
        // Wypełnij formularz
        setFormData({
          contractorId: data.contractorId || '',
          docNumber: data.docNumber || '',
          date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
          issueDate: data.issueDate ? new Date(data.issueDate).toISOString().split('T')[0] : '',
          saleDate: data.saleDate ? new Date(data.saleDate).toISOString().split('T')[0] : '',
          category: data.category || '',
          vatRate: data.vatRate || '23',
          netAmount: data.netAmount.toString(),
          vatAmount: data.vatAmount.toString(),
          grossAmount: data.grossAmount.toString(),
          notes: data.notes || '',
        })

        // Sprawdź czy używa własnego kontrahenta
        if (data.contractorName && !data.contractorId) {
          setUseCustomContractor(true)
          setCustomContractor({
            name: data.contractorName,
            nip: data.contractorNIP || '',
            address: data.contractorAddress || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching expense:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać kosztu',
        variant: 'destructive',
      })
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
      console.error('Error fetching contractors:', error)
    }
  }

  const calculateAmounts = () => {
    const net = parseFloat(formData.netAmount) || 0
    const vat = parseFloat(formData.vatAmount) || 0
    const gross = parseFloat(formData.grossAmount) || 0

    if (net > 0 && vat === 0 && gross === 0) {
      const vatRate = parseFloat(formData.vatRate) / 100
      const calculatedVat = net * vatRate
      const calculatedGross = net + calculatedVat
      setFormData(prev => ({
        ...prev,
        vatAmount: calculatedVat.toFixed(2),
        grossAmount: calculatedGross.toFixed(2)
      }))
    } else if (gross > 0 && net === 0 && vat === 0) {
      const vatRate = parseFloat(formData.vatRate) / 100
      const calculatedNet = gross / (1 + vatRate)
      const calculatedVat = gross - calculatedNet
      setFormData(prev => ({
        ...prev,
        netAmount: calculatedNet.toFixed(2),
        vatAmount: calculatedVat.toFixed(2)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (useCustomContractor && !customContractor.name) {
      toast({
        title: 'Błąd',
        description: 'Proszę podać nazwę kontrahenta',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)

    try {
      const expenseData = {
        ...formData,
        ...(useCustomContractor ? {
          contractorId: null,
          contractorName: customContractor.name,
          contractorNIP: customContractor.nip || null,
          contractorAddress: customContractor.address || null,
        } : {
          contractorId: formData.contractorId || null,
        }),
        netAmount: parseFloat(formData.netAmount) || 0,
        vatAmount: parseFloat(formData.vatAmount) || 0,
        grossAmount: parseFloat(formData.grossAmount) || 0,
        issueDate: formData.issueDate || null,
        saleDate: formData.saleDate || null,
      }

      let response
      if (attachmentFile) {
        const formDataToSend = new FormData()
        Object.entries(expenseData).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            formDataToSend.append(key, value.toString())
          }
        })
        formDataToSend.append('attachment', attachmentFile)
        
        response = await fetch(`/api/expenses/${params.id}`, {
          method: 'PATCH',
          body: formDataToSend,
        })
      } else {
        response = await fetch(`/api/expenses/${params.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData),
        })
      }

      if (response.ok) {
        toast({
          title: 'Sukces',
          description: 'Koszt został zaktualizowany pomyślnie.',
        })
        router.push('/expenses')
      } else {
        const error = await response.json()
        toast({
          title: 'Błąd',
          description: error.error || 'Nie udało się zaktualizować kosztu.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      toast({
        title: 'Błąd',
        description: 'Wystąpił błąd podczas aktualizacji kosztu.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!expense) {
    return <div>Ładowanie...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/expenses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edytuj koszt</h1>
          <p className="text-muted-foreground">Zaktualizuj dane kosztu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Podstawowe informacje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Informacje o koszcie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Źródło danych kontrahenta</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useCustomContractor}
                    onChange={() => {
                      setUseCustomContractor(false)
                      setCustomContractor({ name: '', nip: '', address: '' })
                    }}
                    className="w-4 h-4"
                  />
                  <span>Z listy kontrahentów</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useCustomContractor}
                    onChange={() => {
                      setUseCustomContractor(true)
                      setFormData({ ...formData, contractorId: '' })
                    }}
                    className="w-4 h-4"
                  />
                  <span>Własne dane</span>
                </label>
              </div>
            </div>

            {!useCustomContractor ? (
              <div className="space-y-2">
                <Label htmlFor="contractorId">Kontrahent</Label>
                <Select value={formData.contractorId} onValueChange={(value) => setFormData({ ...formData, contractorId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kontrahenta" />
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
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="contractorName">Nazwa kontrahenta *</Label>
                  <Input
                    id="contractorName"
                    value={customContractor.name}
                    onChange={(e) => setCustomContractor({ ...customContractor, name: e.target.value })}
                    required={useCustomContractor}
                    placeholder="np. Firma XYZ Sp. z o.o."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractorNIP">NIP</Label>
                    <Input
                      id="contractorNIP"
                      value={customContractor.nip}
                      onChange={(e) => setCustomContractor({ ...customContractor, nip: e.target.value })}
                      placeholder="np. 1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractorAddress">Adres</Label>
                    <Input
                      id="contractorAddress"
                      value={customContractor.address}
                      onChange={(e) => setCustomContractor({ ...customContractor, address: e.target.value })}
                      placeholder="np. ul. Przykładowa 1, Warszawa"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="docNumber">Numer dokumentu</Label>
                <Input
                  id="docNumber"
                  value={formData.docNumber}
                  onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                  placeholder="np. FV/2024/001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data księgowania *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Data wystawienia</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDate">Data sprzedaży/wykonania usługi</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paliwo">Paliwo</SelectItem>
                  <SelectItem value="biuro">Biuro</SelectItem>
                  <SelectItem value="telefon">Telefon/Internet</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="jedzenie">Jedzenie</SelectItem>
                  <SelectItem value="inne">Inne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Kwoty */}
        <Card>
          <CardHeader>
            <CardTitle>Kwoty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="vatRate">Stawka VAT (%)</Label>
                <Select value={formData.vatRate} onValueChange={(value) => setFormData({ ...formData, vatRate: value })}>
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
              <div className="space-y-2">
                <Label htmlFor="netAmount">Kwota netto (zł)</Label>
                <Input
                  id="netAmount"
                  type="number"
                  step="0.01"
                  value={formData.netAmount}
                  onChange={(e) => setFormData({ ...formData, netAmount: e.target.value })}
                  onBlur={calculateAmounts}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatAmount">Kwota VAT (zł)</Label>
                <Input
                  id="vatAmount"
                  type="number"
                  step="0.01"
                  value={formData.vatAmount}
                  onChange={(e) => setFormData({ ...formData, vatAmount: e.target.value })}
                  onBlur={calculateAmounts}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grossAmount">Kwota brutto (zł)</Label>
                <Input
                  id="grossAmount"
                  type="number"
                  step="0.01"
                  value={formData.grossAmount}
                  onChange={(e) => setFormData({ ...formData, grossAmount: e.target.value })}
                  onBlur={calculateAmounts}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Załącznik */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Załącznik
            </CardTitle>
            <CardDescription>
              {expense?.attachmentPath ? 'Zmień załącznik' : 'Dodaj skan lub zdjęcie faktury (PDF, JPG, PNG)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expense?.attachmentPath && !attachmentFile && (
                <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Obecny załącznik</p>
                      <p className="text-xs text-muted-foreground">{expense.attachmentPath}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`/uploads/${expense.attachmentPath}`} target="_blank" rel="noopener noreferrer">
                      Otwórz
                    </a>
                  </Button>
                </div>
              )}
              
              {!attachmentFile ? (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="attachment"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast({
                            title: 'Plik za duży',
                            description: 'Maksymalny rozmiar pliku to 10MB',
                            variant: 'destructive',
                          })
                          return
                        }
                        setAttachmentFile(file)
                      }
                    }}
                    className="hidden"
                  />
                  <Label htmlFor="attachment" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {expense?.attachmentPath ? 'Kliknij aby zmienić plik' : 'Kliknij aby wybrać plik'}
                      </span>
                      <span className="text-xs text-muted-foreground">PDF, JPG, PNG (max 10MB)</span>
                    </div>
                  </Label>
                </div>
              ) : (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{attachmentFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachmentFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachmentFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notatki */}
        <Card>
          <CardHeader>
            <CardTitle>Notatki</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Dodatkowe informacje</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Opcjonalne notatki dotyczące kosztu..."
              />
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
            onClick={() => router.back()}
          >
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  )
}

