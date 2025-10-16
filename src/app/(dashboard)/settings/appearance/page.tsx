'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Save, ArrowLeft, Palette, Monitor, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useAppearance } from '@/components/providers/appearance-provider'

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  primaryColor: string
  accentColor: string
  layout: 'compact' | 'comfortable' | 'spacious'
}

export default function AppearanceSettingsPage() {
  const { toast } = useToast()
  const { settings: appearanceSettings, updateSettings: updateAppearanceSettings } = useAppearance()
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: appearanceSettings.theme,
    primaryColor: appearanceSettings.primaryColor,
    accentColor: appearanceSettings.accentColor,
    layout: appearanceSettings.layout,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSettings({
      theme: appearanceSettings.theme,
      primaryColor: appearanceSettings.primaryColor,
      accentColor: appearanceSettings.accentColor,
      layout: appearanceSettings.layout,
    })
  }, [appearanceSettings])

  const themeOptions = [
    { value: 'light', label: 'Jasny', icon: Sun, description: 'Jasny motyw kolorystyczny' },
    { value: 'dark', label: 'Ciemny', icon: Moon, description: 'Ciemny motyw kolorystyczny' },
    { value: 'system', label: 'Systemowy', icon: Monitor, description: 'Zgodny z systemem' },
  ]

  const colorOptions = [
    { value: 'blue', label: 'Niebieski', color: 'bg-blue-500', description: 'Profesjonalny i zaufany' },
    { value: 'green', label: 'Zielony', color: 'bg-green-500', description: 'Ekologiczny i świeży' },
    { value: 'purple', label: 'Fioletowy', color: 'bg-purple-500', description: 'Kreatywny i innowacyjny' },
    { value: 'red', label: 'Czerwony', color: 'bg-red-500', description: 'Dynamiczny i energiczny' },
    { value: 'orange', label: 'Pomarańczowy', color: 'bg-orange-500', description: 'Przyjazny i ciepły' },
    { value: 'teal', label: 'Morski', color: 'bg-teal-500', description: 'Spokojny i zrównoważony' },
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
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Powrót
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8" />
            Wygląd
          </h1>
          <p className="text-muted-foreground">Dostosuj wygląd aplikacji do swoich preferencji</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Motyw kolorystyczny */}
        <Card>
          <CardHeader>
            <CardTitle>Motyw kolorystyczny</CardTitle>
            <CardDescription>Wybierz motyw kolorystyczny aplikacji</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((theme) => {
                const Icon = theme.icon
                return (
                  <div
                    key={theme.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      settings.theme === theme.value
                        ? 'border-blue-500 bg-blue-50'
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
          </CardContent>
        </Card>

        {/* Główny kolor */}
        <Card>
          <CardHeader>
            <CardTitle>Główny kolor</CardTitle>
            <CardDescription>Wybierz główny kolor interfejsu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {colorOptions.map((color) => (
                <div
                  key={color.value}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    settings.primaryColor === color.value
                      ? 'border-blue-500 bg-blue-50'
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
          </CardContent>
        </Card>

        {/* Kolor akcentu */}
        <Card>
          <CardHeader>
            <CardTitle>Kolor akcentu</CardTitle>
            <CardDescription>Wybierz kolor dla elementów interaktywnych</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {colorOptions.map((color) => (
                <div
                  key={color.value}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    settings.accentColor === color.value
                      ? 'border-blue-500 bg-blue-50'
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
          </CardContent>
        </Card>

        {/* Układ */}
        <Card>
          <CardHeader>
            <CardTitle>Układ interfejsu</CardTitle>
            <CardDescription>Dostosuj gęstość elementów interfejsu</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
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

