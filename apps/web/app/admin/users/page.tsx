import { cookies, headers } from 'next/headers'
import { Search, Shield, User } from 'lucide-react'
import { serverApiRequest } from '../../../lib/server-api'
import { Badge } from '../../../components/ui/badge'
import { AdminUserActions } from './user-actions'

type AdminUser = {
  id: string
  email: string
  username: string
  role: string
  isEmailVerified: boolean
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

type Props = { searchParams: Promise<{ page?: string; q?: string }> }

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const qs = new URLSearchParams()
  if (params.page) qs.set('page', params.page)
  if (params.q) qs.set('q', params.q)

  const res = await serverApiRequest<UsersResponse>(`/admin/users?${qs}`, { host, cookieHeader })
  const data = res.success && res.data ? res.data : { items: [], total: 0, page: 1, pageSize: 20 }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {data.total} 位用户</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border/60">
              <th className="text-left px-4 py-3 font-medium">用户</th>
              <th className="text-left px-4 py-3 font-medium">邮箱</th>
              <th className="text-left px-4 py-3 font-medium">角色</th>
              <th className="text-left px-4 py-3 font-medium">技能数</th>
              <th className="text-left px-4 py-3 font-medium">注册时间</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(user => (
              <tr key={user.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {user.avatar
                        ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                        : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {user.role === 'ADMIN' ? '管理员' : '用户'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user._count.skills}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminUserActions userId={user.id} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
