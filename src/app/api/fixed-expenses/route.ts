/**
 * 💰 Fixed Expenses API - List & Create
 * 
 * GET /api/fixed-expenses - List all fixed expenses
 * POST /api/fixed-expenses - Create new fixed expense
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { createFixedExpenseEvent } from '@/lib/services/google-calendar'

// Validation schema
const fixedExpenseSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(100),
  amount: z.number().positive('Kwota musi być większa niż 0'),
  dueDay: z.number().int().min(1, 'Dzień musi być między 1 a 31').max(31, 'Dzień musi być między 1 a 31'),
  category: z.string().min(1, 'Kategoria jest wymagana'),
  recurrence: z.enum(['monthly', 'quarterly', 'yearly']),
  isActive: z.boolean().default(true),
  syncWithCalendar: z.boolean().default(false),
  notes: z.string().optional().nullable().transform(val => val === '' ? null : val),
})

/**
 * GET /api/fixed-expenses
 * List all fixed expenses for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build query
    const where: any = { userId: session.user.id }
    if (!includeInactive) {
      where.isActive = true
    }

    const fixedExpenses = await prisma.fixedExpense.findMany({
      where,
      orderBy: [
        { dueDay: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(fixedExpenses)
  } catch (error) {
    console.error('Failed to fetch fixed expenses:', error)
    return NextResponse.json(
      { error: 'Nie udało się pobrać stałych wydatków' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/fixed-expenses
 * Create a new fixed expense
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('📥 Received body:', JSON.stringify(body, null, 2))
    
    // Validate input
    const validationResult = fixedExpenseSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { 
          error: 'Błędne dane wejściowe',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Create fixed expense
    const fixedExpense = await prisma.fixedExpense.create({
      data: {
        userId: session.user.id,
        name: data.name,
        amount: data.amount,
        dueDay: data.dueDay,
        category: data.category,
        recurrence: data.recurrence,
        isActive: data.isActive,
        syncWithCalendar: data.syncWithCalendar,
        notes: data.notes || null,
      },
    })

    // If syncWithCalendar is true, create calendar event via Google Calendar API
    if (data.syncWithCalendar) {
      try {
        const calendarEventId = await createFixedExpenseEvent(
          session.user.id,
          fixedExpense
        )
        
        // Update expense with calendar event ID
        await prisma.fixedExpense.update({
          where: { id: fixedExpense.id },
          data: { calendarEventId },
        })
        
        fixedExpense.calendarEventId = calendarEventId
      } catch (error) {
        console.error('Failed to create calendar event:', error)
        // Continue anyway - expense was created, just not synced
      }
    }

    return NextResponse.json(fixedExpense, { status: 201 })
  } catch (error) {
    console.error('Failed to create fixed expense:', error)
    return NextResponse.json(
      { error: 'Nie udało się utworzyć stałego wydatku' },
      { status: 500 }
    )
  }
}

