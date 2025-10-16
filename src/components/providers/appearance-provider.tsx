'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system' | 'premium' | 'premium-hud' | 'premium-datagrid'
  primaryColor: string
  accentColor: string
  layout: 'compact' | 'comfortable' | 'spacious'
}

interface AppearanceContextType {
  settings: AppearanceSettings
  updateSettings: (settings: Partial<AppearanceSettings>) => void
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined)

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider')
  }
  return context
}

const colorMap: Record<string, Record<string, string>> = {
  blue: {
    primary: '219 88% 52%', // hsl values for Tailwind
    'primary-foreground': '0 0% 100%',
    accent: '219 88% 52%',
    'accent-foreground': '0 0% 100%',
  },
  green: {
    primary: '142 71% 45%',
    'primary-foreground': '0 0% 100%',
    accent: '142 71% 45%',
    'accent-foreground': '0 0% 100%',
  },
  purple: {
    primary: '271 76% 53%',
    'primary-foreground': '0 0% 100%',
    accent: '271 76% 53%',
    'accent-foreground': '0 0% 100%',
  },
  red: {
    primary: '0 72% 51%',
    'primary-foreground': '0 0% 100%',
    accent: '0 72% 51%',
    'accent-foreground': '0 0% 100%',
  },
  orange: {
    primary: '25 95% 53%',
    'primary-foreground': '0 0% 100%',
    accent: '25 95% 53%',
    'accent-foreground': '0 0% 100%',
  },
  teal: {
    primary: '173 58% 39%',
    'primary-foreground': '0 0% 100%',
    accent: '173 58% 39%',
    'accent-foreground': '0 0% 100%',
  },
  cyan: {
    primary: '188 100% 50%',
    'primary-foreground': '0 0% 100%',
    accent: '188 100% 50%',
    'accent-foreground': '0 0% 100%',
  },
  neon: {
    primary: '120 100% 50%',
    'primary-foreground': '0 0% 100%',
    accent: '120 100% 50%',
    'accent-foreground': '0 0% 100%',
  },
  electric: {
    primary: '200 100% 60%',
    'primary-foreground': '0 0% 100%',
    accent: '200 100% 60%',
    'accent-foreground': '0 0% 100%',
  },
  plasma: {
    primary: '30 100% 60%',
    'primary-foreground': '0 0% 100%',
    accent: '30 100% 60%',
    'accent-foreground': '0 0% 100%',
  },
  cyber: {
    primary: '280 100% 70%',
    'primary-foreground': '0 0% 100%',
    accent: '280 100% 70%',
    'accent-foreground': '0 0% 100%',
  },
  matrix: {
    primary: '120 100% 40%',
    'primary-foreground': '0 0% 100%',
    accent: '120 100% 40%',
    'accent-foreground': '0 0% 100%',
  },
  hologram: {
    primary: '0 0% 100%',
    'primary-foreground': '0 0% 0%',
    accent: '0 0% 100%',
    'accent-foreground': '0 0% 0%',
  },
}

const layoutMap = {
  compact: {
    spacing: '0.75rem',
    fontSize: '0.875rem',
  },
  comfortable: {
    spacing: '1rem',
    fontSize: '1rem',
  },
  spacious: {
    spacing: '1.5rem',
    fontSize: '1rem',
  },
}

export function AppearanceProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings?: Partial<AppearanceSettings>
}) {
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: initialSettings?.theme || 'system',
    primaryColor: initialSettings?.primaryColor || 'blue',
    accentColor: initialSettings?.accentColor || 'blue',
    layout: initialSettings?.layout || 'comfortable',
  })

  useEffect(() => {
    // Apply theme
    const root = document.documentElement
    const applyTheme = (theme: 'light' | 'dark' | 'system' | 'premium' | 'premium-hud' | 'premium-datagrid') => {
      // Remove all theme classes first
      root.classList.remove('dark', 'premium', 'premium-hud', 'premium-datagrid')
      
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', isDark)
      } else if (theme === 'premium') {
        root.classList.add('premium')
        root.classList.add('dark') // Premium is always dark
      } else if (theme === 'premium-hud') {
        root.classList.add('premium-hud')
        root.classList.add('dark') // Premium HUD is always dark
      } else if (theme === 'premium-datagrid') {
        root.classList.add('premium-datagrid')
        root.classList.add('dark') // Premium DataGrid is always dark
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }

    applyTheme(settings.theme)

    // Listen to system theme changes
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [settings.theme])

  useEffect(() => {
    // Apply colors
    const root = document.documentElement
    const primaryColors = colorMap[settings.primaryColor] || colorMap.blue
    const accentColors = colorMap[settings.accentColor] || colorMap.blue

    // Set CSS variables
    root.style.setProperty('--primary', primaryColors.primary)
    root.style.setProperty('--primary-foreground', primaryColors['primary-foreground'])
    root.style.setProperty('--accent', accentColors.accent)
    root.style.setProperty('--accent-foreground', accentColors['accent-foreground'])
  }, [settings.primaryColor, settings.accentColor])

  useEffect(() => {
    // Apply layout
    const root = document.documentElement
    const layoutSettings = layoutMap[settings.layout]

    root.style.setProperty('--spacing', layoutSettings.spacing)
    root.style.setProperty('--font-size-base', layoutSettings.fontSize)
  }, [settings.layout])

  const updateSettings = (newSettings: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  return (
    <AppearanceContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppearanceContext.Provider>
  )
}

