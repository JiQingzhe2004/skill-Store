import { headers, cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Tag, Clock, Store } from 'lucide-react'
import { SiteNav } from '../../../../components/site-nav'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { fetchCurrentUser } from '../../../../lib/server-auth'
import { serverApiRequest } from '../../../../lib/server-api'
import { SkillActions } from './skill-actions'
import { SkillFileViewer } from '../../../../components/skill-file-viewer'
import { SkillComments } from '../../../../components/skill-comments'
import { getMessages, type Locale } from '../../../../messages'

type SkillDetail = {
  id: string; slug: string; name: string; description: string; tags: string
  latestVersion: string | null; visibility: string; status: string
  createdAt: string; updatedAt: string
  downloadCount: number; starCount: number; likeCount: number
  author: { username: string; avatar?: string | null }
  versions: {
    id: string; version: string; content?: string
    changelog: string | null; publishedAt: string | null; createdAt: string
  }[]
}

type SkillFile = { id: string; path: string; content: string; encoding: string; size: number }

type Props = { params: Promise<{ locale: string; slug: string }> }

export default async function SkillDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const m = getMessages(locale as Locale)
  const headersList = await headers()
  const cookieStore = await cookies()
  const host = headersList.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  const res = await serverApiRequest<SkillDetail>(`/skills/public/${slug}`, { host, cookieHeader })
  const filesRes = await serverApiRequest<{ files: SkillFile[] }>(`/skills/public/${slug}/files`, { host, cookieHeader })
  const interactionRes = user
    ? await serverApiRequest<{ starred: boolean; liked: boolean }>(`/skills/public/${slug}/me`, { host, cookieHeader })
    : null

  if (!res.success || !res.data) notFound()
  const skill = res.data
  const skillFiles = filesRes.success && filesRes.data ? filesRes.data.files : []
  const initialStarred = interactionRes?.success && interactionRes.data ? interactionRes.data.starred : false
  const initialLiked = interactionRes?.success && interactionRes.data ? interactionRes.data.liked : false
  const tags = skill.tags ? skill.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav user={user} />

      <main className="flex-1 pt-16">
        <section className="py-10 px-6 max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href={`/${locale}/skills`}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {m.skillDetail.backToMarket}
            </Link>
          </Button>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-semibold">{skill.name}</h1>
                {skill.latestVersion && <Badge variant="secondary" className="font-mono">v{skill.latestVersion}</Badge>}
                {tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />{tag}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{skill.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {skill.author.avatar ? (
                    <img src={skill.author.avatar} alt={skill.author.username} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {skill.author.username}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {m.skillDetail.updatedAt.replace('{date}', new Date(skill.updatedAt).toLocaleDateString(locale))}
                </span>
                <span className="flex items-center gap-1"><Store className="w-3 h-3" /><span className="font-mono">{skill.slug}</span></span>
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

          {skillFiles.length > 0 && (
            <SkillFileViewer files={skillFiles} />
          )}

          <SkillComments
            slug={skill.slug}
            isLoggedIn={!!user}
            currentUserId={user?.id}
            currentUserAvatar={user?.avatar}
            currentUsername={user?.username}
            isAdmin={user?.role === 'ADMIN'}
          />
        </section>
      </main>

      <footer className="border-t border-border/50 px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skill Store
      </footer>
    </div>
  )
}
