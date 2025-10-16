'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'

export function InvoiceReaderUpload({ onDataExtracted }: { onDataExtracted?: (data: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const ext = selectedFile.name.toLowerCase()
      if (ext.endsWith('.pdf') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png')) {
        setFile(selectedFile)
        setStatus('idle')
        setResult(null)
      } else {
        toast({
          title: 'Nieprawidłowy format',
          description: 'Obsługiwane formaty: PDF, JPG, PNG',
          variant: 'destructive',
        })
      }
    }
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setStatus('uploading')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', 'immediate') // Process immediately for better UX

    try {
      const response = await fetch('/api/invoice-reader/process', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        if (data.mode === 'immediate') {
          setStatus('completed')
          setResult(data.data)
          
          toast({
            title: 'Faktura przetworzona',
            description: `Rozpoznano fakturę ${data.data.invoiceNumber || 'bez numeru'} z pewnością ${Math.round(data.data.confidence * 100)}%`,
          })

          if (onDataExtracted) {
            onDataExtracted(data.data)
          }
        } else {
          // Queue mode - poll for status
          setStatus('processing')
          pollJobStatus(data.jobId)
        }
      } else {
        throw new Error(data.error || 'Processing failed')
      }
    } catch (error) {
      setStatus('error')
      toast({
        title: 'Błąd przetwarzania',
        description: error instanceof Error ? error.message : 'Nieznany błąd',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60 // 60 seconds
    let attempts = 0

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/invoice-reader/process?jobId=${jobId}`)
        const data = await response.json()

        if (data.success && data.job) {
          if (data.job.status === 'completed') {
            setStatus('completed')
            setResult(data.job.result)
            
            toast({
              title: 'Faktura przetworzona',
              description: `Rozpoznano fakturę ${data.job.result.invoiceNumber || 'bez numeru'}`,
            })

            if (onDataExtracted) {
              onDataExtracted(data.job.result)
            }
            return
          } else if (data.job.status === 'failed') {
            setStatus('error')
            toast({
              title: 'Błąd przetwarzania',
              description: data.job.error || 'Nieznany błąd',
              variant: 'destructive',
            })
            return
          }
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000)
        } else {
          setStatus('error')
          toast({
            title: 'Przekroczono czas oczekiwania',
            description: 'Przetwarzanie trwa zbyt długo',
            variant: 'destructive',
          })
        }
      } catch (error) {
        setStatus('error')
        toast({
          title: 'Błąd sprawdzania statusu',
          description: error instanceof Error ? error.message : 'Nieznany błąd',
          variant: 'destructive',
        })
      }
    }

    checkStatus()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Inteligentne rozpoznawanie faktur
        </CardTitle>
        <CardDescription>
          Wgraj fakturę w formacie PDF/JPG/PNG, a system automatycznie wydobędzie wszystkie dane
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invoice-file">Wybierz plik faktury</Label>
          <div className="flex items-center gap-2">
            <input
              id="invoice-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="flex-1 text-sm"
              disabled={isProcessing}
            />
            <Button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Rozpoznaj
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        {status !== 'idle' && (
          <div className="p-4 rounded-lg border">
            {status === 'uploading' && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Przesyłanie pliku...</span>
              </div>
            )}
            {status === 'processing' && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Przetwarzanie faktury (to może potrwać do minuty)...</span>
              </div>
            )}
            {status === 'completed' && result && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Pomyślnie rozpoznano!</span>
                </div>
                <div className="text-sm space-y-1 ml-7">
                  <p><strong>Numer:</strong> {result.invoiceNumber || 'Nie rozpoznano'}</p>
                  <p><strong>Data:</strong> {result.issueDate || 'Nie rozpoznano'}</p>
                  <p><strong>Sprzedawca:</strong> {result.seller?.name || 'Nie rozpoznano'}</p>
                  <p><strong>NIP sprzedawcy:</strong> {result.seller?.nip || 'Nie rozpoznano'}</p>
                  <p><strong>Kwota brutto:</strong> {result.totals?.gross?.value ? `${result.totals.gross.value.toFixed(2)} ${result.totals.gross.currency}` : 'Nie rozpoznano'}</p>
                  <p><strong>Pewność:</strong> {Math.round(result.confidence * 100)}%</p>
                  {result.positions && result.positions.length > 0 && (
                    <p><strong>Pozycje:</strong> {result.positions.length}</p>
                  )}
                </div>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span>Nie udało się przetworzyć faktury</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

