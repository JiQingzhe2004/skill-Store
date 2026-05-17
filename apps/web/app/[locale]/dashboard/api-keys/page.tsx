import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ArrowLeft, Key } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { fetchCurrentUser } from '../../../../lib/server-auth'
import { serverApiRequest } from '../../../../lib/server-api'
import { getMessages, type Locale } from '../../../../messages'
import { ApiKeysManager, type ApiClientItem } from './api-keys-manager'

export default async function ApiKeysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const m = getMessages(locale as Locale)
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  if (!user) redirect('/?auth=login')

  const res = await serverApiRequest<ApiClientItem[]>('/api-clients', { host, cookieHeader })
  const items = res.success && res.data ? res.data : []

  return (
    <>
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/dashboard`}><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Key className="w-5 h-5" />{m.apiKeysPage.title}
              </h1>
              <p className="text-xs text-muted-foreground">{m.apiKeysPage.subtitle}</p>
            </div>
          </div>
          <ApiKeysManager initialItems={items} />
        </div>
      </main>
    </>
  )
}
