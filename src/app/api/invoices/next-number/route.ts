import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Oblicz daty początku i końca miesiąca
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Znajdź wszystkie faktury w tym miesiącu
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: session.user.id,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        number: true,
      },
    })

    // Ekstraktuj numery faktur, które pasują do formatu FV/X/MM/YYYY
    const monthStr = month.toString().padStart(2, '0')
    const pattern = new RegExp(`^FV/(\\d+)/${monthStr}/${year}$`)
    
    const numbers = invoices
      .map(inv => {
        const match = inv.number.match(pattern)
        return match ? parseInt(match[1]) : 0
      })
      .filter(num => num > 0)

    // Znajdź najwyższy numer i dodaj 1
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
    const nextNumber = maxNumber + 1

    return NextResponse.json({ nextNumber })
  } catch (error) {
    console.error('Error generating next invoice number:', error)
    return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 })
  }
}

