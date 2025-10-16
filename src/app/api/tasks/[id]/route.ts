import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const taskUpdateSchema = z.object({
  columnId: z.string().optional(),
  status: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = taskUpdateSchema.parse(body)

    // Check if task belongs to user
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { project: true },
    })

    if (!task || task.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : undefined,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}