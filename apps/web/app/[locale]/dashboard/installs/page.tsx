import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Package, User, Download, Star, ThumbsUp, ArrowLeft, ArrowUpCircle } from 'lucide-react'
import { SiteNav } from '../../../../components/site-nav'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import { fetchCurrentUser } from '../../../../lib/server-auth'
import { serverApiRequest } from '../../../../lib/server-api'
import { getMessages, type Locale } from '../../../../messages'

type InstalledSkill = {
  id: string
  slug: string
  name: string
  description: string
  latestVersion: string | null
  installedVersion: string
  installedAt: string
  trackLatest: boolean
  hasUpdate: boolean
  downloadCount: number
  starCount: number
  likeCount: number
  author: { username: string; avatar?: string | null }
}

export default async function InstallsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const m = getMessages(locale as Locale)
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  if (!user) redirect('/?auth=login')

  const res = await serverApiRequest<InstalledSkill[]>('/users/me/installs', { host, cookieHeader })
  const skills = res.success && res.data ? res.data : []

  return (
    <>
      <SiteNav user={user} />
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/dashboard`}><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />{m.installsPage.title}
              </h1>
              <p className="text-xs text-muted-foreground">{m.installsPage.count.replace('{count}', String(skills.length))}</p>
            </div>
          </div>

          {skills.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-20 text-center">
                <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{m.installsPage.empty}</p>
                <Button size="sm" className="mt-4" asChild>
                  <Link href={`/${locale}/skills`}>{m.installsPage.browse}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {skills.map(skill => (
                <Link key={skill.id} href={`/${locale}/skills/${skill.slug}`}>
                  <Card className="border-border/60 hover:border-border hover:-translate-y-0.5 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CardTitle className="text-base">{skill.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {m.installsPage.version.replace('{version}', skill.installedVersion)}
                            </Badge>
                            {skill.hasUpdate && skill.latestVersion && (
                              <Badge variant="default" className="text-xs gap-1">
                                <ArrowUpCircle className="w-3 h-3" />
                                {m.installsPage.hasUpdate} · v{skill.latestVersion}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs line-clamp-2">{skill.description}</CardDescription>
                        </div>
                        <Package className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-4 h-4 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                            {skill.author.avatar
                              ? <img src={skill.author.avatar} alt={skill.author.username} className="w-full h-full object-cover" />
                              : <User className="w-2.5 h-2.5" />}
                          </div>
                          <span>{skill.author.username}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{m.installsPage.installedAt.replace('{date}', new Date(skill.installedAt).toLocaleDateString(locale))}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{skill.downloadCount}</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{skill.starCount}</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{skill.likeCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
