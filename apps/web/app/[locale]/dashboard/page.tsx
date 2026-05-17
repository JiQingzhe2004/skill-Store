import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Plus, Boxes, Settings, Store, Download, Star, ThumbsUp, ArrowRight, Package, User, Key, Box, Shield } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { fetchCurrentUser } from '../../../lib/server-auth'
import { serverApiRequest } from '../../../lib/server-api'
import { getMessages, type Locale } from '../../../messages'

type Skill = {
  id: string; slug: string; name: string; status: string
  latestVersion: string | null
  downloadCount: number; starCount: number; likeCount: number; updatedAt: string
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const m = getMessages(locale as Locale)
  const adminSetup = m.adminSetup
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  if (!user) redirect('/?auth=login')

  const [skillsRes, setupStatusRes] = await Promise.all([
    serverApiRequest<Skill[]>('/skills/mine', { host, cookieHeader }),
    user.role !== 'ADMIN'
      ? serverApiRequest<{ needsSetup: boolean }>('/admin/setup/status', { host, cookieHeader })
      : Promise.resolve(null),
  ])
  const skills = skillsRes.success && skillsRes.data ? skillsRes.data : []
  const showAdminSetupBanner =
    user.role !== 'ADMIN' &&
    setupStatusRes?.success &&
    setupStatusRes.data?.needsSetup === true

  const publishedSkills = skills.filter(s => s.status === 'PUBLISHED')
  const draftSkills = skills.filter(s => s.status === 'DRAFT')
  const totalDownloads = skills.reduce((acc, s) => acc + (s.downloadCount ?? 0), 0)
  const totalStars = skills.reduce((acc, s) => acc + (s.starCount ?? 0), 0)
  const totalLikes = skills.reduce((acc, s) => acc + (s.likeCount ?? 0), 0)

  const statusLabel: Record<string, string> = {
    DRAFT: m.mySkillsPage.statusDraft,
    PENDING_REVIEW: m.mySkillsPage.statusPendingReview,
    PUBLISHED: m.mySkillsPage.statusPublished,
    ARCHIVED: m.mySkillsPage.statusArchived,
    REJECTED: m.mySkillsPage.statusRejected,
  }
  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    DRAFT: 'outline', PENDING_REVIEW: 'secondary', PUBLISHED: 'default',
    ARCHIVED: 'outline', REJECTED: 'outline',
  }

  const draftsDesc = draftSkills.length > 0
    ? m.dashboard.draftsDesc.replace('{count}', String(draftSkills.length))
    : ''
  const publishedDesc = m.dashboard.publishedCountDesc.replace('{count}', String(publishedSkills.length))

  return (
    <>
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-5xl grid gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {user.avatar
                  ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  : <User className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <h1 className="text-lg font-semibold">{m.dashboard.hello.replace('{username}', user.username)}</h1>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/dashboard/settings`}>
                <Settings className="w-3.5 h-3.5 mr-1.5" />{m.dashboard.accountSettings}
              </Link>
            </Button>
          </div>

          {showAdminSetupBanner && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                    <Shield className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{adminSetup.dashboardBanner}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{adminSetup.subtitle}</p>
                  </div>
                </div>
                <Button size="sm" asChild className="shrink-0">
                  <Link href={`/${locale}/setup-admin`}>{adminSetup.dashboardBannerAction}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-border/60"><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Package className="w-4 h-4 text-primary" /></div><div><p className="text-2xl font-bold">{skills.length}</p><p className="text-xs text-muted-foreground">{m.dashboard.totalSkills}</p></div></div></CardContent></Card>
            <Card className="border-border/60"><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div><div><p className="text-2xl font-bold">{publishedSkills.length}</p><p className="text-xs text-muted-foreground">{m.dashboard.published}</p></div></div></CardContent></Card>
            <Card className="border-border/60"><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Download className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div><div><p className="text-2xl font-bold">{totalDownloads}</p><p className="text-xs text-muted-foreground">{m.dashboard.totalDownloads}</p></div></div></CardContent></Card>
            <Card className="border-border/60"><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/10"><Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /></div><div><p className="text-2xl font-bold">{totalStars}</p><p className="text-xs text-muted-foreground">{m.dashboard.totalStars}</p></div></div></CardContent></Card>
            <Card className="border-border/60"><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-pink-500/10"><ThumbsUp className="w-4 h-4 text-pink-600 dark:text-pink-400" /></div><div><p className="text-2xl font-bold">{totalLikes}</p><p className="text-xs text-muted-foreground">{m.dashboard.totalLikes}</p></div></div></CardContent></Card>
          </div>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Boxes className="w-4 h-4" />{m.dashboard.mySkills}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{draftsDesc}{publishedDesc}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link href={`/${locale}/dashboard/skills/new`}><Plus className="w-3.5 h-3.5 mr-1.5" />{m.dashboard.createSkill}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/dashboard/skills`}>{m.dashboard.allSkills} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Boxes className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{m.dashboard.noSkills}</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href={`/${locale}/dashboard/skills/new`}><Plus className="w-3.5 h-3.5 mr-1.5" />{m.dashboard.createFirst}</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {skills.slice(0, 5).map(skill => (
                    <Link key={skill.id} href={`/${locale}/dashboard/skills/${skill.id}`}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant={statusVariant[skill.status]} className="text-xs">{statusLabel[skill.status]}</Badge>
                        <span className="text-sm font-medium">{skill.name}</span>
                        {skill.latestVersion && <span className="text-xs text-muted-foreground font-mono">v{skill.latestVersion}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" />{skill.downloadCount}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" />{skill.starCount ?? 0}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{skill.likeCount ?? 0}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  ))}
                  {skills.length > 5 && (
                    <Link href={`/${locale}/dashboard/skills`} className="text-center text-xs text-muted-foreground py-2 hover:text-foreground transition-colors">
                      {m.dashboard.viewAll.replace('{count}', String(skills.length))}
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href={`/${locale}/dashboard/skills/new`} className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-primary/10"><Plus className="w-4 h-4 text-primary" /></div>
              <div><p className="text-sm font-medium">{m.dashboard.createSkill}</p><p className="text-xs text-muted-foreground">{m.dashboard.createSkillDesc}</p></div>
            </Link>
            <Link href={`/${locale}/skills`} className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-emerald-500/10"><Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-sm font-medium">{m.dashboard.skillMarket}</p><p className="text-xs text-muted-foreground">{m.dashboard.skillMarketDesc}</p></div>
            </Link>
            <Link href={`/${locale}/dashboard/stars`} className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-yellow-500/10"><Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /></div>
              <div><p className="text-sm font-medium">{m.dashboard.myStars}</p><p className="text-xs text-muted-foreground">{m.dashboard.myStarsDesc}</p></div>
            </Link>
            <Link href={`/${locale}/dashboard/installs`} className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-sky-500/10"><Box className="w-4 h-4 text-sky-600 dark:text-sky-400" /></div>
              <div><p className="text-sm font-medium">{m.dashboard.myInstalls}</p><p className="text-xs text-muted-foreground">{m.dashboard.myInstallsDesc}</p></div>
            </Link>
            <Link href={`/${locale}/dashboard/api-keys`} className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-violet-500/10"><Key className="w-4 h-4 text-violet-600 dark:text-violet-400" /></div>
              <div><p className="text-sm font-medium">{m.dashboard.apiKeys}</p><p className="text-xs text-muted-foreground">{m.dashboard.apiKeysDesc}</p></div>
            </Link>
            <Link href={`/${locale}/dashboard/settings`} className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-muted"><Settings className="w-4 h-4 text-muted-foreground" /></div>
              <div><p className="text-sm font-medium">{m.dashboard.accountSettings}</p><p className="text-xs text-muted-foreground">{m.dashboard.accountSettingsDesc}</p></div>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
