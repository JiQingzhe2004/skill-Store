import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchCurrentUser } from '../../../lib/server-auth'
import { serverApiRequest } from '../../../lib/server-api'
import { SiteNav } from '../../../components/site-nav'
import { SettingsForm } from './settings-form'

type UserProfile = {
  id: string
  email: string
  username: string
  avatar: string | null
  bio: string | null
  role: string
  isEmailVerified: boolean
  createdAt: string
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  if (!user) redirect('/?auth=login')

  const profileRes = await serverApiRequest<UserProfile>('/users/me', { host, cookieHeader })
  const profile = profileRes.success && profileRes.data ? profileRes.data : null

  return (
    <>
      <SiteNav user={user} />
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-semibold mb-6">账号设置</h1>
          <SettingsForm profile={profile} />
        </div>
      </main>
    </>
  )
}
