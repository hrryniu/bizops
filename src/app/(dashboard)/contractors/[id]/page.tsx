import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default async function ContractorDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  const contractor = await prisma.contractor.findUnique({
    where: { id: params.id },
    include: {
      invoices: {
        select: {
          id: true,
          number: true,
          issueDate: true,
          totalGross: true,
          currency: true,
          status: true,
        },
        orderBy: { issueDate: 'desc' },
        take: 5,
      },
      expenses: {
        select: {
          id: true,
          date: true,
          category: true,
          grossAmount: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  })

  if (!contractor || contractor.userId !== userId) {
    notFound()
  }

  const totalInvoices = contractor.invoices.reduce((sum, inv) => sum + parseFloat(inv.totalGross), 0)
  const totalExpenses = contractor.expenses.reduce((sum, exp) => sum + parseFloat(exp.grossAmount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{contractor.name}</h1>
          <p className="text-muted-foreground">Szczegóły kontrahenta</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/contractors/${contractor.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edytuj
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dane kontrahenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">NIP:</span>
              <span>{contractor.nip || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{contractor.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefon:</span>
              <span>{contractor.phone || '-'}</span>
            </div>
            {contractor.address && (
              <div className="mt-4">
                <span className="text-muted-foreground">Adres:</span>
                <p className="mt-1">{contractor.address}</p>
              </div>
            )}
            {contractor.notes && (
              <div className="mt-4">
                <span className="text-muted-foreground">Notatki:</span>
                <p className="mt-1">{contractor.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statystyki</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{contractor.invoices.length}</div>
                <div className="text-sm text-muted-foreground">Faktury</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{contractor.expenses.length}</div>
                <div className="text-sm text-muted-foreground">Koszty</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Łączna wartość faktur:</span>
                <span className="font-medium">{formatCurrency(totalInvoices)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Łączna wartość kosztów:</span>
                <span className="font-medium">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ostatnie faktury */}
      <Card>
        <CardHeader>
          <CardTitle>Ostatnie faktury</CardTitle>
        </CardHeader>
        <CardContent>
          {contractor.invoices.length > 0 ? (
            <div className="space-y-3">
              {contractor.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">{invoice.number}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(invoice.totalGross, invoice.currency)}</div>
                    <Badge variant={invoice.status === 'PAID' ? 'default' : 'outline'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Brak faktur</p>
          )}
          <Link href="/invoices" className="mt-4 block text-sm text-primary hover:underline">
            Zobacz wszystkie faktury →
          </Link>
        </CardContent>
      </Card>

      {/* Ostatnie koszty */}
      <Card>
        <CardHeader>
          <CardTitle>Ostatnie koszty</CardTitle>
        </CardHeader>
        <CardContent>
          {contractor.expenses.length > 0 ? (
            <div className="space-y-3">
              {contractor.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">{expense.category || 'Bez kategorii'}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(expense.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(expense.grossAmount)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Brak kosztów</p>
          )}
          <Link href="/expenses" className="mt-4 block text-sm text-primary hover:underline">
            Zobacz wszystkie koszty →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}




