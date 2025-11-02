/**
 * Tax API - Calculate Taxes
 * POST /api/tax/calculate - Calculate taxes for a period
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TaxCalculatorService, type TaxCalculationInput } from '@/lib/services/tax-calculator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: TaxCalculationInput = {
      userId: session.user.id,
      periodType: body.periodType,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      businessType: body.businessType,
      taxForm: body.taxForm,
    }

    const calculator = new TaxCalculatorService()
    const result = await calculator.calculateTaxes(input)
    
    // Save calculation
    const saved = await calculator.saveCalculation(input, result)

    return NextResponse.json({
      ...result,
      calculationId: saved.id,
    })
  } catch (error: any) {
    console.error('Tax calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate taxes' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const periodType = searchParams.get('periodType') as any
    const date = searchParams.get('date')

    const calculator = new TaxCalculatorService()
    const summary = await calculator.getSummary(
      session.user.id,
      periodType || 'MONTHLY',
      date ? new Date(date) : new Date()
    )

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('Tax summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get tax summary' },
      { status: 500 }
    )
  }
}











