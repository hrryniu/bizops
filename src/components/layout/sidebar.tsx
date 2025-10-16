'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Calendar,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'g d' },
  { name: 'Faktury', href: '/invoices', icon: FileText, shortcut: 'g i' },
  { name: 'Koszty', href: '/expenses', icon: Receipt, shortcut: 'g e' },
  { name: 'Kontrahenci', href: '/contractors', icon: Users, shortcut: 'g k' },
  { name: 'Kalendarz', href: '/calendar', icon: Calendar, shortcut: 'g c' },
  { name: 'Projekty', href: '/projects', icon: FolderKanban, shortcut: 'g p' },
  { name: 'Doradca Podatkowy', href: '/tax-advisor', icon: Bot, shortcut: 'g t' },
  { name: 'Ustawienia', href: '/settings', icon: Settings, shortcut: 'g s' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">BizOps</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Wyloguj
        </Button>
      </div>
    </div>
  )
}

