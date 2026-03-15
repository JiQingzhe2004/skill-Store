'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Save, Send, Trash2, CheckCircle2, Clock, FileText, Code2, History } from 'lucide-react'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { RichTextEditor } from '../../../../components/rich-text-editor'
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
  content?: string
  publishedAt: string | null; createdAt: string
}

/* ─── Schemas ─── */

const infoSchema = z.object({
  name: z.string().min(2, '名称至少 2 个字符').max(128),
  description: z.string().min(10, '描述至少 10 个字符').max(512),
  tags: z.string().max(512).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']),
})

const contentSchema = z.object({
  content: z.string().min(10, '内容至少 10 个字符'),
})

type InfoValues = z.infer<typeof infoSchema>
type ContentValues = z.infer<typeof contentSchema>

/* ─── Helpers ─── */

const statusLabel: Record<string, string> = {
  DRAFT: '草稿', PENDING_REVIEW: '审核中', PUBLISHED: '已发布',
  ARCHIVED: '已归档', REJECTED: '已拒绝',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'outline', PENDING_REVIEW: 'secondary', PUBLISHED: 'default',
  ARCHIVED: 'outline', REJECTED: 'outline',
}

/** 比较语义化版本：返回 1 if a > b, -1 if a < b, 0 if equal */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1
    if (pa[i] < pb[i]) return -1
  }
  return 0
}

/** 根据当前最高版本号自动推荐下一个 patch 版本 */
function suggestNextVersion(versions: Version[]): string {
  if (versions.length === 0) return '1.0.0'
  // 取所有版本号中最大的
  const sorted = [...versions].sort((a, b) => compareSemver(b.version, a.version))
  const latest = sorted[0].version
  const parts = latest.split('.').map(Number)
  parts[2] += 1
  return parts.join('.')
}

/* ─── Component ─── */

