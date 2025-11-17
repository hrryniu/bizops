'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-card p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Błąd w panelu</h2>
          <p className="mt-2 text-muted-foreground">
            Wystąpił błąd podczas ładowania panelu. Spróbuj odświeżyć stronę.
          </p>
          {error.message && (
            <p className="mt-4 rounded bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <Button onClick={reset} className="flex-1">
            Spróbuj ponownie
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/dashboard')}
            className="flex-1"
          >
            Wróć do panelu
          </Button>
        </div>
      </div>
    </div>
  )
}

