'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { Badge } from '@/components/ui/badge'
import { Loader2, Receipt, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

type ParsedExpenseData = {
  docNumber?: string
  date?: string
  contractorName?: string
  contractorNIP?: string
  category?: string
  netAmount?: number
  vatAmount?: number
  grossAmount?: number
  vatRate?: string
  description?: string
}

interface ExpenseFileParserProps {
  onDataParsed: (data: ParsedExpenseData) => void
  onCancel: () => void
}

export function ExpenseFileParser({ onDataParsed, onCancel }: ExpenseFileParserProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedExpenseData | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const { toast } = useToast()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setParsedData(null)
    setRawText('')
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setParsedData(null)
    setRawText('')
  }

  const handleParse = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    try {
      // Wyczyść poprzednie dane
      setParsedData(null)
      setRawText('')

      // Wyślij plik do API
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/parse-file', {
        method: 'POST',
        headers: {
          'x-file-type': 'expense'
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Błąd podczas przetwarzania pliku')
      }

      const result = await response.json()
      setRawText(result.text)
      setParsedData(result.data)

      toast({
        title: 'Plik przetworzony',
        description: 'Dane zostały wyciągnięte z pliku. Sprawdź i potwierdź.',
      })
    } catch (error) {
      console.error('Parse error:', error)
      toast({
        title: 'Błąd przetwarzania',
        description: error instanceof Error ? error.message : 'Nie udało się przetworzyć pliku',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = () => {
    if (parsedData) {
      onDataParsed(parsedData)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Nie wykryto'
    try {
      const date = new Date(dateStr.replace(/[\.\-\/]/g, '/'))
      return date.toLocaleDateString('pl-PL')
    } catch {
      return dateStr
    }
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return 'Nie wykryto'
    return `${amount.toFixed(2)} zł`
  }

  const getCategoryColor = (category?: string) => {
    const colors = {
      'paliwo': 'bg-red-100 text-red-800',
      'biuro': 'bg-blue-100 text-blue-800',
      'telefon': 'bg-green-100 text-green-800',
      'transport': 'bg-yellow-100 text-yellow-800',
      'jedzenie': 'bg-purple-100 text-purple-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Dodaj koszt z pliku
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Obsługiwane formaty: PDF, JPG, PNG
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onRemove={handleRemove}
            isProcessing={isProcessing}
            acceptedTypes=".pdf,.jpg,.jpeg,.png"
            maxSize={10}
          />

          {selectedFile && !parsedData && (
            <div className="flex gap-2">
              <Button
                onClick={handleParse}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Przetwarzanie...
                  </>
                ) : (
                  'Przetwórz plik'
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Anuluj
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Wykryte dane kosztu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Numer dokumentu
                </label>
                <p className="text-lg font-semibold">
                  {parsedData.docNumber || 'Nie wykryto'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Data
                </label>
                <p className="text-lg font-semibold">
                  {formatDate(parsedData.date)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  NIP kontrahenta
                </label>
                <p className="text-lg font-semibold">
                  {parsedData.contractorNIP || 'Nie wykryto'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Kategoria
                </label>
                {parsedData.category ? (
                  <Badge className={getCategoryColor(parsedData.category)}>
                    {parsedData.category}
                  </Badge>
                ) : (
                  <p className="text-lg font-semibold">Nie wykryto</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Nazwa kontrahenta
                </label>
                <p className="text-lg font-semibold">
                  {parsedData.contractorName || 'Nie wykryto'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Kwota netto
                </label>
                <p className="text-lg font-semibold text-green-600">
                  {formatAmount(parsedData.netAmount)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Kwota VAT
                </label>
                <p className="text-lg font-semibold text-blue-600">
                  {formatAmount(parsedData.vatAmount)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Kwota brutto
                </label>
                <p className="text-lg font-semibold text-purple-600">
                  {formatAmount(parsedData.grossAmount)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Stawka VAT
                </label>
                <p className="text-lg font-semibold">
                  {parsedData.vatRate ? `${parsedData.vatRate}%` : 'Nie wykryto'}
                </p>
              </div>
            </div>

            {parsedData.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Opis
                </label>
                <p className="text-sm bg-muted p-3 rounded">
                  {parsedData.description}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleConfirm} className="flex-1">
                Użyj tych danych
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Anuluj
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {rawText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Odczytany tekst (do weryfikacji)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded max-h-40 overflow-auto whitespace-pre-wrap">
              {rawText}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
