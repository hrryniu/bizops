import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsCompanyForm } from '@/components/settings/settings-company-form'
import { SettingsTaxForm } from '@/components/settings/settings-tax-form'
import { SettingsInvoiceForm } from '@/components/settings/settings-invoice-form'
import { SettingsAppearanceForm } from '@/components/settings/settings-appearance-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return <div>Brak autoryzacji</div>
  }
  
  const userId = session.user.id

  const settings = await prisma.settings.findUnique({
    where: { userId },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ustawienia</h1>
        <p className="text-muted-foreground">Zarządzaj konfiguracją aplikacji</p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Dane firmy</TabsTrigger>
          <TabsTrigger value="invoices">Faktury</TabsTrigger>
          <TabsTrigger value="tax">Podatki i kalendarz</TabsTrigger>
          <TabsTrigger value="export">Eksport/Import</TabsTrigger>
          <TabsTrigger value="appearance">Wygląd</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Dane firmy</CardTitle>
              <CardDescription>
                Podstawowe informacje o Twojej działalności
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsCompanyForm settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia faktur</CardTitle>
              <CardDescription>
                Konfiguracja wyglądu i szablonów faktur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsInvoiceForm settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Podatki i kalendarz</CardTitle>
              <CardDescription>
                Konfiguracja stawek VAT i terminów podatkowych
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsTaxForm settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Eksport i Import</CardTitle>
              <CardDescription>
                Tworzenie kopii zapasowych danych
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Funkcje eksportu i importu zostały przeniesione do osobnej strony.
                </p>
                <Link href="/settings/export-import">
                  <Button>Przejdź do Eksport/Import</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Wygląd aplikacji</CardTitle>
              <CardDescription>
                Dostosuj wygląd aplikacji do swoich preferencji
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsAppearanceForm settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
