/**
 * Cashflow API - Generate Forecast
 * POST /api/cashflow/forecast - Generate cashflow forecast
 * GET /api/cashflow/forecast - Get existing forecast
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateUserForecast, getForecastData } from '@/lib/services/cashflow-forecast'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const months = body.months || 3

    const forecast = await generateUserForecast(session.user.id, months)

    return NextResponse.json(forecast)
  } catch (error: any) {
    console.error('Cashflow forecast error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate forecast' },
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

    const data = await getForecastData(session.user.id)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Cashflow forecast fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get forecast' },
      { status: 500 }
    )
  }
}


