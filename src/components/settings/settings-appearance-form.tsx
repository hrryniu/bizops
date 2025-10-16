'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Save, Monitor, Sun, Moon, Globe, Sparkles, Zap, Grid3X3 } from 'lucide-react'
import { useAppearance } from '@/components/providers/appearance-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { languageNames } from '@/lib/i18n'

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system' | 'premium' | 'premium-hud' | 'premium-datagrid'
  primaryColor: string
  accentColor: string
  layout: 'compact' | 'comfortable' | 'spacious'
}

interface SettingsAppearanceFormProps {
  settings: {
    theme?: string
    primaryColor?: string
    accentColor?: string
    layout?: string
  } | null
}

export function SettingsAppearanceForm({ settings: initialSettings }: SettingsAppearanceFormProps) {
  const { toast } = useToast()
  const { settings: appearanceSettings, updateSettings: updateAppearanceSettings } = useAppearance()
  const { locale, setLocale } = useLanguage()
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: (initialSettings?.theme as any) || appearanceSettings.theme,
    primaryColor: initialSettings?.primaryColor || appearanceSettings.primaryColor,
    accentColor: initialSettings?.accentColor || appearanceSettings.accentColor,
    layout: (initialSettings?.layout as any) || appearanceSettings.layout,
  })
  const [isLoading, setIsLoading] = useState(false)

  const themeOptions = [
    { value: 'light', label: 'Jasny', icon: Sun, description: 'Jasny motyw kolorystyczny' },
    { value: 'dark', label: 'Ciemny', icon: Moon, description: 'Ciemny motyw kolorystyczny' },
    { value: 'system', label: 'Systemowy', icon: Monitor, description: 'Zgodny z systemem' },
    { value: 'premium', label: 'Premium', icon: Sparkles, description: 'Futurystyczny motyw z efektami neonowymi' },
    { value: 'premium-hud', label: 'Premium HUD', icon: Zap, description: 'Futurystyczny interfejs HUD z geometrycznymi kształtami' },
    { value: 'premium-datagrid', label: 'Premium DataGrid', icon: Grid3X3, description: 'Futurystyczna siatka danych z wireframe' },
  ]

  const colorOptions = [
    { value: 'blue', label: 'Niebieski', color: 'bg-blue-500', description: 'Profesjonalny i zaufany' },
    { value: 'green', label: 'Zielony', color: 'bg-green-500', description: 'Ekologiczny i świeży' },
    { value: 'purple', label: 'Fioletowy', color: 'bg-purple-500', description: 'Kreatywny i innowacyjny' },
    { value: 'red', label: 'Czerwony', color: 'bg-red-500', description: 'Dynamiczny i energiczny' },
    { value: 'orange', label: 'Pomarańczowy', color: 'bg-orange-500', description: 'Przyjazny i ciepły' },
    { value: 'teal', label: 'Morski', color: 'bg-teal-500', description: 'Spokojny i zrównoważony' },
    { value: 'cyan', label: 'Cyjan', color: 'bg-cyan-500', description: 'Futurystyczny i nowoczesny' },
    { value: 'neon', label: 'Neon', color: 'bg-green-400', description: 'Jaskrawy i elektryczny' },
    { value: 'electric', label: 'Elektryczny', color: 'bg-sky-400', description: 'Elektryczny błękit' },
    { value: 'plasma', label: 'Plazma', color: 'bg-orange-400', description: 'Pomarańcz plazmowy' },
    { value: 'cyber', label: 'Cyber', color: 'bg-violet-400', description: 'Cybernetyczny fiolet' },
    { value: 'matrix', label: 'Matrix', color: 'bg-emerald-400', description: 'Zielony Matrix' },
    { value: 'hologram', label: 'Hologram', color: 'bg-white', description: 'Biały hologram' },
  ]

  const layoutOptions = [
    { value: 'compact', label: 'Kompaktowy', description: 'Mniej odstępów, więcej treści' },
    { value: 'comfortable', label: 'Komfortowy', description: 'Zbalansowane odstępy' },
    { value: 'spacious', label: 'Przestronny', description: 'Więcej białej przestrzeni' },
  ]

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // Update local appearance immediately
      updateAppearanceSettings(settings)
      
      // Save to database
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'appearance',
          data: settings,
        }),
      })

      if (!response.ok) {
        throw new Error('Błąd podczas zapisywania ustawień')
      }

      toast({
        title: 'Ustawienia zapisane',
        description: 'Ustawienia wyglądu zostały pomyślnie zaktualizowane.',
      })
    } catch (error) {
      console.error('Error saving appearance settings:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się zapisać ustawień. Spróbuj ponownie.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Motyw kolorystyczny */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Motyw kolorystyczny</h3>
          <p className="text-sm text-muted-foreground">Wybierz motyw kolorystyczny aplikacji</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {themeOptions.map((theme) => {
            const Icon = theme.icon
            return (
              <div
                key={theme.value}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  settings.theme === theme.value
                    ? theme.value === 'premium'
                      ? 'border-cyan-400 bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-lg shadow-cyan-500/25'
                      : theme.value === 'premium-hud'
                      ? 'border-orange-400 bg-gradient-to-br from-gray-900 to-black text-white shadow-lg shadow-orange-500/25'
                      : theme.value === 'premium-datagrid'
                      ? 'border-white bg-gradient-to-br from-gray-900 to-black text-white shadow-lg shadow-white/25'
                      : 'border-blue-500 bg-blue-50'
                    : theme.value === 'premium'
                    ? 'border-gray-600 hover:border-cyan-400 bg-gradient-to-br from-slate-800 to-blue-800 text-white'
                    : theme.value === 'premium-hud'
                    ? 'border-gray-700 hover:border-orange-400 bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                    : theme.value === 'premium-datagrid'
                    ? 'border-gray-700 hover:border-white bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSettings(prev => ({ ...prev, theme: theme.value as any }))}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-semibold">{theme.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Główny kolor */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Główny kolor</h3>
          <p className="text-sm text-muted-foreground">Wybierz główny kolor interfejsu</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-13 gap-4">
          {colorOptions.map((color) => (
            <div
              key={color.value}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                settings.primaryColor === color.value
                  ? (color.value === 'cyan' || color.value === 'neon' || color.value === 'electric' || color.value === 'plasma' || color.value === 'cyber' || color.value === 'matrix' || color.value === 'hologram')
                    ? color.value === 'plasma' || color.value === 'cyber' || color.value === 'matrix'
                      ? 'border-orange-400 bg-gradient-to-br from-gray-900 to-black text-white shadow-lg shadow-orange-500/25'
                      : color.value === 'hologram'
                      ? 'border-white bg-gradient-to-br from-gray-900 to-black text-white shadow-lg shadow-white/25'
                      : 'border-cyan-400 bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-lg shadow-cyan-500/25'
                    : 'border-blue-500 bg-blue-50'
                  : (color.value === 'cyan' || color.value === 'neon' || color.value === 'electric' || color.value === 'plasma' || color.value === 'cyber' || color.value === 'matrix' || color.value === 'hologram')
                  ? color.value === 'plasma' || color.value === 'cyber' || color.value === 'matrix'
                    ? 'border-gray-700 hover:border-orange-400 bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                    : color.value === 'hologram'
                    ? 'border-gray-700 hover:border-white bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                    : 'border-gray-600 hover:border-cyan-400 bg-gradient-to-br from-slate-800 to-blue-800 text-white'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSettings(prev => ({ ...prev, primaryColor: color.value }))}
            >
              <div className="space-y-3">
                <div className={`w-full h-12 ${color.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{color.label}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{color.label}</h3>
                  <p className="text-xs text-muted-foreground">{color.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kolor akcentu */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Kolor akcentu</h3>
          <p className="text-sm text-muted-foreground">Wybierz kolor dla elementów interaktywnych</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-13 gap-4">
          {colorOptions.map((color) => (
            <div
              key={color.value}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                settings.accentColor === color.value
                  ? (color.value === 'cyan' || color.value === 'neon' || color.value === 'electric' || color.value === 'plasma' || color.value === 'cyber' || color.value === 'matrix' || color.value === 'hologram')
                    ? color.value === 'plasma' || color.value === 'cyber' || color.value === 'matrix'
                      ? 'border-orange-400 bg-gradient-to-br from-gray-900 to-black text-white shadow-lg shadow-orange-500/25'
                      : color.value === 'hologram'
                      ? 'border-white bg-gradient-to-br from-gray-900 to-black text-white shadow-lg shadow-white/25'
                      : 'border-cyan-400 bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-lg shadow-cyan-500/25'
                    : 'border-blue-500 bg-blue-50'
                  : (color.value === 'cyan' || color.value === 'neon' || color.value === 'electric' || color.value === 'plasma' || color.value === 'cyber' || color.value === 'matrix' || color.value === 'hologram')
                  ? color.value === 'plasma' || color.value === 'cyber' || color.value === 'matrix'
                    ? 'border-gray-700 hover:border-orange-400 bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                    : color.value === 'hologram'
                    ? 'border-gray-700 hover:border-white bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                    : 'border-gray-600 hover:border-cyan-400 bg-gradient-to-br from-slate-800 to-blue-800 text-white'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSettings(prev => ({ ...prev, accentColor: color.value }))}
            >
              <div className="space-y-3">
                <div className={`w-full h-12 ${color.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{color.label}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{color.label}</h3>
                  <p className="text-xs text-muted-foreground">{color.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Układ */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Układ interfejsu</h3>
          <p className="text-sm text-muted-foreground">Dostosuj gęstość elementów interfejsu</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {layoutOptions.map((layout) => (
            <div
              key={layout.value}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                settings.layout === layout.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSettings(prev => ({ ...prev, layout: layout.value as any }))}
            >
              <div className="space-y-2">
                <h3 className="font-semibold">{layout.label}</h3>
                <p className="text-sm text-muted-foreground">{layout.description}</p>
                <div className="space-y-1">
                  <div className={`bg-gray-300 rounded h-2 ${layout.value === 'compact' ? 'h-1' : layout.value === 'spacious' ? 'h-3' : 'h-2'}`}></div>
                  <div className={`bg-gray-300 rounded h-2 ${layout.value === 'compact' ? 'h-1' : layout.value === 'spacious' ? 'h-3' : 'h-2'}`}></div>
                  <div className={`bg-gray-300 rounded h-2 ${layout.value === 'compact' ? 'h-1' : layout.value === 'spacious' ? 'h-3' : 'h-2'}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Język */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Język aplikacji</h3>
          <p className="text-sm text-muted-foreground">Wybierz język interfejsu</p>
        </div>
        <div className="flex items-center gap-4">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <Select value={locale} onValueChange={(value) => setLocale(value as any)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languageNames).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </Button>
      </div>
    </div>
  )
}

