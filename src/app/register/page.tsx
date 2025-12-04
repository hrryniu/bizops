'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Błąd',
        description: 'Hasła nie są takie same',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || undefined,
          email,
          password,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message =
          data?.error ??
          'Nie udało się utworzyć konta. Upewnij się, że email nie jest już zajęty.'

        toast({
          title: 'Błąd rejestracji',
          description: message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Konto utworzone',
        description: 'Możesz się teraz zalogować na nowe konto.',
      })

      router.push('/login')
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Wystąpił problem podczas tworzenia konta',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">BizOps</CardTitle>
          <CardDescription>Załóż nowe konto użytkownika</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Imię (opcjonalnie)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jan Kowalski"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Powtórz hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Tworzenie konta...' : 'Utwórz konto'}
            </Button>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Masz już konto?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => router.push('/login')}
              >
                Wróć do logowania
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


