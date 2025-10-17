import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const updateExpenseSchema = z.object({
  date: z.string().optional(),
  issueDate: z.string().optional().nullable(),
  saleDate: z.string().optional().nullable(),
  docNumber: z.string().optional(),
  category: z.string().optional(),
  contractorId: z.string().optional().nullable(),
  contractorName: z.string().optional(),
  contractorNIP: z.string().optional().nullable(),
  contractorAddress: z.string().optional().nullable(),
  vatRate: z.string().optional(),
  netAmount: z.number().optional(),
  vatAmount: z.number().optional(),
  grossAmount: z.number().optional(),
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

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { contractor: true },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Serialize Decimal objects
    const serializedExpense = {
      ...expense,
      netAmount: Number(expense.netAmount),
      vatAmount: Number(expense.vatAmount),
      grossAmount: Number(expense.grossAmount),
    }

    return NextResponse.json(serializedExpense)
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
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

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type')
    let expenseData: any
    let attachmentPath: string | null = null

    // Sprawdź czy to FormData (z załącznikiem) czy JSON
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      
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
        
        const uploadsDir = join(process.cwd(), 'uploads', 'expenses')
        await mkdir(uploadsDir, { recursive: true })
        
        const timestamp = Date.now()
        const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filename = `${timestamp}_${sanitizedName}`
        const filepath = join(uploadsDir, filename)
        
        await writeFile(filepath, buffer)
        attachmentPath = `expenses/${filename}`
      }
    } else {
      expenseData = await request.json()
    }

    const validatedData = updateExpenseSchema.parse(expenseData)

    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...(validatedData.date && { date: new Date(validatedData.date) }),
        ...(validatedData.issueDate !== undefined && { 
          issueDate: validatedData.issueDate ? new Date(validatedData.issueDate) : null 
        }),
        ...(validatedData.saleDate !== undefined && { 
          saleDate: validatedData.saleDate ? new Date(validatedData.saleDate) : null 
        }),
        ...(validatedData.docNumber !== undefined && { docNumber: validatedData.docNumber || null }),
        ...(validatedData.category !== undefined && { category: validatedData.category || null }),
        ...(validatedData.contractorId !== undefined && { contractorId: validatedData.contractorId || null }),
        ...(validatedData.contractorName !== undefined && { contractorName: validatedData.contractorName || null }),
        ...(validatedData.contractorNIP !== undefined && { contractorNIP: validatedData.contractorNIP || null }),
        ...(validatedData.contractorAddress !== undefined && { contractorAddress: validatedData.contractorAddress || null }),
        ...(validatedData.vatRate !== undefined && { vatRate: validatedData.vatRate }),
        ...(validatedData.netAmount !== undefined && { netAmount: validatedData.netAmount }),
        ...(validatedData.vatAmount !== undefined && { vatAmount: validatedData.vatAmount }),
        ...(validatedData.grossAmount !== undefined && { grossAmount: validatedData.grossAmount }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
        ...(attachmentPath && { attachmentPath }),
      },
      include: {
        contractor: true,
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
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

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.expense.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


