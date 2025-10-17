import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const invoiceItemSchema = z.object({
  name: z.string().min(1, 'Nazwa pozycji jest wymagana'),
  quantity: z.string(),
  unit: z.string().optional(),
  netPrice: z.string(),
  vatRate: z.string(),
  discount: z.string(),
  lineNet: z.string(),
  lineVat: z.string(),
  lineGross: z.string(),
})

const invoiceSchema = z.object({
  number: z.string().min(1, 'Numer faktury jest wymagany'),
  issueDate: z.string(),
  saleDate: z.string().optional(),
  dueDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  selectedBankAccount: z.string().optional(),
  currency: z.string().optional(),
  buyerId: z.string().optional().nullable(),
  buyerPrivatePerson: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Faktura musi mieć co najmniej jedną pozycję'),
  totalNet: z.string(),
  totalVat: z.string(),
  totalGross: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      orderBy: { issueDate: 'desc' },
      include: { buyer: true },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = invoiceSchema.parse(body)

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        number: validatedData.number,
        issueDate: new Date(validatedData.issueDate),
        saleDate: validatedData.saleDate ? new Date(validatedData.saleDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        paymentMethod: validatedData.paymentMethod,
        selectedBankAccount: validatedData.selectedBankAccount,
        currency: validatedData.currency || 'PLN',
        buyerId: validatedData.buyerId || null,
        buyerPrivatePerson: validatedData.buyerPrivatePerson,
        notes: validatedData.notes,
        totalNet: validatedData.totalNet,
        totalVat: validatedData.totalVat,
        totalGross: validatedData.totalGross,
        items: {
          create: validatedData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            netPrice: item.netPrice,
            vatRate: item.vatRate,
            discount: item.discount,
            lineNet: item.lineNet,
            lineVat: item.lineVat,
            lineGross: item.lineGross,
          })),
        },
      },
      include: {
        buyer: true,
        items: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}