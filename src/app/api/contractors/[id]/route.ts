import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const contractorSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  nip: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contractor = await prisma.contractor.findUnique({
      where: { id: params.id },
      include: {
        invoices: {
          select: {
            id: true,
            number: true,
            issueDate: true,
            totalGross: true,
            status: true,
          },
          orderBy: { issueDate: 'desc' },
          take: 5,
        },
        expenses: {
          select: {
            id: true,
            date: true,
            category: true,
            grossAmount: true,
          },
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    })

    if (!contractor || contractor.userId !== session.user.id) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    return NextResponse.json(contractor)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contractor' }, { status: 500 })
  }
}

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
    const validatedData = contractorSchema.parse(body)

    const contractor = await prisma.contractor.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(contractor)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sprawdź czy kontrahent ma powiązane faktury lub koszty
    const contractor = await prisma.contractor.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            invoices: true,
            expenses: true,
          },
        },
      },
    })

    if (!contractor || contractor.userId !== session.user.id) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    if (contractor._count.invoices > 0 || contractor._count.expenses > 0) {
      return NextResponse.json(
        { error: 'Cannot delete contractor with associated invoices or expenses' },
        { status: 400 }
      )
    }

    await prisma.contractor.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 })
  }
}


