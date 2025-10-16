'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Contractor {
  id: string
  name: string
  nip?: string
  address?: string
}

interface ContractorSelectProps {
  value?: string
  onValueChange: (value: string) => void
  onAddNew?: () => void
}

export function ContractorSelect({ value, onValueChange, onAddNew }: ContractorSelectProps) {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContractors()
  }, [])

  const fetchContractors = async () => {
    try {
      const response = await fetch('/api/contractors')
      if (response.ok) {
        const data = await response.json()
        setContractors(data)
      }
    } catch (error) {
      console.error('Error fetching contractors:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Ładowanie..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Wybierz kontrahenta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Brak kontrahenta</SelectItem>
          {contractors.map((contractor) => (
            <SelectItem key={contractor.id} value={contractor.id}>
              <div>
                <div className="font-medium">{contractor.name}</div>
                {contractor.nip && (
                  <div className="text-xs text-muted-foreground">NIP: {contractor.nip}</div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onAddNew && (
        <Button type="button" variant="outline" size="icon" onClick={onAddNew}>
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
