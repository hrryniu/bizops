'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Check, Edit3 } from 'lucide-react'

interface InvoiceStatusChangerProps {
  invoiceId: string
  currentStatus: string
  onStatusChange?: (newStatus: string) => void
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Szkic',
  ISSUED: 'Wystawiona',
  PAID: 'Opłacona',
  CORRECTED: 'Korekta',
  CANCELED: 'Anulowana',
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  ISSUED: 'default',
  PAID: 'default',
  CORRECTED: 'outline',
  CANCELED: 'destructive',
}

export function InvoiceStatusChanger({ 
  invoiceId, 
  currentStatus, 
  onStatusChange 
}: InvoiceStatusChangerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      })

      if (response.ok) {
        toast({
          title: 'Status zaktualizowany',
          description: `Faktura została oznaczona jako ${statusLabels[selectedStatus]}`,
        })
        onStatusChange?.(selectedStatus)
        setIsEditing(false)
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować statusu faktury',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setSelectedStatus(currentStatus)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleStatusUpdate}
          disabled={isUpdating}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isUpdating}
        >
          Anuluj
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusColors[currentStatus] || 'outline'}>
        {statusLabels[currentStatus] || currentStatus}
      </Badge>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
      >
        <Edit3 className="h-4 w-4" />
      </Button>
    </div>
  )
}
