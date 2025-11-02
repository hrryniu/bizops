/**
 * KPI API - Calculate KPIs
 * POST /api/kpi/calculate - Calculate KPIs for current period
 * GET /api/kpi/calculate - Get current KPI snapshot
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KPICalculatorService } from '@/lib/services/kpi-calculator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const calculator = new KPICalculatorService()
    const snapshot = await calculator.updateCurrentMonthKPIs(session.user.id)

    return NextResponse.json(snapshot)
  } catch (error: any) {
    console.error('KPI calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate KPIs' },
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
    const period = (searchParams.get('period') || 'MONTHLY') as any

    const calculator = new KPICalculatorService()
    const metrics = await calculator.calculateKPIs(session.user.id, period)

    return NextResponse.json(metrics)
  } catch (error: any) {
    console.error('KPI fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get KPIs' },
      { status: 500 }
    )
  }
}











