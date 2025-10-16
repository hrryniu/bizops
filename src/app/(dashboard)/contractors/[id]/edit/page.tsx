'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

type Contractor = {
  id: string
  name: string
  nip: string | null
  address: string | null
  email: string | null
  phone: string | null
  notes: string | null
}

export default function EditContractorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    nip: '',
    address: '',
    email: '',
    phone: '',
    notes: '',
  })

  useEffect(() => {
    fetchContractor()
  }, [])

  const fetchContractor = async () => {
    try {
      const response = await fetch(`/api/contractors/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setContractor(data)
        setFormData({
          name: data.name || '',
          nip: data.nip || '',
          address: data.address || '',
          email: data.email || '',
          phone: data.phone || '',
          notes: data.notes || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch contractor:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/contractors/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Zaktualizowano',
          description: 'Kontrahent został zaktualizowany',
        })
        router.push(`/contractors/${params.id}`)
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować kontrahenta',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!contractor) {
    return <div>Ładowanie...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edytuj kontrahenta</h1>
        <p className="text-muted-foreground">Zaktualizuj dane kontrahenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dane kontrahenta</CardTitle>
          <CardDescription>Wypełnij podstawowe informacje o kontrahencie</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notatki</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Anuluj
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}




