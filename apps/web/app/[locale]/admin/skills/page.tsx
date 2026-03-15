'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Archive, RotateCcw, Trash2, ExternalLink, Search } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { apiRequest } from '../../../../lib/api'
import { getMessages, type Locale } from '../../../../messages'

type AdminSkill = {
  id: string; slug: string; name: string; status: string
  visibility: string; latestVersion: string | null
  downloadCount: number; starCount: number; createdAt: string
  author: { username: string }
}

type SkillsResponse = {
  items: AdminSkill[]; total: number; page: number; pageSize: number
}

export default function AdminSkillsPage() {
  const { locale } = useParams<{ locale: string }>()
  const m = getMessages(locale as Locale)
  const [data, setData] = useState<SkillsResponse>({ items: [], total: 0, page: 1, pageSize: 20 })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

  const statusLabel: Record<string, string> = {
    DRAFT: m.admin.statusDraft,
    PENDING_REVIEW: m.admin.statusPendingReview,
    PUBLISHED: m.admin.statusPublished,
    ARCHIVED: m.admin.statusArchived,
    REJECTED: m.admin.statusRejected,
  }

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (query) qs.set('q', query)
    if (status !== 'ALL') qs.set('status', status)
    const res = await apiRequest<SkillsResponse>(`/admin/skills?${qs}`)
    if (res.success && res.data) setData(res.data)
    setLoading(false)
  }, [query, status])

  useEffect(() => { fetchSkills() }, [fetchSkills])

  const doAction = async (id: string, path: string, method = 'PATCH') => {
    setActioning(id)
    await apiRequest(`/admin/skills/${id}/${path}`, { method })
    await fetchSkills()
    setActioning(null)
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">{m.admin.skillsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{m.admin.skillsCount.replace('{count}', String(data.total))}</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={m.admin.searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{m.admin.filterAll}</SelectItem>
            <SelectItem value="DRAFT">{m.admin.filterDraft}</SelectItem>
            <SelectItem value="PUBLISHED">{m.admin.filterPublished}</SelectItem>
            <SelectItem value="ARCHIVED">{m.admin.filterArchived}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border/60">
              <th className="text-left px-4 py-3 font-medium">{m.admin.colSkill}</th>
              <th className="text-left px-4 py-3 font-medium">{m.admin.colAuthor}</th>
              <th className="text-left px-4 py-3 font-medium">{m.admin.colSkillStatus}</th>
              <th className="text-left px-4 py-3 font-medium">{m.admin.colDownloads}</th>
              <th className="text-right px-4 py-3 font-medium">{m.admin.colSkillActions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{m.admin.loadingSkills}</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{m.admin.noSkills}</td></tr>
            ) : data.items.map(skill => (
              <tr key={skill.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.name}</span>
                    <Link href={`/${locale}/skills/${skill.slug}`} target="_blank">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{skill.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{skill.author.username}</td>
                <td className="px-4 py-3">
                  <Badge variant={skill.status === 'PUBLISHED' ? 'default' : 'outline'}>
                    {statusLabel[skill.status] ?? skill.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{skill.downloadCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {skill.status !== 'ARCHIVED' ? (
                      <Button variant="outline" size="sm" disabled={actioning === skill.id} onClick={() => doAction(skill.id, 'archive')}>
                        <Archive className="w-3.5 h-3.5 mr-1" />{m.admin.archive}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled={actioning === skill.id} onClick={() => doAction(skill.id, 'restore')}>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />{m.admin.restore}
                      </Button>
                    )}
                    <Button
                      variant="destructive" size="sm"
                      disabled={actioning === skill.id}
                      onClick={() => { if (confirm(m.admin.deleteConfirm)) doAction(skill.id, '', 'DELETE') }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
