import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { fetchCurrentUser } from '../../lib/server-auth'
import { LogoutButton } from './logout-button'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'

  const user = await fetchCurrentUser({
    host,
    cookieHeader: cookieStore.toString(),
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="page-shell">
      <section className="dashboard-card">
        <h1>欢迎回来</h1>
        <p>认证链路已经打通，这里是第一轮的最小受保护页面。</p>

        <div className="dashboard-list">
          <div className="dashboard-item">
            <strong>用户 ID：</strong> {user.id}
          </div>
          <div className="dashboard-item">
            <strong>邮箱：</strong> {user.email}
          </div>
          <div className="dashboard-item">
            <strong>用户名：</strong> {user.username}
          </div>
          <div className="dashboard-item">
            <strong>角色：</strong> {user.role}
          </div>
          <div className="dashboard-item">
            <strong>邮箱状态：</strong> {user.isEmailVerified ? '已验证' : '未验证'}
          </div>
        </div>

        <LogoutButton />
      </section>
    </main>
  )
}
