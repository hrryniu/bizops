'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '@/lib/i18n'

type Locale = 'pl-PL' | 'en-US' | 'de-DE' | 'it-IT' | 'es-ES' | 'uk-UA'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export function LanguageProvider({
  children,
  initialLocale = 'pl-PL',
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale)
    
    // Save to backend
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'language',
          data: { locale: newLocale },
        }),
      })
    } catch (error) {
      console.error('Failed to save language preference:', error)
    }
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[locale]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

