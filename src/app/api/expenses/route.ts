import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const expenseSchema = z.object({
  date: z.string(),
  issueDate: z.string().optional().nullable(),
  saleDate: z.string().optional().nullable(),
  docNumber: z.string().optional(),
  category: z.string().optional(),
  contractorId: z.string().optional().nullable(),
  contractorName: z.string().optional(),
  contractorNIP: z.string().optional().nullable(),
  contractorAddress: z.string().optional().nullable(),
  vatRate: z.string(),
  netAmount: z.number(),
  vatAmount: z.number(),
  grossAmount: z.number(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      include: { contractor: true },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')
    let expenseData: any
    let attachmentPath: string | null = null

    // Sprawdź czy to FormData (z załącznikiem) czy JSON
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Wyciągnij dane z FormData
      expenseData = {
        date: formData.get('date') as string,
        issueDate: formData.get('issueDate') as string || null,
        saleDate: formData.get('saleDate') as string || null,
        docNumber: formData.get('docNumber') as string,
        category: formData.get('category') as string,
        contractorId: formData.get('contractorId') as string || null,
        contractorName: formData.get('contractorName') as string,
        contractorNIP: formData.get('contractorNIP') as string || null,
        contractorAddress: formData.get('contractorAddress') as string || null,
        vatRate: formData.get('vatRate') as string,
        netAmount: parseFloat(formData.get('netAmount') as string) || 0,
        vatAmount: parseFloat(formData.get('vatAmount') as string) || 0,
        grossAmount: parseFloat(formData.get('grossAmount') as string) || 0,
        notes: formData.get('notes') as string,
      }

      // Obsługa załącznika
      const attachment = formData.get('attachment') as File | null
      if (attachment && attachment.size > 0) {
        const bytes = await attachment.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Utwórz katalog uploads jeśli nie istnieje
        const uploadsDir = join(process.cwd(), 'uploads', 'expenses')
        await mkdir(uploadsDir, { recursive: true })
        
        // Generuj unikalną nazwę pliku
        const timestamp = Date.now()
        const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filename = `${timestamp}_${sanitizedName}`
        const filepath = join(uploadsDir, filename)
        
        await writeFile(filepath, buffer)
        attachmentPath = `expenses/${filename}`
      }
    } else {
      // JSON
      expenseData = await request.json()
    }

    const validatedData = expenseSchema.parse(expenseData)

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        date: new Date(validatedData.date),
        issueDate: validatedData.issueDate ? new Date(validatedData.issueDate) : null,
        saleDate: validatedData.saleDate ? new Date(validatedData.saleDate) : null,
        docNumber: validatedData.docNumber || null,
        category: validatedData.category || null,
        contractorId: validatedData.contractorId || null,
        contractorName: validatedData.contractorName || null,
        contractorNIP: validatedData.contractorNIP || null,
        contractorAddress: validatedData.contractorAddress || null,
        vatRate: validatedData.vatRate,
        netAmount: validatedData.netAmount,
        vatAmount: validatedData.vatAmount,
        grossAmount: validatedData.grossAmount,
        notes: validatedData.notes || null,
        attachmentPath,
      },
      include: {
        contractor: true,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Expense creation error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}