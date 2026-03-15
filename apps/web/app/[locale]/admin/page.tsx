import { cookies, headers } from 'next/headers'
import { Users, Boxes, Download, Star, CheckCircle2 } from 'lucide-react'
import { serverApiRequest } from '../../../lib/server-api'
import { Card, CardContent } from '../../../components/ui/card'
import { getMessages, type Locale } from '../../../messages'

type Stats = {
  userCount: number
  skillCount: number
  publishedCount: number
  totalDownloads: number
  totalStars: number
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const m = getMessages(locale as Locale)
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const res = await serverApiRequest<Stats>('/admin/stats', { host, cookieHeader })
  const stats = res.success && res.data ? res.data : null

  const cards = [
    { label: m.admin.statUsers, value: stats?.userCount ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: m.admin.statSkills, value: stats?.skillCount ?? 0, icon: Boxes, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: m.admin.statPublished, value: stats?.publishedCount ?? 0, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: m.admin.statDownloads, value: stats?.totalDownloads ?? 0, icon: Download, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: m.admin.statStars, value: stats?.totalStars ?? 0, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ]

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">{m.admin.statsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{m.admin.statsSubtitle}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(card => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
