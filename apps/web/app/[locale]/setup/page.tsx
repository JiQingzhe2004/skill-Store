import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { serverApiRequest } from '../../../lib/server-api'
import { SetupWizard } from './setup-wizard'

type SetupStatus = {
  setupComplete: boolean
  hasConfig: boolean
}

export const dynamic = 'force-dynamic'

export default async function SetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'

  const res = await serverApiRequest<SetupStatus>('/setup/status', { host })
  if (res.success && res.data?.setupComplete) {
    redirect(`/${locale}`)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <SetupWizard locale={locale} />
      </div>
    </main>
  )
}
