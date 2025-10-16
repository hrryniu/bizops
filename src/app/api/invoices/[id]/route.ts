import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'CORRECTED', 'CANCELED']),
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

    const invoiceId = params.id
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    // Check if invoice exists and belongs to user
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { userId: true, status: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: validatedData.status },
      include: {
        buyer: true,
        items: true,
      },
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating invoice status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    const invoiceId = params.id

    // Check if invoice exists and belongs to user
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { userId: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete invoice (cascade will delete items)
    await prisma.invoice.delete({
      where: { id: invoiceId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
