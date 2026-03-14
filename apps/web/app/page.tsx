import Link from 'next/link'
import { headers, cookies } from 'next/headers'
import { Boxes, Download, Share2, Sparkles, LayoutDashboard, Store, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { SiteNav } from '../components/site-nav'
import { fetchCurrentUser } from '../lib/server-auth'
import { messages } from '../messages'
import type { AuthView } from '../components/auth-dialog'

const validAuthViews: AuthView[] = ['login', 'register', 'forgot-password', 'reset-password', 'verify-email']

type HomePageProps = {
  searchParams: Promise<{ auth?: string; email?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const headersList = await headers()
  const cookieStore = await cookies()
  const host = headersList.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()
  const params = await searchParams

  const user = await fetchCurrentUser({ host, cookieHeader })
  const m = messages.home

  const authView = validAuthViews.includes(params.auth as AuthView) ? (params.auth as AuthView) : null
  const authEmail = params.email ?? ''

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav user={user} initialAuthView={user ? null : authView} initialAuthEmail={authEmail} />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative py-32 px-6 text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
            <div className="w-[600px] h-[400px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2" />
          </div>

          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/50 text-xs text-muted-foreground mb-8 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              AI 技能市场，现已上线
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              {m.title}
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              {m.description}
            </p>

            <div className="flex gap-3 justify-center flex-wrap">
              <Button size="lg" asChild className="group transition-all duration-200 hover:shadow-md">
                <Link href="/skills">
                  <Store className="w-4 h-4 mr-2" />
                  {m.ctaBrowse}
                  <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              {user ? (
                <Button size="lg" variant="outline" asChild className="transition-all duration-200 hover:shadow-sm">
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {m.ctaDashboard}
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild className="transition-all duration-200 hover:shadow-sm">
                  <Link href="/?auth=register">
                    <Share2 className="w-4 h-4 mr-2" />
                    {m.ctaPublish}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">{m.featureTitle}</h2>
            <p className="text-muted-foreground text-sm">简单、开放、高效</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Boxes, title: m.feature1Title, desc: m.feature1Desc },
              { icon: Download, title: m.feature2Title, desc: m.feature2Desc },
              { icon: Share2, title: m.feature3Title, desc: m.feature3Desc },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative rounded-xl border border-border/60 bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-border"
              >
                <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skill Store
      </footer>
    </div>
  )
}
