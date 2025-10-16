'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

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

interface InvoiceFileParserProps {
  onDataParsed: (data: ParsedInvoiceData) => void
  onCancel: () => void
}

export function InvoiceFileParser({ onDataParsed, onCancel }: InvoiceFileParserProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null)
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
          'x-file-type': 'invoice'
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dodaj fakturę z pliku
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
              Wykryte dane faktury
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Numer faktury
                </label>
                <p className="text-lg font-semibold">
                  {parsedData.invoiceNumber || 'Nie wykryto'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Data wystawienia
                </label>
                <p className="text-lg font-semibold">
                  {formatDate(parsedData.issueDate)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Data płatności
                </label>
                <p className="text-lg font-semibold">
                  {formatDate(parsedData.dueDate)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  NIP kontrahenta
                </label>
                <p className="text-lg font-semibold">
                  {parsedData.buyerNIP || 'Nie wykryto'}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Nazwa kontrahenta
                </label>
                <p className="text-lg font-semibold">
                  {parsedData.buyerName || 'Nie wykryto'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Kwota netto
                </label>
                <p className="text-lg font-semibold text-green-600">
                  {formatAmount(parsedData.totalNet)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Kwota VAT
                </label>
                <p className="text-lg font-semibold text-blue-600">
                  {formatAmount(parsedData.totalVat)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Kwota brutto
                </label>
                <p className="text-lg font-semibold text-purple-600">
                  {formatAmount(parsedData.totalGross)}
                </p>
              </div>
            </div>

            {parsedData.items && parsedData.items.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Wykryte pozycje
                </label>
                <div className="mt-2 space-y-2">
                  {parsedData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="secondary">
                        {item.quantity} {item.unit} × {item.netPrice.toFixed(2)} zł
                      </Badge>
                    </div>
                  ))}
                </div>
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
