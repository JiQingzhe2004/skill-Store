'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Store, LogIn, UserPlus, LogOut, LayoutDashboard, User, Settings, ChevronDown, Boxes, Plus, Star, Shield } from 'lucide-react'
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
import { AuthDialog, AuthView } from './auth-dialog'
import { apiRequest } from '../lib/api'

type NavUser = {
  username: string
  email?: string
  role?: string
  avatar?: string | null
} | null

type SiteNavProps = {
  user?: NavUser
  /** 如果通过 URL 参数传入要打开的认证弹窗视图 */
  initialAuthView?: AuthView | null
  initialAuthEmail?: string
}

export function SiteNav({ user = null, initialAuthView = null, initialAuthEmail = '' }: SiteNavProps) {
  const router = useRouter()
  const pathname = usePathname()
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
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 px-6 py-3.5 flex items-center justify-between bg-background/75 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 font-semibold text-base tracking-tight hover:opacity-80 transition-opacity">
          <Store className="w-4 h-4" />
          Skill Store
        </Link>
        <nav className="hidden sm:flex items-center gap-1 ml-6">
          <Button
            variant={pathname.startsWith('/skills') ? 'secondary' : 'ghost'}
            size="sm"
            asChild
            className={pathname.startsWith('/skills') ? 'font-medium' : ''}
          >
            <Link href="/skills">技能市场</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2 ml-auto">
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
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">管理后台</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    控制台
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/skills">
                    <Boxes className="mr-2 h-4 w-4" />
                    我的技能
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/skills/new">
                    <Plus className="mr-2 h-4 w-4" />
                    创建技能
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/stars">
                    <Star className="mr-2 h-4 w-4" />
                    我的星标
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    账号设置
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {loggingOut ? '退出中...' : '退出登录'}
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
                登录
              </Button>
              <Button size="sm" onClick={() => openAuth('register')}>
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                注册
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
