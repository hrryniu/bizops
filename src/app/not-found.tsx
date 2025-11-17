import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-lg">
        <h2 className="text-6xl font-bold text-gray-900">404</h2>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-gray-800">Strona nie została znaleziona</h3>
          <p className="text-gray-600">
            Przepraszamy, ale strona, której szukasz, nie istnieje.
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <Button asChild className="flex-1">
            <Link href="/dashboard">Wróć do panelu</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">Strona główna</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

