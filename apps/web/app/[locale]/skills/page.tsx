import { headers, cookies } from 'next/headers'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '../../../components/site-nav'
import { Button } from '../../../components/ui/button'
import { SkillsGridAnimated } from '../../../components/skills-grid-animated'
import { fetchCurrentUser } from '../../../lib/server-auth'
import { serverApiRequest } from '../../../lib/server-api'
import { getMessages, type Locale } from '../../../messages'

type PublicSkill = {
  id: string; slug: string; name: string; description: string; tags: string
  latestVersion: string | null; updatedAt: string
  downloadCount: number; starCount: number; likeCount: number
  author: { username: string; avatar?: string | null }
}

type PublicSkillsResponse = {
  items: PublicSkill[]; total: number; page: number; pageSize: number
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function SkillsPage({ params: routeParams, searchParams }: Props) {
  const { locale } = await routeParams
  const m = getMessages(locale as Locale)
  const sp = await searchParams
  const headersList = await headers()
  const cookieStore = await cookies()
  const host = headersList.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  const page = sp.page ? parseInt(sp.page) : 1

  const res = await serverApiRequest<PublicSkillsResponse>(
    `/skills/public?page=${page}&pageSize=20`, { host, cookieHeader },
  )
  const data = res.success && res.data ? res.data : { items: [], total: 0, page: 1, pageSize: 20 }
  const totalPages = Math.ceil(data.total / data.pageSize)

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav user={user} />
      <main className="flex-1 pt-20 px-6">
        <section className="max-w-6xl mx-auto">
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Search className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">{m.skillsPage.empty}</p>
              <p className="text-muted-foreground text-xs">{m.skillsPage.emptyHint}</p>
            </div>
          ) : (
            <>
              <SkillsGridAnimated items={data.items} locale={locale} />
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/skills?page=${page - 1}`}>{m.skillsPage.prevPage}</Link>
                    </Button>
                  )}
                  <span className="flex items-center px-3 text-sm text-muted-foreground">{page} / {totalPages}</span>
                  {page < totalPages && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/skills?page=${page + 1}`}>{m.skillsPage.nextPage}</Link>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg">
          <span>{data.total}</span>
          <span className="text-primary-foreground/70 text-xs">{m.skillsPage.skillCount}</span>
        </div>
      </div>
      <footer className="border-t border-border/50 px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skill Store
      </footer>
    </div>
  )
}
