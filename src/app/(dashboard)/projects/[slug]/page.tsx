import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Flag } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { KanbanBoard } from '@/components/projects/kanban-board'
import * as LucideIcons from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

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

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  const project = await prisma.project.findUnique({
    where: { 
      slug: params.slug,
    },
    include: {
      columns: {
        include: {
          tasks: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!project || project.userId !== userId) {
    notFound()
  }

  // Serialize dates for Client Component compatibility
  const serializedColumns = project.columns.map(column => ({
    ...column,
    tasks: column.tasks.map(task => ({
      ...task,
      dueDate: task.dueDate,
    })),
  }))

  const IconComponent = project.icon 
    ? (LucideIcons[project.icon as keyof typeof LucideIcons] as any) 
    : LucideIcons.Folder

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: project.color || '#3b82f6' }}
              >
                <IconComponent className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project meta */}
      <div className="flex gap-4 flex-wrap">
        {project.deadline && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Deadline:</span>
            <span className="font-medium">{formatDate(project.deadline)}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Flag className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Priorytet:</span>
          <Badge variant={priorityColors[project.priority] || 'default'}>
            {priorityLabels[project.priority] || 'Niski'}
          </Badge>
        </div>
      </div>

      {/* Notes section */}
      {project.notesMd && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold mb-2">Notatki</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm">{project.notesMd}</pre>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div>
        <KanbanBoard columns={serializedColumns} projectId={project.id} />
      </div>
    </div>
  )
}

