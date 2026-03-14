import { headers, cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Tag, Clock, Store } from 'lucide-react'
import { SiteNav } from '../../../components/site-nav'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { fetchCurrentUser } from '../../../lib/server-auth'
import { serverApiRequest } from '../../../lib/server-api'
import { SkillActions } from './skill-actions'

type SkillDetail = {
  id: string
  slug: string
  name: string
  description: string
  tags: string
  latestVersion: string | null
  visibility: string
  status: string
  createdAt: string
  updatedAt: string
  downloadCount: number
  starCount: number
  likeCount: number
  author: { username: string; avatar?: string | null }
  versions: {
    id: string
    version: string
    changelog: string | null
    publishedAt: string | null
    createdAt: string
  }[]
}

type Props = { params: Promise<{ slug: string }> }

export default async function SkillDetailPage({ params }: Props) {
  const { slug } = await params
  const headersList = await headers()
  const cookieStore = await cookies()
  const host = headersList.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  const res = await serverApiRequest<SkillDetail>(`/skills/public/${slug}`, { host, cookieHeader })
  const interactionRes = user
    ? await serverApiRequest<{ starred: boolean; liked: boolean }>(`/skills/public/${slug}/me`, { host, cookieHeader })
    : null

  if (!res.success || !res.data) notFound()
  const skill = res.data

  const initialStarred = interactionRes?.success && interactionRes.data ? interactionRes.data.starred : false
  const initialLiked = interactionRes?.success && interactionRes.data ? interactionRes.data.liked : false

  const tags = skill.tags ? skill.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav user={user} />

      <main className="flex-1 pt-16">
        <section className="py-10 px-6 max-w-4xl mx-auto">
          {/* Back */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/skills">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              返回市场
            </Link>
          </Button>

          {/* Header Card */}
          <Card className="border-border/60 bg-background/95 shadow-sm mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{skill.name}</CardTitle>
                    {skill.latestVersion && (
                      <Badge variant="secondary">v{skill.latestVersion}</Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm leading-relaxed mb-4">
                    {skill.description}
                  </CardDescription>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{skill.author.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>更新于 {new Date(skill.updatedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      <span className="font-mono">{skill.slug}</span>
                    </div>
                  </div>
                </div>
                <SkillActions
                  slug={skill.slug}
                  initialStarCount={skill.starCount}
                  initialLikeCount={skill.likeCount}
                  initialStarred={initialStarred}
                  initialLiked={initialLiked}
                  initialDownloadCount={skill.downloadCount}
                  isLoggedIn={!!user}
                />
              </div>
            </CardHeader>
            {tags.length > 0 && (
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Version History */}
          {skill.versions.length > 0 && (
            <Card className="border-border/60 bg-background/95">
              <CardHeader>
                <CardTitle className="text-base">版本历史</CardTitle>
                <CardDescription>{skill.versions.length} 个已发布版本</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {skill.versions.map((v, i) => (
                  <div
                    key={v.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">v{v.version}</span>
                        {i === 0 && <Badge variant="default" className="text-xs">最新</Badge>}
                      </div>
                      {v.changelog && (
                        <p className="text-xs text-muted-foreground">{v.changelog}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {v.publishedAt && new Date(v.publishedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <footer className="border-t border-border/50 px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skill Store
      </footer>
    </div>
  )
}
