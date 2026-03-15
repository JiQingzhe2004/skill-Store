'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Save, Send, Trash2, CheckCircle2, Clock, FileText, Code2, History, Info, Upload, FolderArchive } from 'lucide-react'

import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Label } from '../../../../../components/ui/label'
import { Textarea } from '../../../../../components/ui/textarea'
import { RichTextEditor } from '../../../../../components/rich-text-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { Badge } from '../../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../../components/ui/tabs'
import { apiRequest, getErrorMessage } from '../../../../../lib/api'
import { getMessages, type Locale } from '../../../../../messages'

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

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1
    if (pa[i] < pb[i]) return -1
  }
  return 0
}

function suggestNextVersion(versions: Version[]): string {
  if (versions.length === 0) return '1.0.0'
  const sorted = [...versions].sort((a, b) => compareSemver(b.version, a.version))
  const latest = sorted[0].version
  const parts = latest.split('.').map(Number)
  parts[2] += 1
  return parts.join('.')
}

export function SkillEditor({ skill, versions: initVersions, latestContent }: {
  skill: Skill
  versions: Version[]
  latestContent?: string
}) {
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const m = getMessages(locale as Locale)

  const infoSchema = z.object({
    name: z.string().min(2, m.skillEditor.nameMin).max(128),
    description: z.string().min(10, m.skillEditor.descMin).max(512),
    tags: z.string().max(512).optional(),
    visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']),
  })
  const contentSchema = z.object({
    content: z.string().min(10, m.skillEditor.contentMin),
  })
  type InfoValues = z.infer<typeof infoSchema>
  type ContentValues = z.infer<typeof contentSchema>

  const statusLabel: Record<string, string> = {
    DRAFT: m.mySkillsPage.statusDraft,
    PENDING_REVIEW: m.mySkillsPage.statusPendingReview,
    PUBLISHED: m.mySkillsPage.statusPublished,
    ARCHIVED: m.mySkillsPage.statusArchived,
    REJECTED: m.mySkillsPage.statusRejected,
  }
  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    DRAFT: 'outline', PENDING_REVIEW: 'secondary', PUBLISHED: 'default',
    ARCHIVED: 'outline', REJECTED: 'outline',
  }

  const [versions, setVersions] = useState(initVersions)
  const [infoMsg, setInfoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [contentMsg, setContentMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [zipMsg, setZipMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [zipUploading, setZipUploading] = useState(false)
  const [zipVersion, setZipVersion] = useState('')
  const [zipChangelog, setZipChangelog] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [publishMsg, setPublishMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const flash = (setter: typeof setInfoMsg, type: 'ok' | 'err', text: string) => {
    setter({ type, text })
    if (type === 'ok') setTimeout(() => setter(null), 3000)
  }

  const infoForm = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: skill.name, description: skill.description,
      tags: skill.tags, visibility: skill.visibility as InfoValues['visibility'],
    },
  })

  const tagsArray = skill.tags ? skill.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const defaultContent = latestContent || [
    `<h1>${skill.name}</h1>`,
    `<p>${skill.description}</p>`,
    tagsArray.length ? m.skillEditor.templateTags.replace('{tags}', tagsArray.join('、')) : '',
    m.skillEditor.templateFeature,
    m.skillEditor.templateUsage,
    m.skillEditor.templateExample,
    m.skillEditor.templateNotes,
  ].filter(Boolean).join('')

  const contentForm = useForm<ContentValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: { content: defaultContent },
  })

  const onUpdateInfo = infoForm.handleSubmit(async (values) => {
    setInfoMsg(null)
    const res = await apiRequest(`/skills/${skill.id}`, { method: 'PATCH', body: JSON.stringify(values) })
    if (!res.success) { flash(setInfoMsg, 'err', getErrorMessage(res)); return }
    flash(setInfoMsg, 'ok', m.settingsPage.saveSuccess)
  })

  const onSaveContent = contentForm.handleSubmit(async (values) => {
    setContentMsg(null)
    const nextVer = suggestNextVersion(versions)
    const res = await apiRequest<Version>(`/skills/${skill.id}/versions`, {
      method: 'POST',
      body: JSON.stringify({ version: nextVer, content: values.content, changelog: '' }),
    })
    if (!res.success) { flash(setContentMsg, 'err', getErrorMessage(res)); return }
    if (res.data) setVersions(prev => [res.data!, ...prev])
    flash(setContentMsg, 'ok', m.skillEditor.savedAs.replace('{version}', nextVer))
  })

  const onPublish = async (versionId: string) => {
    setPublishMsg(null)
    const res = await apiRequest(`/skills/${skill.id}/versions/${versionId}/publish`, { method: 'POST' })
    if (!res.success) { flash(setPublishMsg, 'err', getErrorMessage(res)); return }
    setVersions(prev => prev.map(v => v.id === versionId ? { ...v, publishedAt: new Date().toISOString() } : v))
    flash(setPublishMsg, 'ok', m.skillEditor.publishedSuccess)
  }

  const onUploadZip = async () => {
    if (!zipFile || !zipVersion) return
    setZipUploading(true); setZipMsg(null)
    const formData = new FormData()
    formData.append('file', zipFile)
    formData.append('version', zipVersion)
    if (zipChangelog) formData.append('changelog', zipChangelog)
    const res = await apiRequest(`/skills/${skill.id}/versions/upload`, { method: 'POST', body: formData })
    setZipUploading(false)
    if (!res.success) { flash(setZipMsg, 'err', getErrorMessage(res)); return }
    flash(setZipMsg, 'ok', m.skillEditor.zipSuccess.replace('{version}', zipVersion))
    setZipFile(null); setZipVersion(''); setZipChangelog('')
    const updated = await apiRequest<Version[]>(`/skills/${skill.id}/versions`)
    if (updated.success && updated.data) setVersions(updated.data)
  }

  const onDelete = async () => {
    if (!confirm(m.skillEditor.deleteConfirm.replace('{name}', skill.name))) return
    const res = await apiRequest(`/skills/${skill.id}`, { method: 'DELETE' })
    if (res.success) router.push(`/${locale}/dashboard/skills`)
  }

  const MsgBox = ({ msg }: { msg: { type: 'ok' | 'err'; text: string } | null }) => {
    if (!msg) return null
    return msg.type === 'ok'
      ? <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{msg.text}</AlertDescription></Alert>
      : <Alert variant="destructive"><AlertDescription>{msg.text}</AlertDescription></Alert>
  }

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="content">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/dashboard/skills`}><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{skill.name}</h1>
              <Badge variant={statusVariant[skill.status]}>{statusLabel[skill.status]}</Badge>
              {skill.latestVersion && <Badge variant="secondary" className="font-mono text-xs">v{skill.latestVersion}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground font-mono">{skill.slug}</p>
          </div>
        </div>
        <TabsList className="h-9">
          <TabsTrigger value="info" className="gap-1.5 text-xs"><Info className="w-3.5 h-3.5" />{m.skillEditor.tabInfo}</TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5 text-xs"><Code2 className="w-3.5 h-3.5" />{m.skillEditor.tabContent}</TabsTrigger>
          <TabsTrigger value="versions" className="gap-1.5 text-xs"><History className="w-3.5 h-3.5" />{m.skillEditor.tabVersions}{versions.length > 0 && ` (${versions.length})`}</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />{m.skillEditor.delete}
        </Button>
      </div>

        <TabsContent value="info">
          <Card className="border-border/60 bg-background/95">
            <CardHeader><CardTitle className="text-base">{m.skillEditor.editInfo}</CardTitle></CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={onUpdateInfo}>
                <div className="grid gap-2">
                  <Label>{m.skillEditor.nameLabel}</Label>
                  <Input {...infoForm.register('name')} aria-invalid={Boolean(infoForm.formState.errors.name)} />
                  {infoForm.formState.errors.name && <p className="text-xs text-destructive">{infoForm.formState.errors.name.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>{m.skillEditor.descLabel}</Label>
                  <Textarea rows={3} {...infoForm.register('description')} />
                  {infoForm.formState.errors.description && <p className="text-xs text-destructive">{infoForm.formState.errors.description.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>{m.skillEditor.tagsLabel} <span className="text-muted-foreground text-xs">{m.skillEditor.tagsHint}</span></Label>
                  <Input {...infoForm.register('tags')} />
                </div>
                <div className="grid gap-2">
                  <Label>{m.skillEditor.visibilityLabel}</Label>
                  <Select defaultValue={skill.visibility} onValueChange={(v) => infoForm.setValue('visibility', v as InfoValues['visibility'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent sideOffset={4} side="top">
                      <SelectItem value="PUBLIC">{m.skillEditor.visPublic}</SelectItem>
                      <SelectItem value="UNLISTED">{m.skillEditor.visUnlisted}</SelectItem>
                      <SelectItem value="PRIVATE">{m.skillEditor.visPrivate}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <MsgBox msg={infoMsg} />
                <Button type="submit" disabled={infoForm.formState.isSubmitting}>
                  {infoForm.formState.isSubmitting ? m.skillEditor.saving : m.skillEditor.saveChanges}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          {!latestContent && (
            <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription>{m.skillEditor.templateHint}</AlertDescription>
            </Alert>
          )}
          <Card className="border-border/60 bg-background/95">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Code2 className="w-4 h-4" />{m.skillEditor.editContent}</CardTitle>
              <CardDescription>
                {latestContent
                  ? m.skillEditor.contentDesc.replace('{version}', versions[0]?.version ?? '').replace('{next}', suggestNextVersion(versions))
                  : m.skillEditor.contentDescFirst.replace('{next}', suggestNextVersion(versions))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={onSaveContent}>
                <div className="grid gap-2">
                  <RichTextEditor
                    value={contentForm.watch('content')}
                    onChange={(html) => contentForm.setValue('content', html, { shouldValidate: true })}
                    placeholder={m.skillEditor.contentPlaceholder}
                    minHeight={480}
                  />
                  {contentForm.formState.errors.content && <p className="text-xs text-destructive">{contentForm.formState.errors.content.message}</p>}
                </div>
                <MsgBox msg={contentMsg} />
                <div className="flex gap-3">
                  <Button type="submit" disabled={contentForm.formState.isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {contentForm.formState.isSubmitting ? m.skillEditor.savingContent : m.skillEditor.saveAs.replace('{version}', suggestNextVersion(versions))}
                  </Button>
                  {versions.length > 0 && !versions[0].publishedAt && (
                    <Button type="button" variant="outline" onClick={() => onPublish(versions[0].id)}>
                      <Send className="w-4 h-4 mr-2" />{m.skillEditor.publishLatest}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/95 shadow-sm mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FolderArchive className="w-4 h-4" />{m.skillEditor.uploadZip}</CardTitle>
              <CardDescription>{m.skillEditor.uploadZipDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>{m.skillEditor.versionLabel} <span className="text-destructive">{m.skillEditor.versionRequired}</span></Label>
                    <Input placeholder={m.skillEditor.versionPlaceholder} value={zipVersion} onChange={e => setZipVersion(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{m.skillEditor.changelogLabel}</Label>
                    <Input placeholder={m.skillEditor.changelogPlaceholder} value={zipChangelog} onChange={e => setZipChangelog(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>{m.skillEditor.selectFile}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => document.getElementById('zip-upload')?.click()}>
                    {zipFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <FolderArchive className="w-4 h-4 text-primary" />
                        <span className="font-medium">{zipFile.name}</span>
                        <span className="text-muted-foreground">({(zipFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{m.skillEditor.selectFile}</p>
                      </div>
                    )}
                  </div>
                  <input id="zip-upload" type="file" accept=".zip" className="hidden" onChange={e => setZipFile(e.target.files?.[0] ?? null)} />
                </div>
                <MsgBox msg={zipMsg} />
                <Button onClick={onUploadZip} disabled={zipUploading || !zipFile || !zipVersion}>
                  {zipUploading
                    ? <><Upload className="w-3.5 h-3.5 mr-1.5 animate-pulse" />{m.skillEditor.uploading}</>
                    : <><Upload className="w-3.5 h-3.5 mr-1.5" />{m.skillEditor.uploadBtn}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          {versions.length === 0 ? (
            <Card className="border-border/60 bg-background/95">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                {m.skillEditor.noVersions}
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
                          ? <Badge variant="default" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />{m.skillEditor.versionPublished}</Badge>
                          : <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{m.skillEditor.versionDraft}</Badge>}
                        {i === 0 && <Badge variant="secondary" className="text-xs">{m.skillEditor.versionLatest}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString(locale)}</span>
                        {!v.publishedAt && (
                          <Button size="sm" onClick={() => onPublish(v.id)}>
                            <Send className="w-3.5 h-3.5 mr-1.5" />{m.skillEditor.publish}
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
