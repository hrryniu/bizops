import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TaxEventsList } from '@/components/calendar/tax-events-list'

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  const taxEvents = await prisma.taxEvent.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' },
  })

  const pending = taxEvents.filter((e) => e.status === 'PENDING' && e.dueDate >= new Date())
  const done = taxEvents.filter((e) => e.status === 'DONE')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kalendarz podatkowy</h1>
        <p className="text-muted-foreground">Śledź terminy płatności i deklaracji</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nadchodzące terminy</CardTitle>
            <CardDescription>Oczekujące zdarzenia podatkowe</CardDescription>
          </CardHeader>
          <CardContent>
            <TaxEventsList events={pending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zrobione</CardTitle>
            <CardDescription>Zakończone zdarzenia</CardDescription>
          </CardHeader>
          <CardContent>
            <TaxEventsList events={done} showCompleted />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