export function SkillEditor({ skill, versions: initVersions, latestContent }: {
  skill: Skill
  versions: Version[]
  latestContent?: string
}) {
  const router = useRouter()
  const [versions, setVersions] = useState(initVersions)
  const [infoMsg, setInfoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [contentMsg, setContentMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [publishMsg, setPublishMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const flash = (setter: typeof setInfoMsg, type: 'ok' | 'err', text: string) => {
    setter({ type, text })
    if (type === 'ok') setTimeout(() => setter(null), 3000)
  }

  /* ── 基本信息 Form ── */
  const infoForm = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: skill.name,
      description: skill.description,
      tags: skill.tags,
      visibility: skill.visibility as InfoValues['visibility'],
    },
  })

  const defaultContent = latestContent || `<h1>${skill.name}</h1><p>在这里编写技能的详细内容...</p>`

  /* ── 技能内容 Form ── */
  const contentForm = useForm<ContentValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: { content: defaultContent },
  })

  const onUpdateInfo = infoForm.handleSubmit(async (values) => {
    setInfoMsg(null)
    const res = await apiRequest(`/skills/${skill.id}`, { method: 'PATCH', body: JSON.stringify(values) })
    if (!res.success) { flash(setInfoMsg, 'err', getErrorMessage(res)); return }
    flash(setInfoMsg, 'ok', '✓ 保存成功')
  })

  const onSaveContent = contentForm.handleSubmit(async (values) => {
    setContentMsg(null)
    // 计算下一个版本号
    const nextVer = suggestNextVersion(versions)
    const res = await apiRequest<Version>(`/skills/${skill.id}/versions`, {
      method: 'POST',
      body: JSON.stringify({
        version: nextVer,
        content: values.content,
        changelog: '',
      }),
    })
    if (!res.success) { flash(setContentMsg, 'err', getErrorMessage(res)); return }
    if (res.data) setVersions(prev => [res.data!, ...prev])
    flash(setContentMsg, 'ok', `✓ 已保存为 v${nextVer}`)
  })

  const onPublish = async (versionId: string) => {
    setPublishMsg(null)
    const res = await apiRequest(`/skills/${skill.id}/versions/${versionId}/publish`, { method: 'POST' })
    if (!res.success) { flash(setPublishMsg, 'err', getErrorMessage(res)); return }
    setVersions(prev => prev.map(v => v.id === versionId ? { ...v, publishedAt: new Date().toISOString() } : v))
    flash(setPublishMsg, 'ok', '✓ 已发布')
  }

  const onDelete = async () => {
    if (!confirm(`确认删除技能「${skill.name}」？此操作不可撤销。`)) return
    const res = await apiRequest(`/skills/${skill.id}`, { method: 'DELETE' })
    if (res.success) router.push('/dashboard/skills')
  }

  const MsgBox = ({ msg }: { msg: { type: 'ok' | 'err'; text: string } | null }) => {
    if (!msg) return null
    return msg.type === 'ok'
      ? <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{msg.text}</AlertDescription></Alert>
      : <Alert variant="destructive"><AlertDescription>{msg.text}</AlertDescription></Alert>
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
              {skill.latestVersion && (
                <Badge variant="secondary" className="font-mono text-xs">v{skill.latestVersion}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono">{skill.slug}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />删除
        </Button>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="content">
            <Code2 className="w-3.5 h-3.5 mr-1.5" />技能内容
          </TabsTrigger>
          <TabsTrigger value="versions">
            <History className="w-3.5 h-3.5 mr-1.5" />版本历史 {versions.length > 0 && `(${versions.length})`}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1：基本信息 ── */}
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
                    <SelectContent sideOffset={4} side="top">
                      <SelectItem value="PUBLIC">公开</SelectItem>
                      <SelectItem value="UNLISTED">隐藏</SelectItem>
                      <SelectItem value="PRIVATE">私有</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <MsgBox msg={infoMsg} />
                <Button type="submit" disabled={infoForm.formState.isSubmitting}>
                  {infoForm.formState.isSubmitting ? '保存中...' : '保存修改'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2：技能内容 ── */}
        <TabsContent value="content">
          <Card className="border-border/60 bg-background/95">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="w-4 h-4" />编辑技能内容
              </CardTitle>
              <CardDescription>
                {latestContent
                  ? `当前显示 v${versions[0]?.version} 的内容，保存后将创建 v${suggestNextVersion(versions)}`
                  : `首次编辑，保存后将创建 v${suggestNextVersion(versions)}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={onSaveContent}>
                <div className="grid gap-2">
                  <RichTextEditor
                    value={contentForm.watch('content')}
                    onChange={(html) => contentForm.setValue('content', html, { shouldValidate: true })}
                    placeholder="在这里编写技能的详细内容..."
                    minHeight={480}
                  />
                  {contentForm.formState.errors.content && (
                    <p className="text-xs text-destructive">{contentForm.formState.errors.content.message}</p>
                  )}
                </div>
                <MsgBox msg={contentMsg} />
                <div className="flex gap-3">
                  <Button type="submit" disabled={contentForm.formState.isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {contentForm.formState.isSubmitting ? '保存中...' : `保存为 v${suggestNextVersion(versions)}`}
                  </Button>
                  {versions.length > 0 && !versions[0].publishedAt && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onPublish(versions[0].id)}
                    >
                      <Send className="w-4 h-4 mr-2" />发布最新版本
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3：版本历史 ── */}
        <TabsContent value="versions">
          {versions.length === 0 ? (
            <Card className="border-border/60 bg-background/95">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                还没有版本，在「技能内容」页保存第一个版本
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              <MsgBox msg={publishMsg} />
              {versions.map((v, i) => (
                <Card key={v.id} className="border-border/60 bg-background/95">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">v{v.version}</span>
                        {v.publishedAt
                          ? <Badge variant="default" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />已发布</Badge>
                          : <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />草稿</Badge>
                        }
                        {i === 0 && <Badge variant="secondary" className="text-xs">最新</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {!v.publishedAt && (
                          <Button size="sm" onClick={() => onPublish(v.id)}>
                            <Send className="w-3.5 h-3.5 mr-1.5" />发布
                          </Button>
                        )}
                      </div>
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
