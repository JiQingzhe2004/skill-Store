import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Plus, Pencil, Trash2, Globe, Lock, EyeOff, BookOpen } from 'lucide-react'
import { fetchCurrentUser } from '../../../lib/server-auth'
import { serverApiRequest } from '../../../lib/server-api'
import { SiteNav } from '../../../components/site-nav'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'

type Skill = {
  id: string
  slug: string
  name: string
  description: string
  tags: string
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED'
  latestVersion: string | null
  updatedAt: string
}

const visibilityIcon = {
  PUBLIC: Globe,
  UNLISTED: EyeOff,
  PRIVATE: Lock,
}

const statusLabel: Record<Skill['status'], string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '审核中',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档',
  REJECTED: '已拒绝',
}

const statusVariant: Record<Skill['status'], 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'outline',
  PENDING_REVIEW: 'secondary',
  PUBLISHED: 'default',
  ARCHIVED: 'outline',
  REJECTED: 'outline',
}

export default async function MySkillsPage() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const user = await fetchCurrentUser({ host, cookieHeader: cookieStore.toString() })
  if (!user) redirect('/?auth=login')

  const res = await serverApiRequest<Skill[]>('/skills/mine', { host, cookieHeader: cookieStore.toString() })
  const skills: Skill[] = res.success ? (res.data ?? []) : []

  return (
    <>
      <SiteNav user={user} />
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">我的技能</h1>
              <p className="text-sm text-muted-foreground mt-1">管理你创建和发布的 AI 技能</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/skills/new">
                <Plus className="w-4 h-4 mr-2" />
                新建技能
              </Link>
            </Button>
          </div>

          {skills.length === 0 ? (
            <Card className="border-border/60 bg-background/95">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <BookOpen className="w-10 h-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">还没有技能，创建第一个吧</p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/skills/new">
                    <Plus className="w-4 h-4 mr-2" />
                    新建技能
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {skills.map((skill) => {
                const VisIcon = visibilityIcon[skill.visibility]
                return (
                  <Card key={skill.id} className="border-border/60 bg-background/95 hover:border-border transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base truncate">{skill.name}</CardTitle>
                            <Badge variant={statusVariant[skill.status]} className="shrink-0 text-xs">
                              {statusLabel[skill.status]}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs flex items-center gap-1.5">
                            <VisIcon className="w-3 h-3" />
                            <span className="font-mono">{skill.slug}</span>
                            {skill.latestVersion && <span>· v{skill.latestVersion}</span>}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/skills/${skill.id}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {skill.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">{skill.description}</p>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
