'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Download, Upload, FileText, Database, Archive, ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default function ExportImportPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (type: 'json' | 'csv' | 'pdf' | 'zip') => {
    setLoading(type)
    try {
      const response = await fetch(`/api/export/${type}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Pobierz nazwę pliku z nagłówka
        const contentDisposition = response.headers.get('content-disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `bizops-export-${type}-${new Date().toISOString().split('T')[0]}.${type}`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Sukces',
          description: `Eksport ${type.toUpperCase()} został pobrany`,
        })
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: `Nie udało się wyeksportować danych ${type.toUpperCase()}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading('import')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Sukces',
          description: `Zaimportowano ${result.count} rekordów`,
        })
        // Odśwież stronę
        window.location.reload()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaimportować danych',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
      // Reset input
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Powrót
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Eksport i Import</h1>
        <p className="text-muted-foreground">Twórz kopie zapasowe i przywracaj dane</p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Eksport</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* JSON Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Eksport JSON
                </CardTitle>
                <CardDescription>
                  Pełna kopia wszystkich danych (faktury, koszty, projekty, ustawienia)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport('json')}
                  disabled={loading === 'json'}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {loading === 'json' ? 'Eksportowanie...' : 'Pobierz JSON'}
                </Button>
              </CardContent>
            </Card>

            {/* CSV Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Eksport CSV
                </CardTitle>
                <CardDescription>
                  Tabele faktur i kosztów w formacie CSV (Excel)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport('csv')}
                  disabled={loading === 'csv'}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {loading === 'csv' ? 'Eksportowanie...' : 'Pobierz CSV'}
                </Button>
              </CardContent>
            </Card>

            {/* PDF Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Eksport PDF
                </CardTitle>
                <CardDescription>
                  Wszystkie faktury jako pliki PDF w archiwum ZIP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport('pdf')}
                  disabled={loading === 'pdf'}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {loading === 'pdf' ? 'Eksportowanie...' : 'Pobierz PDF'}
                </Button>
              </CardContent>
            </Card>

            {/* ZIP Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Eksport ZIP
                </CardTitle>
                <CardDescription>
                  Kompletny eksport: JSON + PDF + załączniki
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport('zip')}
                  disabled={loading === 'zip'}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {loading === 'zip' ? 'Eksportowanie...' : 'Pobierz ZIP'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import danych
              </CardTitle>
              <CardDescription>
                Przywróć dane z pliku JSON (zastąpi istniejące dane)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <label htmlFor="import-file" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">
                        Kliknij aby wybrać plik JSON
                      </span>
                      <input
                        id="import-file"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImport}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tylko pliki JSON z eksportu BizOps
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Uwaga</h4>
                <p className="text-sm text-yellow-700">
                  Import zastąpi wszystkie istniejące dane. Upewnij się, że masz aktualną kopię zapasową.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
