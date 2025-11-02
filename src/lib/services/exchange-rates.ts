/**
 * 💱 Exchange Rates Service
 * 
 * Fetches current exchange rates from NBP API
 * Caches rates in database for offline access
 */

import { prisma } from '@/lib/db'

interface ExchangeRate {
  currency: string
  rate: number
  date: Date
}

interface NBPRate {
  code: string
  mid: number
}

interface NBPResponse {
  table: string
  no: string
  effectiveDate: string
  rates: NBPRate[]
}

/**
 * Fetch current exchange rates from NBP API
 */
export async function fetchExchangeRates(): Promise<Map<string, number>> {
  try {
    // Fetch rates from NBP API (Narodowy Bank Polski)
    const response = await fetch('https://api.nbp.pl/api/exchangerates/tables/A/?format=json', {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates from NBP')
    }

    const data: NBPResponse[] = await response.json()
    const rates = new Map<string, number>()
    
    // Always add PLN
    rates.set('PLN', 1.0)
    
    // Add all rates from NBP
    if (data[0] && data[0].rates) {
      for (const rate of data[0].rates) {
        rates.set(rate.code, rate.mid)
      }
    }

    console.log('[Exchange Rates] Fetched rates from NBP:', Object.fromEntries(rates))
    
    // Save to cache
    await saveRatesToCache(rates, new Date(data[0].effectiveDate))
    
    return rates
  } catch (error) {
    console.error('[Exchange Rates] Failed to fetch from NBP:', error)
    // Return cached rates as fallback
    return await getCachedRates()
  }
}

/**
 * Get exchange rate for a specific currency
 */
export async function getExchangeRate(currency: string): Promise<number> {
  if (currency === 'PLN') return 1.0
  
  try {
    const rates = await fetchExchangeRates()
    return rates.get(currency) || 1.0
  } catch (error) {
    console.error(`[Exchange Rates] Failed to get rate for ${currency}:`, error)
    return 1.0
  }
}

/**
 * Convert amount from one currency to PLN
 */
export async function convertToPLN(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === 'PLN') return amount
  
  const rate = await getExchangeRate(fromCurrency)
  return amount * rate
}

/**
 * Save exchange rates to cache (database)
 */
async function saveRatesToCache(rates: Map<string, number>, effectiveDate: Date): Promise<void> {
  try {
    // Delete old rates (older than 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    await prisma.exchangeRate.deleteMany({
      where: {
        fetchedAt: {
          lt: sevenDaysAgo
        }
      }
    })
    
    // Save new rates
    const rateRecords = Array.from(rates.entries()).map(([currency, rate]) => ({
      currency,
      rate,
      effectiveDate,
      fetchedAt: new Date(),
    }))
    
    await prisma.exchangeRate.createMany({
      data: rateRecords,
      skipDuplicates: true,
    })
    
    console.log('[Exchange Rates] Saved to cache:', rateRecords.length, 'rates')
  } catch (error) {
    console.error('[Exchange Rates] Failed to save to cache:', error)
  }
}

/**
 * Get cached exchange rates from database
 */
async function getCachedRates(): Promise<Map<string, number>> {
  try {
    // Get most recent rates from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const cachedRates = await prisma.exchangeRate.findMany({
      where: {
        fetchedAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        fetchedAt: 'desc'
      },
      distinct: ['currency'],
    })
    
    const rates = new Map<string, number>()
    rates.set('PLN', 1.0)
    
    for (const rate of cachedRates) {
      rates.set(rate.currency, Number(rate.rate))
    }
    
    console.log('[Exchange Rates] Using cached rates:', Object.fromEntries(rates))
    
    // If no cached rates, return fallback rates
    if (rates.size === 1) {
      console.warn('[Exchange Rates] No cached rates found, using fallback')
      return new Map([
        ['PLN', 1.0],
        ['EUR', 4.30],
        ['USD', 4.00],
        ['GBP', 5.10],
      ])
    }
    
    return rates
  } catch (error) {
    console.error('[Exchange Rates] Failed to get cached rates:', error)
    // Return fallback rates
    return new Map([
      ['PLN', 1.0],
      ['EUR', 4.30],
      ['USD', 4.00],
      ['GBP', 5.10],
    ])
  }
}

/**
 * Get all available exchange rates with their effective dates
 */
export async function getAllExchangeRates(): Promise<ExchangeRate[]> {
  try {
    const rates = await fetchExchangeRates()
    const effectiveDate = new Date()
    
    return Array.from(rates.entries()).map(([currency, rate]) => ({
      currency,
      rate,
      date: effectiveDate,
    }))
  } catch (error) {
    console.error('[Exchange Rates] Failed to get all rates:', error)
    return []
  }
}






