'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Check, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

type TaxEvent = {
  id: string
  title: string
  description: string | null
  dueDate: Date
  status: string
  templateKey: string
}

export function TaxEventsList({
  events,
  showCompleted = false,
}: {
  events: TaxEvent[]
  showCompleted?: boolean
}) {
  const { toast } = useToast()

  const handleToggle = async (eventId: string, currentStatus: string) => {
    try {
      const response = await fetch(`/api/tax-events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentStatus === 'PENDING' ? 'DONE' : 'PENDING',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Zaktualizowano',
          description: 'Status zdarzenia został zmieniony',
        })
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować zdarzenia',
        variant: 'destructive',
      })
    }
  }

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak zdarzeń</p>
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="flex items-start justify-between border-b pb-3 last:border-0">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-medium">{event.title}</div>
              <Badge variant={event.status === 'DONE' ? 'default' : 'outline'}>
                {formatDate(event.dueDate)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">{event.description}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(event.id, event.status)}
          >
            {event.status === 'DONE' ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-orange-600" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}

