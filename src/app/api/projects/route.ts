import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(1, 'Nazwa projektu jest wymagana'),
  slug: z.string().min(1, 'Slug jest wymagany'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.number().min(1).max(4),
  notesMd: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      include: {
        tasks: true,
        columns: true,
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = projectSchema.parse(body)

    // Check if slug is unique
    const existingProject = await prisma.project.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'Projekt o tym slug już istnieje' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        icon: validatedData.icon,
        color: validatedData.color,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        priority: validatedData.priority,
        notesMd: validatedData.notesMd,
        columns: {
          create: [
            { name: 'Backlog', order: 0 },
            { name: 'W trakcie', order: 1 },
            { name: 'Przegląd', order: 2 },
            { name: 'Zrobione', order: 3 },
          ],
        },
      },
      include: {
        columns: true,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}