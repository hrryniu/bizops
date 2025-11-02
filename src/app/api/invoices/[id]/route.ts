import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        buyer: true,
        items: true,
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const invoiceItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().or(z.number()),
  unit: z.string().optional(),
  netPrice: z.string().or(z.number()),
  vatRate: z.string(),
  discount: z.string().or(z.number()).default('0'),
  lineNet: z.string().or(z.number()),
  lineVat: z.string().or(z.number()),
  lineGross: z.string().or(z.number()),
})

const updateInvoiceSchema = z.object({
  number: z.string().min(1),
  issueDate: z.string().or(z.date()),
  saleDate: z.string().or(z.date()).optional().nullable(),
  dueDate: z.string().or(z.date()).optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  selectedBankAccount: z.string().optional().nullable(),
  buyerId: z.string().optional().nullable(),
  buyerPrivatePerson: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema),
  totalNet: z.string().or(z.number()),
  totalVat: z.string().or(z.number()),
  totalGross: z.string().or(z.number()),
})

// Schema for status-only update
const statusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'CORRECTED', 'CANCELED'])
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

    const userId = session.user.id

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: { userId: true, status: true }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (existingInvoice.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Check if this is a status-only update
    const isStatusUpdate = body.status && Object.keys(body).length === 1
    
    if (isStatusUpdate) {
      // Validate status update
      const statusData = statusUpdateSchema.parse(body)
      
      // Update only the status
      const updatedInvoice = await prisma.invoice.update({
        where: { id: params.id },
        data: {
          status: statusData.status
        },
        include: {
          items: true,
          buyer: true
        }
      })
      
      return NextResponse.json(updatedInvoice)
    }
    
    // Full invoice update - only allow for DRAFT invoices
    if (existingInvoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft invoices can be edited' },
        { status: 400 }
      )
    }

    const data = updateInvoiceSchema.parse(body)

    // Update invoice in transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id }
      })

      // Update invoice with new items
      return tx.invoice.update({
        where: { id: params.id },
        data: {
          number: data.number,
          issueDate: new Date(data.issueDate),
          saleDate: data.saleDate ? new Date(data.saleDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          paymentMethod: data.paymentMethod,
          selectedBankAccount: data.selectedBankAccount,
          buyerId: data.buyerId,
          buyerPrivatePerson: data.buyerPrivatePerson,
          notes: data.notes,
          totalNet: data.totalNet.toString(),
          totalVat: data.totalVat.toString(),
          totalGross: data.totalGross.toString(),
          items: {
            create: data.items.map(item => ({
              name: item.name,
              quantity: item.quantity.toString(),
              unit: item.unit,
              netPrice: item.netPrice.toString(),
              vatRate: item.vatRate,
              discount: item.discount.toString(),
              lineNet: item.lineNet.toString(),
              lineVat: item.lineVat.toString(),
              lineGross: item.lineGross.toString(),
            }))
          }
        },
        include: {
          items: true,
          buyer: true
        }
      })
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
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

    const userId = session.user.id

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: { userId: true, status: true }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (existingInvoice.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow deleting DRAFT invoices
    if (existingInvoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted' },
        { status: 400 }
      )
    }

    // Delete invoice (items will be cascade deleted)
    await prisma.invoice.delete({
      where: { id: params.id }
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
