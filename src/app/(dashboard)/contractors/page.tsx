import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ContractorsList } from '@/components/contractors/contractors-list'

export default async function ContractorsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  const contractors = await prisma.contractor.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          invoices: true,
          expenses: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kontrahenci</h1>
          <p className="text-muted-foreground">Zarządzaj kontrahentami i nabywcami</p>
        </div>
        <Link href="/contractors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nowy kontrahent
          </Button>
        </Link>
      </div>

      <ContractorsList contractors={contractors} />
    </div>
  )
}