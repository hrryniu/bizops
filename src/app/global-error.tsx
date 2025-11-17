'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="pl">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Krytyczny błąd aplikacji</h2>
              <p className="mt-2 text-gray-600">
                Wystąpił krytyczny błąd, który uniemożliwia działanie aplikacji.
              </p>
              {error.message && (
                <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">
                  {error.message}
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Spróbuj ponownie
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Wróć do strony głównej
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

