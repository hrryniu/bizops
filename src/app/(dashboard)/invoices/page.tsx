import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { InvoicesList } from '@/components/invoices/invoices-list'
import { ExportButtons } from '@/components/export/export-buttons'

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { issueDate: 'desc' },
    include: { buyer: true },
  })

  // Convert Decimal objects to numbers for Client Component compatibility
  const serializedInvoices = invoices.map(invoice => ({
    ...invoice,
    totalNet: Number(invoice.totalNet),
    totalVat: Number(invoice.totalVat),
    totalGross: Number(invoice.totalGross),
    currency: invoice.currency,
    buyerPrivatePerson: invoice.buyerPrivatePerson,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faktury</h1>
          <p className="text-muted-foreground">Zarządzaj fakturami przychodowymi</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons type="invoices" />
          <Link href="/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nowa faktura
            </Button>
          </Link>
        </div>
      </div>

      <InvoicesList invoices={serializedInvoices} />
    </div>
  )
}

