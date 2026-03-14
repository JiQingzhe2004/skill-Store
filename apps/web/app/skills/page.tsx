import Link from 'next/link'
import { headers, cookies } from 'next/headers'
import { Store, Search, User, Tag, ArrowRight } from 'lucide-react'
import { SiteNav } from '../../components/site-nav'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { fetchCurrentUser } from '../../lib/server-auth'
import { serverApiRequest } from '../../lib/server-api'

type PublicSkill = {
  id: string
  slug: string
  name: string
  description: string
  tags: string
  latestVersion: string | null
  updatedAt: string
  author: { username: string }
}

type PublicSkillsResponse = {
  items: PublicSkill[]
  total: number
  page: number
  pageSize: number
}

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function MarketplacePage({ searchParams }: Props) {
  const params = await searchParams
  const headersList = await headers()
  const cookieStore = await cookies()
  const host = headersList.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  const page = params.page ? parseInt(params.page) : 1

  const res = await serverApiRequest<PublicSkillsResponse>(
    `/skills/public?page=${page}&pageSize=20`,
    { host, cookieHeader },
  )

  const data = res.success && res.data ? res.data : { items: [], total: 0, page: 1, pageSize: 20 }
  const totalPages = Math.ceil(data.total / data.pageSize)

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav user={user} />

      <main className="flex-1 pt-16">
        {/* Header */}
        <section className="py-16 px-6 text-center border-b border-border/50">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4">
              <Store className="w-6 h-6" />
              <h1 className="text-3xl font-bold tracking-tight">技能市场</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              浏览社区发布的 AI 技能，找到适合你的工具
            </p>
          </div>
        </section>

        {/* Skills Grid */}
        <section className="py-10 px-6 max-w-6xl mx-auto">
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Search className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">暂时没有公开技能</p>
              <p className="text-muted-foreground text-xs">成为第一个发布者吧！</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  共 {data.total} 个技能
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.items.map((skill) => (
                  <Link key={skill.id} href={`/skills/${skill.slug}`}>
                    <Card className="h-full border-border/60 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-border cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-snug">{skill.name}</CardTitle>
                          {skill.latestVersion && (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              v{skill.latestVersion}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                          {skill.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{skill.author.username}</span>
                          </div>
                          {skill.tags && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">
                                {skill.tags.split(',')[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/skills?page=${page - 1}`}>上一页</Link>
                    </Button>
                  )}
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/skills?page=${page + 1}`}>下一页</Link>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-border/50 px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skill Store
      </footer>
    </div>
  )
}
