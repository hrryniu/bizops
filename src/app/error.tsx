'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Coś poszło nie tak</h2>
          <p className="mt-2 text-gray-600">
            Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.
          </p>
          {error.message && (
            <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">
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
            onClick={() => (window.location.href = '/')}
            className="flex-1"
          >
            Wróć do strony głównej
          </Button>
        </div>
      </div>
    </div>
  )
}

