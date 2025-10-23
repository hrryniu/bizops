/**
 * KPI API - Get KPI Trends
 * GET /api/kpi/trends - Get historical KPI data for charts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getKPIChartData } from '@/lib/services/kpi-calculator'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const months = parseInt(searchParams.get('months') || '6')

    const data = await getKPIChartData(session.user.id, months)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('KPI trends error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get KPI trends' },
      { status: 500 }
    )
  }
}


