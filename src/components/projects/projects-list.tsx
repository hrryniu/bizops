'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { Eye, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import * as LucideIcons from 'lucide-react'

type Project = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  deadline: Date | null
  priority: number
  status: string
}

const priorityLabels: Record<number, string> = {
  1: 'Niski',
  2: 'Średni',
  3: 'Wysoki',
  4: 'Krytyczny',
}

const priorityColors: Record<number, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  1: 'secondary',
  2: 'default',
  3: 'outline',
  4: 'destructive',
}

const statusLabels: Record<string, string> = {
  active: 'Aktywny',
  completed: 'Ukończony',
  archived: 'Zarchiwizowany',
  onhold: 'Wstrzymany',
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  archived: 'outline',
  onhold: 'destructive',
}

export function ProjectsList({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [projectsList, setProjectsList] = useState(projects)

  const filtered = projectsList.filter(
    (proj) =>
      proj.name.toLowerCase().includes(search.toLowerCase()) ||
      proj.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (projectId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten projekt? Ta operacja jest nieodwracalna.')) {
      return
    }

    setDeletingId(projectId)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProjectsList(prev => prev.filter(proj => proj.id !== projectId))
      } else {
        alert('Błąd podczas usuwania projektu')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Błąd podczas usuwania projektu')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Szukaj projektu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projekt</TableHead>
              <TableHead>Opis</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Priorytet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Brak projektów
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((project) => {
                const IconComponent = project.icon 
                  ? (LucideIcons[project.icon as keyof typeof LucideIcons] as any) 
                  : LucideIcons.Folder
                
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {IconComponent && (
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          >
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <span className="font-medium">{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {project.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {project.deadline ? formatDate(project.deadline) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityColors[project.priority] || 'default'}>
                        {priorityLabels[project.priority] || 'Niski'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[project.status] || 'default'}>
                        {statusLabels[project.status] || project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/projects/${project.slug}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

