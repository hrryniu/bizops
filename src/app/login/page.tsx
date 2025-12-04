'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('admin@bizops.local')
  const [password, setPassword] = useState('admin123')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Błąd logowania',
          description: 'Nieprawidłowy email lub hasło',
          variant: 'destructive',
        })
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Wystąpił problem podczas logowania',
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
          <CardDescription>Zaloguj się do swojego konta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
            <div className="mt-4 space-y-1 text-center text-sm text-muted-foreground">
              <div>
                Testowe konto: <span className="font-mono">admin@bizops.local</span> /{' '}
                <span className="font-mono">admin123</span>
              </div>
              <div>
                Nie masz konta?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Utwórz nowego użytkownika
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

