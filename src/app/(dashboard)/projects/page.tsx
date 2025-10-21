import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ProjectsList } from '@/components/projects/projects-list'

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id!

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // Serialize dates for Client Component compatibility
  const serializedProjects = projects.map(project => ({
    ...project,
    deadline: project.deadline,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projekty</h1>
          <p className="text-muted-foreground">Zarządzaj projektami z tablicami Kanban</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nowy projekt
          </Button>
        </Link>
      </div>

      <ProjectsList projects={serializedProjects} />
    </div>
  )
}

