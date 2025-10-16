import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Sidebar } from '@/components/layout/sidebar'
import { AppearanceProvider } from '@/components/providers/appearance-provider'
import { LanguageProvider } from '@/components/providers/language-provider'
import { LanguageSelector } from '@/components/layout/language-selector'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id },
  })

  return (
    <LanguageProvider initialLocale={(settings?.locale as any) || 'pl-PL'}>
      <AppearanceProvider
        initialSettings={{
          theme: (settings?.theme as any) || 'system',
          primaryColor: settings?.primaryColor || 'blue',
          accentColor: settings?.accentColor || 'blue',
          layout: (settings?.layout as any) || 'comfortable',
        }}
      >
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="border-b bg-card">
              <div className="container mx-auto p-4 flex justify-end">
                <LanguageSelector />
              </div>
            </div>
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </AppearanceProvider>
    </LanguageProvider>
  )
}

