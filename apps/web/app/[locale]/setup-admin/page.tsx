import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { SiteNav } from '../../../components/site-nav'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { fetchCurrentUser } from '../../../lib/server-auth'
import { serverApiRequest } from '../../../lib/server-api'
import { getMessages, type Locale } from '../../../messages'
import { SetupAdminForm } from './setup-admin-form'

type SetupStatus = {
  needsSetup: boolean
  setupConfigured: boolean
}

export default async function SetupAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const m = getMessages(locale as Locale).adminSetup
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  if (!user) redirect(`/${locale}?auth=login`)

  if (user.role === 'ADMIN') {
    redirect(`/${locale}/admin`)
  }

  const statusRes = await serverApiRequest<SetupStatus>('/admin/setup/status', { host, cookieHeader })
  const status = statusRes.success && statusRes.data ? statusRes.data : { needsSetup: true, setupConfigured: false }

  if (!status.needsSetup) {
    return (
      <>
        <SiteNav user={user} />
        <main className="min-h-screen px-4 py-10 pt-24">
          <div className="mx-auto max-w-lg">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5" />
                  {m.hasAdminTitle}
                </CardTitle>
                <CardDescription>{m.hasAdminDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/dashboard`}>{getMessages(locale as Locale).common.back}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <SiteNav user={user} />
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-lg">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-destructive" />
                {m.title}
              </CardTitle>
              <CardDescription>{m.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <SetupAdminForm locale={locale} setupConfigured={status.setupConfigured} />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
