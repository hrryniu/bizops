'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Download } from 'lucide-react'

type Interval = 'never' | 'daily' | 'weekly' | 'monthly'

const INTERVAL_LABELS: Record<Interval, string> = {
  never: 'Wyłączone',
  daily: 'Raz dziennie',
  weekly: 'Raz w tygodniu',
  monthly: 'Raz w miesiącu',
}

const STORAGE_INTERVAL_KEY = 'bizops_backup_interval'
const STORAGE_LAST_BACKUP_KEY = 'bizops_backup_last'

function getMsForInterval(interval: Interval): number | null {
  switch (interval) {
    case 'daily':
      return 24 * 60 * 60 * 1000
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000
    case 'never':
    default:
      return null
  }
}

export function BackupSettingsCard() {
  const { toast } = useToast()
  const [interval, setInterval] = useState<Interval>('never')
  const [autoRunning, setAutoRunning] = useState(false)

  // Wczytaj zapisane ustawienia z localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_INTERVAL_KEY) as Interval | null
    if (stored && ['never', 'daily', 'weekly', 'monthly'].includes(stored)) {
      setInterval(stored)
    }
  }, [])

  // Automatyczny backup przy wejściu, jeśli minął interwał
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ms = getMsForInterval(interval)
    if (!ms || autoRunning) return

    const lastRaw = window.localStorage.getItem(STORAGE_LAST_BACKUP_KEY)
    if (!lastRaw) return

    const last = new Date(lastRaw).getTime()
    if (Number.isNaN(last)) return

    const now = Date.now()
    if (now - last < ms) return

    // Cichy automatyczny backup
    setAutoRunning(true)
    void triggerBackup(true).finally(() => setAutoRunning(false))
  }, [interval, autoRunning])

  const handleIntervalChange = (value: string) => {
    const val = value as Interval
    setInterval(val)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_INTERVAL_KEY, val)
    }
  }

  const triggerBackup = async (silent = false) => {
    try {
      const response = await fetch('/api/db/backup')

      if (!response.ok) {
        throw new Error()
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `bizops-database-backup-${new Date().toISOString().split('T')[0]}.db`

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_LAST_BACKUP_KEY, new Date().toISOString())
      }

      if (!silent) {
        toast({
          title: 'Kopia zapasowa utworzona',
          description: 'Plik bazy danych został pobrany na Twój komputer.',
        })
      }
    } catch (error) {
      if (!silent) {
        toast({
          title: 'Błąd kopii zapasowej',
          description: 'Nie udało się wykonać automatycznego backupu bazy danych.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleManualNow = () => {
    void triggerBackup(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatyczne kopie zapasowe</CardTitle>
        <CardDescription>
          Ustaw, jak często BizOps powinien przypominać i wykonywać automatyczny backup pliku bazy
          danych (SQLite).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Częstotliwość automatycznego backupu</p>
          <Select value={interval} onValueChange={handleIntervalChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Wybierz interwał" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">{INTERVAL_LABELS.never}</SelectItem>
              <SelectItem value="daily">{INTERVAL_LABELS.daily}</SelectItem>
              <SelectItem value="weekly">{INTERVAL_LABELS.weekly}</SelectItem>
              <SelectItem value="monthly">{INTERVAL_LABELS.monthly}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Backup wykonywany jest przy wejściu do tej strony ustawień, jeśli od ostatniej kopii
            minął wybrany czas. Plik trafia do Twojego folderu pobierania.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Możesz też w każdej chwili ręcznie wymusić utworzenie kopii zapasowej bazy danych.
          </p>
          <Button variant="outline" size="sm" onClick={handleManualNow}>
            <Download className="mr-2 h-4 w-4" />
            Wykonaj backup teraz
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


