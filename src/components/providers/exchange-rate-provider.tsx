'use client'

import { useEffect } from 'react'

/**
 * Exchange Rate Provider
 * 
 * Automatically fetches and caches exchange rates on app load
 * Runs in the background without blocking UI
 */
export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fetch exchange rates on mount
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/exchange-rates/refresh', {
          method: 'POST',
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('[Exchange Rates] Initialized:', data.rates)
        }
      } catch (error) {
        console.error('[Exchange Rates] Failed to initialize:', error)
        // Silently fail - app will use fallback rates
      }
    }
    
    fetchRates()
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000) // 1 hour
    
    return () => clearInterval(interval)
  }, [])
  
  return <>{children}</>
}






