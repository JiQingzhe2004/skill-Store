import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Boxes, Shield } from 'lucide-react'
import { fetchCurrentUser } from '../../../lib/server-auth'
import { SiteNav } from '../../../components/site-nav'
import { getMessages, type Locale } from '../../../messages'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const m = getMessages(locale as Locale)
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  if (!user) redirect('/?auth=login')
  if (user.role !== 'ADMIN') redirect('/dashboard')

  const navItems = [
    { href: `/${locale}/admin`, label: m.admin.navOverview, icon: LayoutDashboard },
    { href: `/${locale}/admin/users`, label: m.admin.navUsers, icon: Users },
    { href: `/${locale}/admin/skills`, label: m.admin.navSkills, icon: Boxes },
  ]

  return (
    <>
      <SiteNav user={user} />
      <div className="min-h-screen pt-14 flex">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-border/50 py-6 px-3 hidden md:block">
          <div className="flex items-center gap-2 px-2 mb-6">
            <Shield className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold">{m.admin.backend}</span>
          </div>
          <nav className="grid gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        {/* Main */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </>
  )
}
