'use client'

import { Button } from '@/components/ui/button'
import { Download, FileText, Database } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ExportButtonsProps {
  type: 'invoices' | 'expenses'
  dateRange?: {
    startDate: string
    endDate: string
  }
}

export function ExportButtons({ type, dateRange }: ExportButtonsProps) {
  const { toast } = useToast()

  const handleCSVExport = async () => {
    try {
      const params = new URLSearchParams({ type })
      if (dateRange) {
        params.append('startDate', dateRange.startDate)
        params.append('endDate', dateRange.endDate)
      }

      const response = await fetch(`/api/export/csv?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Eksport zakończony',
          description: 'Plik CSV został pobrany',
        })
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się wyeksportować danych',
        variant: 'destructive',
      })
    }
  }

  const handleJSONExport = async () => {
    try {
      const response = await fetch(`/api/export/json?type=${type}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Eksport zakończony',
          description: 'Plik JSON został pobrany',
        })
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się wyeksportować danych',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCSVExport}>
        <FileText className="mr-2 h-4 w-4" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleJSONExport}>
        <Database className="mr-2 h-4 w-4" />
        JSON
      </Button>
    </div>
  )
}




