'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Plus, Send, Trash2, CheckCircle2, Clock, FileText } from 'lucide-react'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'
import { apiRequest, getErrorMessage } from '../../../../lib/api'

type Skill = {
  id: string; slug: string; name: string; description: string
  tags: string; visibility: string; status: string
  latestVersion: string | null
}

type Version = {
  id: string; version: string; changelog: string | null
  publishedAt: string | null; createdAt: string
}

const infoSchema = z.object({
  name: z.string().min(2).max(128),
  description: z.string().min(10).max(512),
  tags: z.string().max(512).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']),
})

const versionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, '版本号格式：1.0.0'),
  content: z.string().min(10, '内容至少 10 个字符'),
  changelog: z.string().max(1000).optional(),
})

type InfoValues = z.infer<typeof infoSchema>
type VersionValues = z.infer<typeof versionSchema>

const statusLabel: Record<string, string> = {
  DRAFT: '草稿', PENDING_REVIEW: '审核中', PUBLISHED: '已发布',
  ARCHIVED: '已归档', REJECTED: '已拒绝',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'outline', PENDING_REVIEW: 'secondary', PUBLISHED: 'default',
  ARCHIVED: 'outline', REJECTED: 'outline',
}

export function SkillEditor({ skill, versions: initVersions }: { skill: Skill; versions: Version[] }) {
  const router = useRouter()
  const [versions, setVersions] = useState(initVersions)
  const [infoSuccess, setInfoSuccess] = useState('')
  const [infoError, setInfoError] = useState('')
  const [versionError, setVersionError] = useState('')
  const [versionSuccess, setVersionSuccess] = useState('')

  const infoForm = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: skill.name,
      description: skill.description,
      tags: skill.tags,
      visibility: skill.visibility as InfoValues['visibility'],
    },
  })

  const versionForm = useForm<VersionValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: { version: '', content: '', changelog: '' },
  })

  const onUpdateInfo = infoForm.handleSubmit(async (values) => {
    setInfoError(''); setInfoSuccess('')
    const res = await apiRequest(`/skills/${skill.id}`, { method: 'PATCH', body: JSON.stringify(values) })
    if (!res.success) { setInfoError(getErrorMessage(res)); return }
    setInfoSuccess('✓ 保存成功')
    setTimeout(() => setInfoSuccess(''), 3000)
  })

  const onCreateVersion = versionForm.handleSubmit(async (values) => {
    setVersionError(''); setVersionSuccess('')
    const res = await apiRequest<Version>(`/skills/${skill.id}/versions`, {
      method: 'POST',
      body: JSON.stringify(values),
    })
    if (!res.success) { setVersionError(getErrorMessage(res)); return }
    if (res.data) setVersions(prev => [res.data!, ...prev])
    versionForm.reset()
    setVersionSuccess('✓ 版本已保存')
    setTimeout(() => setVersionSuccess(''), 3000)
  })

  const onPublish = async (versionId: string) => {
    const res = await apiRequest(`/skills/${skill.id}/versions/${versionId}/publish`, { method: 'POST' })
    if (!res.success) return
    setVersions(prev => prev.map(v => v.id === versionId ? { ...v, publishedAt: new Date().toISOString() } : v))
    router.refresh()
  }

  const onDelete = async () => {
    if (!confirm(`确认删除技能「${skill.name}」？此操作不可撤销。`)) return
    const res = await apiRequest(`/skills/${skill.id}`, { method: 'DELETE' })
    if (res.success) router.push('/dashboard/skills')
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/skills"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{skill.name}</h1>
              <Badge variant={statusVariant[skill.status]}>{statusLabel[skill.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{skill.slug}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />删除技能
        </Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="versions">版本管理 {versions.length > 0 && `(${versions.length})`}</TabsTrigger>
        </TabsList>

        {/* 基本信息 Tab */}
        <TabsContent value="info">
          <Card className="border-border/60 bg-background/95">
            <CardHeader>
              <CardTitle className="text-base">编辑基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={onUpdateInfo}>
                <div className="grid gap-2">
                  <Label>技能名称</Label>
                  <Input {...infoForm.register('name')} aria-invalid={Boolean(infoForm.formState.errors.name)} />
                  {infoForm.formState.errors.name && <p className="text-xs text-destructive">{infoForm.formState.errors.name.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>描述</Label>
                  <Textarea rows={3} {...infoForm.register('description')} />
                  {infoForm.formState.errors.description && <p className="text-xs text-destructive">{infoForm.formState.errors.description.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>标签 <span className="text-muted-foreground text-xs">（逗号分隔）</span></Label>
                  <Input {...infoForm.register('tags')} />
                </div>
                <div className="grid gap-2">
                  <Label>可见性</Label>
                  <Select
                    defaultValue={skill.visibility}
                    onValueChange={(v) => infoForm.setValue('visibility', v as InfoValues['visibility'])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">公开</SelectItem>
                      <SelectItem value="UNLISTED">隐藏</SelectItem>
                      <SelectItem value="PRIVATE">私有</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {infoError && <Alert variant="destructive"><AlertDescription>{infoError}</AlertDescription></Alert>}
                {infoSuccess && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{infoSuccess}</AlertDescription></Alert>}
                <Button type="submit" disabled={infoForm.formState.isSubmitting}>
                  {infoForm.formState.isSubmitting ? '保存中...' : '保存修改'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 版本管理 Tab */}
        <TabsContent value="versions" className="grid gap-4">
          {/* 新建版本 */}
          <Card className="border-border/60 bg-background/95">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4" />保存新版本</CardTitle>
              <CardDescription>content 字段为 SKILL.md 格式的完整内容</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={onCreateVersion}>
                <div className="grid gap-2">
                  <Label>版本号 <span className="text-muted-foreground text-xs">（语义化，如 1.0.0）</span></Label>
                  <Input placeholder="1.0.0" {...versionForm.register('version')} aria-invalid={Boolean(versionForm.formState.errors.version)} />
                  {versionForm.formState.errors.version && <p className="text-xs text-destructive">{versionForm.formState.errors.version.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>技能内容 <span className="text-muted-foreground text-xs">（SKILL.md 格式）</span></Label>
                  <Textarea
                    rows={10}
                    placeholder="---\nname: my-skill\ndescription: ...\n---\n\n# 技能内容"
                    className="font-mono text-xs"
                    {...versionForm.register('content')}
                  />
                  {versionForm.formState.errors.content && <p className="text-xs text-destructive">{versionForm.formState.errors.content.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>更新说明 <span className="text-muted-foreground text-xs">（可选）</span></Label>
                  <Textarea rows={2} {...versionForm.register('changelog')} />
                </div>
                {versionError && <Alert variant="destructive"><AlertDescription>{versionError}</AlertDescription></Alert>}
                {versionSuccess && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{versionSuccess}</AlertDescription></Alert>}
                <Button type="submit" variant="outline" disabled={versionForm.formState.isSubmitting}>
                  <FileText className="w-4 h-4 mr-2" />
                  {versionForm.formState.isSubmitting ? '保存中...' : '保存草稿版本'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 版本列表 */}
          {versions.length > 0 && (
            <div className="grid gap-3">
              {versions.map((v) => (
                <Card key={v.id} className="border-border/60 bg-background/95">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">v{v.version}</span>
                        {v.publishedAt
                          ? <Badge variant="default" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />已发布</Badge>
                          : <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />草稿</Badge>
                        }
                      </div>
                      {!v.publishedAt && (
                        <Button size="sm" onClick={() => onPublish(v.id)}>
                          <Send className="w-3.5 h-3.5 mr-1.5" />发布
                        </Button>
                      )}
                    </div>
                    {v.changelog && <CardDescription className="text-xs mt-1">{v.changelog}</CardDescription>}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
