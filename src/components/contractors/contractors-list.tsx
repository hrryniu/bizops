'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

type Contractor = {
  id: string
  name: string
  nip: string | null
  email: string | null
  phone: string | null
  _count: {
    invoices: number
    expenses: number
  }
}

export function ContractorsList({ contractors }: { contractors: Contractor[] }) {
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const filtered = contractors.filter(
    (contractor) =>
      contractor.name.toLowerCase().includes(search.toLowerCase()) ||
      contractor.nip?.toLowerCase().includes(search.toLowerCase()) ||
      contractor.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć kontrahenta "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/contractors/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Usunięto',
          description: `Kontrahent "${name}" został usunięty`,
        })
        window.location.reload()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się usunąć kontrahenta',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Szukaj kontrahenta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Faktury</TableHead>
              <TableHead>Koszty</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Brak kontrahentów
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contractor) => (
                <TableRow key={contractor.id}>
                  <TableCell className="font-medium">{contractor.name}</TableCell>
                  <TableCell>{contractor.nip || '-'}</TableCell>
                  <TableCell>{contractor.email || '-'}</TableCell>
                  <TableCell>{contractor.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{contractor._count.invoices}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{contractor._count.expenses}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/contractors/${contractor.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/contractors/${contractor.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contractor.id, contractor.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}