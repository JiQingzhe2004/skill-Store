import Link from 'next/link'
import { headers, cookies } from 'next/headers'
import { Boxes, Download, Share2, Sparkles, LayoutDashboard, Store, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { SiteNav } from '../../components/site-nav'
import { HeroAnimated, FeaturesAnimated } from '../../components/home-animations'
import { HeroBackground } from '../../components/hero-background'
import { fetchCurrentUser } from '../../lib/server-auth'
import { getMessages, type Locale } from '../../messages'
import type { AuthView } from '../../components/auth-dialog'

const validAuthViews: AuthView[] = ['login', 'register']

type HomePageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ auth?: string; email?: string }>
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params
  const headersList = await headers()
  const cookieStore = await cookies()
  const host = headersList.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()
  const sp = await searchParams

  const user = await fetchCurrentUser({ host, cookieHeader })
  const messages = getMessages(locale as Locale)
  const m = messages.home

  const authView = validAuthViews.includes(sp.auth as AuthView) ? (sp.auth as AuthView) : null
  const authEmail = sp.email ?? ''

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav user={user} initialAuthView={user ? null : authView} initialAuthEmail={authEmail} />

      <main className="relative flex-1 pt-16 overflow-hidden">
        <HeroBackground />

        {/* Hero */}
        <section className="relative z-10 py-32 px-6 text-center">
          <HeroAnimated>
            <div className="relative max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/50 text-xs text-muted-foreground mb-8 backdrop-blur-sm">
                <Sparkles className="w-3 h-3" />
                {messages.home.badge}
              </div>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
                {m.title}
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                {m.description}
              </p>

              <div className="flex gap-3 justify-center flex-wrap">
                <Button size="lg" asChild className="group transition-all duration-200 hover:shadow-md">
                  <Link href={`/${locale}/skills`}>
                    <Store className="w-4 h-4 mr-2" />
                    {m.ctaBrowse}
                    <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                {user ? (
                  <Button size="lg" variant="outline" asChild className="transition-all duration-200 hover:shadow-sm">
                    <Link href={`/${locale}/dashboard`}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {m.ctaDashboard}
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" asChild className="transition-all duration-200 hover:shadow-sm">
                    <Link href={`/${locale}?auth=register`}>
                      <Share2 className="w-4 h-4 mr-2" />
                      {m.ctaPublish}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </HeroAnimated>
        </section>

        {/* Features */}
        <section className="relative z-10 py-20 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">{m.featureTitle}</h2>
            <p className="text-muted-foreground text-sm">{m.featureSubtitle}</p>
          </div>

          <FeaturesAnimated cards={[
            { icon: <Boxes className="w-5 h-5" />, title: m.feature1Title, desc: m.feature1Desc },
            { icon: <Download className="w-5 h-5" />, title: m.feature2Title, desc: m.feature2Desc },
            { icon: <Share2 className="w-5 h-5" />, title: m.feature3Title, desc: m.feature3Desc },
          ]} />
        </section>
      </main>

      <footer className="border-t border-border/50 px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skill Store
      </footer>
    </div>
  )
}
