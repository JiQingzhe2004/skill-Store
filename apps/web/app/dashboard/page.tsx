import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Plus, Boxes, Settings, Store, Download, Star, ArrowRight, Package, User } from 'lucide-react'
import { SiteNav } from '../../components/site-nav'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { fetchCurrentUser } from '../../lib/server-auth'
import { serverApiRequest } from '../../lib/server-api'

type Skill = {
  id: string
  slug: string
  name: string
  status: string
  latestVersion: string | null
  downloadCount: number
  starCount: number
  updatedAt: string
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  if (!user) redirect('/?auth=login')

  const skillsRes = await serverApiRequest<Skill[]>('/skills/mine', { host, cookieHeader })
  const skills = skillsRes.success && skillsRes.data ? skillsRes.data : []

  const publishedSkills = skills.filter(s => s.status === 'PUBLISHED')
  const draftSkills = skills.filter(s => s.status === 'DRAFT')
  const totalDownloads = skills.reduce((acc, s) => acc + s.downloadCount, 0)
  const totalStars = skills.reduce((acc, s) => acc + s.starCount, 0)

  const statusLabel: Record<string, string> = {
    DRAFT: '草稿', PENDING_REVIEW: '审核中', PUBLISHED: '已发布',
    ARCHIVED: '已归档', REJECTED: '已拒绝',
  }
  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    DRAFT: 'outline', PENDING_REVIEW: 'secondary', PUBLISHED: 'default',
    ARCHIVED: 'outline', REJECTED: 'outline',
  }

  return (
    <>
      <SiteNav user={user} />
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-5xl grid gap-6">

          {/* 欢迎栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {user.avatar
                  ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  : <User className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <h1 className="text-lg font-semibold">你好，{user.username}</h1>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">
                <Settings className="w-3.5 h-3.5 mr-1.5" />账号设置
              </Link>
            </Button>
          </div>

          {/* 数据概览 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/60">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{skills.length}</p>
                    <p className="text-xs text-muted-foreground">总技能数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{publishedSkills.length}</p>
                    <p className="text-xs text-muted-foreground">已发布</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalDownloads}</p>
                    <p className="text-xs text-muted-foreground">总下载量</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalStars}</p>
                    <p className="text-xs text-muted-foreground">获得星标</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 我的技能 */}
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Boxes className="w-4 h-4" />我的技能
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {draftSkills.length > 0 && `${draftSkills.length} 个草稿 · `}{publishedSkills.length} 个已发布
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link href="/dashboard/skills/new">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />创建技能
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/skills">
                    全部 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Boxes className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">还没有技能</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href="/dashboard/skills/new">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />创建第一个技能
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {skills.slice(0, 5).map(skill => (
                    <Link
                      key={skill.id}
                      href={`/dashboard/skills/${skill.id}`}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={statusVariant[skill.status]} className="text-xs">
                          {statusLabel[skill.status]}
                        </Badge>
                        <span className="text-sm font-medium">{skill.name}</span>
                        {skill.latestVersion && (
                          <span className="text-xs text-muted-foreground font-mono">v{skill.latestVersion}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />{skill.downloadCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />{skill.starCount}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  ))}
                  {skills.length > 5 && (
                    <Link href="/dashboard/skills" className="text-center text-xs text-muted-foreground py-2 hover:text-foreground transition-colors">
                      查看全部 {skills.length} 个技能 →
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 快捷入口 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link href="/dashboard/skills/new" className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-primary/10"><Plus className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-sm font-medium">创建技能</p>
                <p className="text-xs text-muted-foreground">发布新的 AI 技能</p>
              </div>
            </Link>
            <Link href="/skills" className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-emerald-500/10"><Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
              <div>
                <p className="text-sm font-medium">技能市场</p>
                <p className="text-xs text-muted-foreground">浏览公开技能</p>
              </div>
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-lg bg-muted"><Settings className="w-4 h-4 text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-medium">账号设置</p>
                <p className="text-xs text-muted-foreground">头像、昵称、简介</p>
              </div>
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}
