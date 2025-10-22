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
import { formatCurrency, formatDate } from '@/lib/utils'
import { Eye, Download, Trash2, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { InvoiceStatusChanger } from './invoice-status-changer'

type Invoice = {
  id: string
  number: string
  issueDate: Date
  totalGross: number
  status: string
  buyer: { name: string } | null
  buyerPrivatePerson: string | null
}

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [invoicesList, setInvoicesList] = useState(invoices)

  const filtered = invoicesList.filter(
    (inv) =>
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyer?.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyerPrivatePerson?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    DRAFT: 'secondary',
    ISSUED: 'default',
    PAID: 'default',
    CORRECTED: 'outline',
    CANCELED: 'destructive',
  }

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę fakturę? Ta operacja jest nieodwracalna.')) {
      return
    }

    setDeletingId(invoiceId)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state
        setInvoicesList(prev => prev.filter(inv => inv.id !== invoiceId))
      } else {
        alert('Błąd podczas usuwania faktury')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Błąd podczas usuwania faktury')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    setInvoicesList(prev => 
      prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      )
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Szukaj faktury..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
                <TableRow>
                  <TableHead>Numer</TableHead>
                  <TableHead>Nabywca</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Data wystawienia</TableHead>
                  <TableHead>Wartość brutto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Brak faktur
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.buyerPrivatePerson || invoice.buyer?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.buyerPrivatePerson ? 'secondary' : 'outline'}>
                      {invoice.buyerPrivatePerson ? 'Osoba prywatna' : 'Firma'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalGross)}</TableCell>
                  <TableCell>
                    <InvoiceStatusChanger 
                      invoiceId={invoice.id}
                      currentStatus={invoice.status}
                      onStatusChange={(newStatus) => handleStatusChange(invoice.id, newStatus)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm" title="Szczegóły">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        title="Podgląd PDF"
                      >
                        <a href={`/api/invoices/${invoice.id}/pdf?preview=true`} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        title="Pobierz PDF"
                      >
                        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(invoice.id)}
                        disabled={deletingId === invoice.id}
                        className="text-red-600 hover:text-red-700"
                        title="Usuń"
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

