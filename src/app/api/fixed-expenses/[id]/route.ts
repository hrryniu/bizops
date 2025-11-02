/**
 * 💰 Fixed Expenses API - Single Item Operations
 * 
 * GET /api/fixed-expenses/[id] - Get single fixed expense
 * PATCH /api/fixed-expenses/[id] - Update fixed expense
 * DELETE /api/fixed-expenses/[id] - Delete fixed expense
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  createFixedExpenseEvent,
  updateFixedExpenseEvent,
  deleteFixedExpenseEvent,
} from '@/lib/services/google-calendar'

// Validation schema for updates
const updateFixedExpenseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  category: z.string().min(1).optional(),
  recurrence: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  isActive: z.boolean().optional(),
  syncWithCalendar: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

/**
 * GET /api/fixed-expenses/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      )
    }

    const fixedExpense = await prisma.fixedExpense.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!fixedExpense) {
      return NextResponse.json(
        { error: 'Nie znaleziono wydatku' },
        { status: 404 }
      )
    }

    // Check ownership
    if (fixedExpense.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    return NextResponse.json(fixedExpense)
  } catch (error) {
    console.error('Failed to fetch fixed expense:', error)
    return NextResponse.json(
      { error: 'Nie udało się pobrać wydatku' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/fixed-expenses/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      )
    }

    // Check if expense exists and user owns it
    const existingExpense = await prisma.fixedExpense.findUnique({
      where: { id: params.id },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Nie znaleziono wydatku' },
        { status: 404 }
      )
    }

    if (existingExpense.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = updateFixedExpenseSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Błędne dane wejściowe',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Update fixed expense
    const updatedExpense = await prisma.fixedExpense.update({
      where: { id: params.id },
      data,
    })

    // Handle calendar sync changes
    if (data.syncWithCalendar !== undefined) {
      try {
        if (data.syncWithCalendar && !existingExpense.calendarEventId) {
          // Create new calendar event
          const calendarEventId = await createFixedExpenseEvent(
            session.user.id,
            updatedExpense
          )
          await prisma.fixedExpense.update({
            where: { id: params.id },
            data: { calendarEventId },
          })
          updatedExpense.calendarEventId = calendarEventId
        } else if (data.syncWithCalendar && existingExpense.calendarEventId) {
          // Update existing calendar event
          await updateFixedExpenseEvent(session.user.id, updatedExpense)
        } else if (!data.syncWithCalendar && existingExpense.calendarEventId) {
          // Delete calendar event
          await deleteFixedExpenseEvent(session.user.id, existingExpense.calendarEventId)
          await prisma.fixedExpense.update({
            where: { id: params.id },
            data: { calendarEventId: null },
          })
          updatedExpense.calendarEventId = null
        }
      } catch (error) {
        console.error('Failed to sync calendar event:', error)
        // Continue anyway - expense was updated
      }
    } else if (existingExpense.calendarEventId) {
      // If expense has calendar event but syncWithCalendar wasn't changed,
      // update the event with new data
      try {
        await updateFixedExpenseEvent(session.user.id, updatedExpense)
      } catch (error) {
        console.error('Failed to update calendar event:', error)
      }
    }

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Failed to update fixed expense:', error)
    return NextResponse.json(
      { error: 'Nie udało się zaktualizować wydatku' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/fixed-expenses/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      )
    }

    // Check if expense exists and user owns it
    const existingExpense = await prisma.fixedExpense.findUnique({
      where: { id: params.id },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Nie znaleziono wydatku' },
        { status: 404 }
      )
    }

    if (existingExpense.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    // If has calendar event, delete it from calendar
    if (existingExpense.calendarEventId) {
      try {
        await deleteFixedExpenseEvent(session.user.id, existingExpense.calendarEventId)
      } catch (error) {
        console.error('Failed to delete calendar event:', error)
        // Continue anyway
      }
    }

    // Delete fixed expense
    await prisma.fixedExpense.delete({
      where: { id: params.id },
    })

    return NextResponse.json(
      { message: 'Wydatek usunięty pomyślnie' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to delete fixed expense:', error)
    return NextResponse.json(
      { error: 'Nie udało się usunąć wydatku' },
      { status: 500 }
    )
  }
}

