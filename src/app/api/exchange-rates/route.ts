/**
 * 💱 Exchange Rates API
 * 
 * GET /api/exchange-rates - Get current exchange rates
 * POST /api/exchange-rates/refresh - Refresh rates from NBP API
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchExchangeRates, getAllExchangeRates } from '@/lib/services/exchange-rates'

/**
 * GET /api/exchange-rates
 * Get all current exchange rates
 */
export async function GET(request: NextRequest) {
  try {
    const rates = await getAllExchangeRates()
    
    return NextResponse.json({
      rates,
      source: 'NBP API',
      message: 'Exchange rates fetched successfully'
    })
  } catch (error) {
    console.error('Failed to get exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to get exchange rates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/exchange-rates/refresh
 * Manually refresh exchange rates from NBP API
 */
export async function POST(request: NextRequest) {
  try {
    const rates = await fetchExchangeRates()
    
    return NextResponse.json({
      rates: Object.fromEntries(rates),
      message: 'Exchange rates refreshed successfully'
    })
  } catch (error) {
    console.error('Failed to refresh exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to refresh exchange rates' },
      { status: 500 }
    )
  }
}






