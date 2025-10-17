import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Receipt, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Charts } from '@/components/dashboard/charts'
import { t } from '@/lib/i18n'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  // Pobierz ustawienia użytkownika
  const settings = await prisma.settings.findUnique({
    where: { userId },
    select: { isVatPayer: true, locale: true },
  })
  const isVatPayer = settings?.isVatPayer ?? true
  const locale = settings?.locale ?? 'pl-PL'

  // Pobierz statystyki
  const [invoices, expenses, upcomingTaxEvents] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId },
      take: 5,
      orderBy: { issueDate: 'desc' },
      include: { buyer: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      take: 5,
      orderBy: { date: 'desc' },
      include: { contractor: true },
    }),
    prisma.taxEvent.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: { gte: new Date() },
        // Filtruj wydarzenia VAT jeśli użytkownik nie jest płatnikiem VAT
        ...(isVatPayer ? {} : {
          templateKey: {
            not: {
              contains: 'VAT',
            },
          },
        }),
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
    }),
  ])

  // Oblicz podsumowania
  const totalInvoices = await prisma.invoice.count({ where: { userId } })
  const totalExpenses = await prisma.expense.count({ where: { userId } })

  const invoicesSum = await prisma.invoice.aggregate({
    where: { userId, status: { in: ['ISSUED', 'PAID'] } },
    _sum: { totalGross: true },
  })

  const expensesSum = await prisma.expense.aggregate({
    where: { userId },
    _sum: { grossAmount: true },
  })

  const totalRevenue = Number(invoicesSum._sum.totalGross || 0)
  const totalCosts = Number(expensesSum._sum.grossAmount || 0)

  // Pobierz dane dla wykresów
  const currentMonth = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(currentMonth.getMonth() - 6)

  const [monthlyInvoices, monthlyExpenses, categoryExpenses, vatInvoices, vatExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        issueDate: true,
        totalGross: true,
        totalVat: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        date: true,
        grossAmount: true,
        vatAmount: true,
        category: true,
      },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId,
        date: {
          gte: sixMonthsAgo,
        },
      },
      _sum: {
        grossAmount: true,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        userId,
        issueDate: {
          gte: sixMonthsAgo,
        },
      },
      _sum: {
        totalVat: true,
      },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: sixMonthsAgo,
        },
      },
      _sum: {
        vatAmount: true,
      },
    }),
  ])

  // Przygotuj dane miesięczne
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
    
    const monthInvoices = monthlyInvoices.filter(inv => 
      inv.issueDate.toISOString().slice(0, 7) === monthKey
    )
    const monthExpenses = monthlyExpenses.filter(exp => 
      exp.date.toISOString().slice(0, 7) === monthKey
    )
    
    const revenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.totalGross || 0), 0)
    const costs = monthExpenses.reduce((sum, exp) => sum + Number(exp.grossAmount || 0), 0)
    
    monthlyData.push({
      month: date.toLocaleDateString('pl-PL', { month: 'short' }),
      revenue,
      costs,
      profit: revenue - costs,
    })
  }

  // Przygotuj dane kategorii
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
  const categoryData = categoryExpenses
    .filter(item => item.category)
    .map((item, index) => ({
      name: item.category || 'Inne',
      value: Number(item._sum.grossAmount || 0),
      color: COLORS[index % COLORS.length],
    }))

  // Przygotuj dane VAT
  const vatChartData = [
    {
      name: 'Należny',
      value: Number(vatInvoices._sum.totalVat || 0),
      color: '#10b981',
    },
    {
      name: 'Naliczony',
      value: Number(vatExpenses._sum.vatAmount || 0),
      color: '#ef4444',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Witaj w BizOps! Oto przegląd Twojej działalności.</p>
      </div>

      {/* Statystyki */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Przychody (brutto)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{totalInvoices} faktur</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Koszty (brutto)</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCosts)}</div>
            <p className="text-xs text-muted-foreground">{totalExpenses} dokumentów</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue - totalCosts)}</div>
            <p className="text-xs text-muted-foreground">Szacunkowe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nadchodzące terminy</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTaxEvents.length}</div>
            <p className="text-xs text-muted-foreground">Oczekujące zdarzenia</p>
          </CardContent>
        </Card>
      </div>

      {/* Nadchodzące terminy podatkowe */}
      <Card>
        <CardHeader>
          <CardTitle>Nadchodzące terminy podatkowe</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTaxEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingTaxEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">{event.description}</div>
                  </div>
                  <Badge variant="outline">{formatDate(event.dueDate)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Brak nadchodzących terminów</p>
          )}
          <Link href="/calendar" className="mt-4 block text-sm text-primary hover:underline">
            Zobacz wszystkie terminy →
          </Link>
        </CardContent>
      </Card>

      {/* Ostatnie faktury */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ostatnie faktury</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{invoice.number}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.buyer?.name || 'Brak nabywcy'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(invoice.totalGross)}</div>
                      <Badge variant={invoice.status === 'PAID' ? 'default' : 'outline'}>
                        {t(`invoiceStatus.${invoice.status}`, locale)}
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
            {expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{expense.category || 'Bez kategorii'}</div>
                      <div className="text-sm text-muted-foreground">
                        {expense.contractorName || expense.contractor?.name || 'Brak kontrahenta'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(expense.grossAmount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(expense.date)}
                      </div>
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

      {/* Wykresy */}
      <Charts 
        monthlyData={monthlyData}
        categoryData={categoryData}
        vatData={vatChartData}
        isVatPayer={isVatPayer}
      />
    </div>
  )
}

