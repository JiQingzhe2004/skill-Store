import { cookies, headers } from 'next/headers'
import { User } from 'lucide-react'
import { serverApiRequest } from '../../../../lib/server-api'
import { Badge } from '../../../../components/ui/badge'
import { AdminUserActions } from './user-actions'
import { getMessages, type Locale } from '../../../../messages'

type AdminUser = {
  id: string
  email: string
  username: string
  role: string
  isEmailVerified: boolean
  isBanned: boolean
  bannedUntil: string | null
  banReason: string | null
  avatar: string | null
  createdAt: string
  _count: { skills: number }
}

type UsersResponse = {
  items: AdminUser[]
  total: number
  page: number
  pageSize: number
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; q?: string }>
}

export default async function AdminUsersPage({ params, searchParams }: Props) {
  const { locale } = await params
  const m = getMessages(locale as Locale)
  const sp = await searchParams
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const qs = new URLSearchParams()
  if (sp.page) qs.set('page', sp.page)
  if (sp.q) qs.set('q', sp.q)

  const res = await serverApiRequest<UsersResponse>(`/admin/users?${qs}`, { host, cookieHeader })
  const data = res.success && res.data ? res.data : { items: [], total: 0, page: 1, pageSize: 20 }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">{m.admin.usersTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{m.admin.usersCount.replace('{count}', String(data.total))}</p>
      </div>
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border/60">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{m.admin.colUser}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{m.admin.colRole}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{m.admin.colStatus}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{m.admin.colSkillCount}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{m.admin.colCreatedAt}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{m.admin.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.items.map(u => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {u.avatar
                        ? <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                        : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.username}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'ADMIN' ? 'default' : 'outline'}>
                    {u.role === 'ADMIN' ? m.admin.roleAdmin : m.admin.roleUser}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {u.isBanned && (!u.bannedUntil || new Date(u.bannedUntil) > new Date())
                    ? <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
                        {u.bannedUntil
                          ? m.admin.statusBannedUntil.replace('{date}', new Date(u.bannedUntil).toLocaleDateString(locale))
                          : m.admin.statusBannedPermanent}
                      </Badge>
                    : <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800">{m.admin.statusNormal}</Badge>}
                </td>
                <td className="px-4 py-3 text-sm">{u._count.skills}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString(locale)}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminUserActions
                    userId={u.id}
                    currentRole={u.role}
                    isBanned={u.isBanned}
                    bannedUntil={u.bannedUntil}
                    locale={locale}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
