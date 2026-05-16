'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Store, LogIn, UserPlus, LogOut, LayoutDashboard, User, Settings, ChevronDown, Boxes, Plus, Star, Shield, Key, Package } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ThemeToggle } from './theme-toggle'
import { LanguageSwitcher } from './language-switcher'
import { AuthDialog, AuthView } from './auth-dialog'
import { apiRequest } from '../lib/api'
import { getMessages, type Locale } from '../messages'

type NavUser = {
  username: string
  email?: string
  role?: string
  avatar?: string | null
} | null

type SiteNavProps = {
  user?: NavUser
  initialAuthView?: AuthView | null
  initialAuthEmail?: string
}

function useLocale() {
  const pathname = usePathname()
  const segments = pathname.split('/')
  return segments[1] || 'zh-CN'
}

export function SiteNav({ user = null, initialAuthView = null, initialAuthEmail = '' }: SiteNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const m = getMessages(locale as Locale)
  const [loggingOut, setLoggingOut] = useState(false)
  const [authOpen, setAuthOpen] = useState(!!initialAuthView)
  const [authView, setAuthView] = useState<AuthView>(initialAuthView ?? 'login')

  const openAuth = (view: AuthView) => {
    setAuthView(view)
    setAuthOpen(true)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await apiRequest('/auth/logout', { method: 'POST' })
    router.push(`/${locale}`)
    router.refresh()
  }

  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '')

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 px-6 py-3.5 flex items-center justify-between bg-background/75 backdrop-blur-md">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-semibold text-base tracking-tight hover:opacity-80 transition-opacity">
          <Store className="w-4 h-4" />
          Skill Store
        </Link>
        <nav className="hidden sm:flex items-center gap-1 ml-6">
          <Button
            variant={pathWithoutLocale.startsWith('/skills') ? 'secondary' : 'ghost'}
            size="sm"
            asChild
            className={pathWithoutLocale.startsWith('/skills') ? 'font-medium' : ''}
          >
            <Link href={`/${locale}/skills`}>{m.nav.skillMarket}</Link>
          </Button>
          <Button
            variant={pathWithoutLocale.startsWith('/docs') ? 'secondary' : 'ghost'}
            size="sm"
            asChild
            className={pathWithoutLocale.startsWith('/docs') ? 'font-medium' : ''}
          >
            <Link href={`/${locale}/docs`}>{m.nav.apiDocs}</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2 ml-auto">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                    {user.avatar
                      ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                      : <User className="h-3.5 w-3.5" />}
                  </div>
                  <span className="max-w-[120px] truncate font-medium">{user.username}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user.username}</p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === 'ADMIN' && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={`/${locale}/admin`}>
                        <Shield className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">{m.nav.adminBackend}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/dashboard`}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {m.nav.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/dashboard/skills`}>
                    <Boxes className="mr-2 h-4 w-4" />
                    {m.nav.mySkills}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/dashboard/skills/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {m.nav.createSkill}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/dashboard/stars`}>
                    <Star className="mr-2 h-4 w-4" />
                    {m.nav.myStars}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/dashboard/installs`}>
                    <Package className="mr-2 h-4 w-4" />
                    {m.nav.myInstalls}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/dashboard/api-keys`}>
                    <Key className="mr-2 h-4 w-4" />
                    {m.nav.apiKeys}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/dashboard/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    {m.nav.accountSettings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {loggingOut ? m.nav.loggingOut : m.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                onClick={() => openAuth('login')}
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                {m.nav.login}
              </Button>
              <Button size="sm" onClick={() => openAuth('register')}>
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                {m.nav.register}
              </Button>
            </>
          )}
        </div>
      </header>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultView={authView}
        defaultEmail={initialAuthEmail}
      />
    </>
  )
}
