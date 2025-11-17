/**
 * Tax API - Export Tax Calculation
 * GET /api/tax/export?id=xxx - Export tax calculation as CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TaxCalculatorService } from '@/lib/services/tax-calculator'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const calculationId = searchParams.get('id')

    if (!calculationId) {
      return NextResponse.json({ error: 'Missing calculation ID' }, { status: 400 })
    }

    const calculator = new TaxCalculatorService()
    const csv = await calculator.generateCSV(calculationId)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tax-calculation-${calculationId}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Tax export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export tax calculation' },
      { status: 500 }
    )
  }
}












