import Link from 'next/link'
import { headers, cookies } from 'next/headers'
import { Boxes, Download, Share2, Sparkles, LogIn, UserPlus, LayoutDashboard, Store } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ThemeToggle } from '../components/theme-toggle'
import { fetchCurrentUser } from '../lib/server-auth'
import { messages } from '../messages'

export default async function HomePage() {
  const headersList = await headers()
  const cookieStore = await cookies()
  const host = headersList.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  const m = messages.home

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Store className="w-5 h-5" />
          Skill Store
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Button asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {m.ctaDashboard}
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  登录
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  注册
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 pt-16">
        <section className="py-24 px-6 text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-6">{m.title}</h1>
          <p className="text-muted-foreground text-lg mb-10">{m.description}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <Link href="/skills">
                <Store className="w-4 h-4 mr-2" />
                {m.ctaBrowse}
              </Link>
            </Button>
            {user ? (
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  {m.ctaDashboard}
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">
                  <Share2 className="w-4 h-4 mr-2" />
                  {m.ctaPublish}
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">{m.featureTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Boxes className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">{m.feature1Title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{m.feature1Desc}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">{m.feature2Title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{m.feature2Desc}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">{m.feature3Title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{m.feature3Desc}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Skill Store
      </footer>
    </div>
  )
}
