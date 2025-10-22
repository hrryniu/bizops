import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, ArrowLeft, Edit, Eye } from 'lucide-react'
import { InvoiceStatusChanger } from '@/components/invoices/invoice-status-changer'
import Link from 'next/link'

// Helper function to remove duplicate sentences/phrases from notes
function cleanNotes(text: string): string {
  if (!text) return text
  
  let cleanText = text.trim()
  
  // Try to detect and remove repeating patterns
  const words = cleanText.split(/\s+/)
  if (words.length > 10) {
    // For longer texts, try to find if first half repeats in second half
    const halfLength = Math.floor(words.length / 2)
    const firstHalf = words.slice(0, halfLength).join(' ')
    const remaining = words.slice(halfLength).join(' ')
    
    // If first part appears again in the remaining text, it's likely a duplicate
    if (remaining.includes(firstHalf.substring(0, Math.min(50, firstHalf.length)))) {
      return firstHalf
    }
  }
  
  // Also check for simpler repetitions (same text repeated twice)
  const possibleDuplicateLength = Math.floor(cleanText.length / 2)
  for (let len = possibleDuplicateLength; len >= 20; len--) {
    const firstPart = cleanText.substring(0, len).trim()
    const secondPart = cleanText.substring(len).trim()
    
    // Check if second part starts with first part
    if (secondPart.startsWith(firstPart.substring(0, Math.min(30, firstPart.length)))) {
      return firstPart
    }
  }
  
  return cleanText
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      buyer: true,
      items: true,
    },
  })

  if (!invoice || invoice.userId !== userId) {
    notFound()
  }
  
  // Clean notes from duplicates
  const displayNotes = invoice.notes ? cleanNotes(invoice.notes) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Button>
        </Link>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{invoice.number}</h1>
          <p className="text-muted-foreground">
            Data wystawienia: {formatDate(invoice.issueDate)}
          </p>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'DRAFT' && (
            <Button asChild variant="outline">
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edytuj
              </Link>
            </Button>
          )}
          <InvoiceStatusChanger 
            invoiceId={invoice.id} 
            currentStatus={invoice.status} 
          />
          <Button asChild variant="outline">
            <a href={`/api/invoices/${invoice.id}/pdf?preview=true`} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4" />
              Podgląd PDF
            </a>
          </Button>
          <Button asChild>
            <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Pobierz PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nabywca</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.buyerPrivatePerson ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{invoice.buyerPrivatePerson}</p>
                <p className="text-muted-foreground">Osoba prywatna</p>
              </div>
            ) : invoice.buyer ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{invoice.buyer.name}</p>
                {invoice.buyer.nip && <p>NIP: {invoice.buyer.nip}</p>}
                {invoice.buyer.address && <p>{invoice.buyer.address}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">Brak danych nabywcy</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data sprzedaży:</span>
              <span>{invoice.saleDate ? formatDate(invoice.saleDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Termin płatności:</span>
              <span>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metoda płatności:</span>
              <span>{invoice.paymentMethod || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pozycje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.items.map((item) => (
              <div key={item.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity.toString()} {item.unit} × {formatCurrency(item.netPrice)} | VAT{' '}
                      {item.vatRate}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.lineGross)}</p>
                    <p className="text-sm text-muted-foreground">
                      Netto: {formatCurrency(item.lineNet)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Netto:</span>
              <span>{formatCurrency(invoice.totalNet)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT:</span>
              <span>{formatCurrency(invoice.totalVat)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Brutto:</span>
              <span>{formatCurrency(invoice.totalGross)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {displayNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Uwagi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{displayNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
