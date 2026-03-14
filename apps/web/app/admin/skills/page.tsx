'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Archive, RotateCcw, Trash2, ExternalLink, Search } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { apiRequest } from '../../../lib/api'

type AdminSkill = {
  id: string; slug: string; name: string; status: string
  visibility: string; latestVersion: string | null
  downloadCount: number; starCount: number; createdAt: string
  author: { username: string }
}

type SkillsResponse = {
  items: AdminSkill[]; total: number; page: number; pageSize: number
}

const statusLabel: Record<string, string> = {
  DRAFT: '草稿', PENDING_REVIEW: '审核中', PUBLISHED: '已发布',
  ARCHIVED: '已归档', REJECTED: '已拒绝',
}

export default function AdminSkillsPage() {
  const [data, setData] = useState<SkillsResponse>({ items: [], total: 0, page: 1, pageSize: 20 })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

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
        <h1 className="text-xl font-semibold">技能管理</h1>
        <p className="text-sm text-muted-foreground mt-1">共 {data.total} 个技能</p>
      </div>

      {/* 过滤栏 */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索技能名称..."
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
            <SelectItem value="ALL">全部</SelectItem>
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="PUBLISHED">已发布</SelectItem>
            <SelectItem value="ARCHIVED">已归档</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 表格 */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border/60">
              <th className="text-left px-4 py-3 font-medium">技能</th>
              <th className="text-left px-4 py-3 font-medium">作者</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">下载</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
            ) : data.items.map(skill => (
              <tr key={skill.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.name}</span>
                    <Link href={`/skills/${skill.slug}`} target="_blank">
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
                      <Button
                        variant="outline" size="sm"
                        disabled={actioning === skill.id}
                        onClick={() => doAction(skill.id, 'archive')}
                      >
                        <Archive className="w-3.5 h-3.5 mr-1" />下架
                      </Button>
                    ) : (
                      <Button
                        variant="outline" size="sm"
                        disabled={actioning === skill.id}
                        onClick={() => doAction(skill.id, 'restore')}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />恢复
                      </Button>
                    )}
                    <Button
                      variant="destructive" size="sm"
                      disabled={actioning === skill.id}
                      onClick={() => { if (confirm('确认删除？此操作不可恢复')) doAction(skill.id, '', 'DELETE') }}
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
