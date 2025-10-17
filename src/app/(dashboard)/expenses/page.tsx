import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ExpensesList } from '@/components/expenses/expenses-list'
import { ExportButtons } from '@/components/export/export-buttons'

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    include: { contractor: true },
  })

  // Serialize for client component
  const serializedExpenses = expenses.map(expense => ({
    ...expense,
    netAmount: Number(expense.netAmount),
    vatAmount: Number(expense.vatAmount),
    grossAmount: Number(expense.grossAmount),
    isInstallment: expense.isInstallment,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Koszty</h1>
          <p className="text-muted-foreground">Ewidencja kosztów działalności</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons type="expenses" />
          <Link href="/expenses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nowy koszt
            </Button>
          </Link>
        </div>
      </div>

      <ExpensesList expenses={serializedExpenses} />
    </div>
  )
}

