import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { BookOpen, ExternalLink, Key, Lock, Package, Server } from 'lucide-react'
import { SiteNav } from '../../../components/site-nav'
import { Button } from '../../../components/ui/button'
import { fetchCurrentUser } from '../../../lib/server-auth'
import { getMessages, type Locale } from '../../../messages'

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const m = getMessages(locale as Locale).docs
  const nav = getMessages(locale as Locale).nav

  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const user = await fetchCurrentUser({ host, cookieHeader: cookieStore.toString() })

  const endpoints = [m.endpointList, m.endpointDetail, m.endpointManifest]

  return (
    <>
      <SiteNav user={user} />
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-3xl space-y-10">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              {m.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{m.subtitle}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button asChild>
                <a href="/api/docs" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {m.openSwagger}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/docs-json" target="_blank" rel="noopener noreferrer">
                  {m.openApiJson}
                </a>
              </Button>
              {user && (
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/dashboard/api-keys`}>
                    <Key className="w-4 h-4 mr-2" />
                    {m.manageApiKeys}
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{m.swaggerHint}</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              {m.responseTitle}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.responseDesc}</p>
            <pre className="text-xs bg-muted/60 border border-border rounded-lg p-4 overflow-x-auto">
{`{
  "success": true,
  "data": { ... },
  "error": null
}`}
            </pre>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {m.authTitle}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.authDesc}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              {m.apiKeyTitle}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.apiKeyDesc}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium">{m.v1Title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.v1Desc}</p>
            <ul className="text-sm font-mono space-y-1.5 bg-muted/40 border border-border rounded-lg p-4">
              {endpoints.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{m.rateLimitTitle}: {m.rateLimitDesc}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              {m.installTitle}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.installDesc}</p>
          </section>

          <p className="text-xs text-muted-foreground pb-8">
            <Link href={`/${locale}/skills`} className="underline underline-offset-2 hover:text-foreground">
              {nav.skillMarket}
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
