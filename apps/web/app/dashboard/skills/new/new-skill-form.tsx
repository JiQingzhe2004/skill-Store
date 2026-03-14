'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import { apiRequest, getErrorMessage } from '../../../../lib/api'

const schema = z.object({
  name: z.string().min(2, '名称至少 2 个字符').max(128),
  slug: z.string()
    .min(2, 'slug 至少 2 个字符').max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能包含小写字母、数字和连字符'),
  description: z.string().min(10, '描述至少 10 个字符').max(512),
  tags: z.string().max(512).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PUBLIC'),
})

type FormValues = z.infer<typeof schema>

export function NewSkillForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: 'PUBLIC' },
  })

  // 自动从 name 生成 slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setValue('slug', slug)
  }

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    const res = await apiRequest<{ id: string }>('/skills', {
      method: 'POST',
      body: JSON.stringify(values),
    })
    if (!res.success) { setError(getErrorMessage(res)); return }
    router.push(`/dashboard/skills/${res.data?.id}`)
  })

  return (
    <Card className="border-border/60 bg-background/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5" />
          技能基本信息
        </CardTitle>
        <CardDescription>创建后可在详情页添加版本内容和发布</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">技能名称</Label>
            <Input
              id="name"
              placeholder="例如：GitHub Issues 助手"
              {...register('name', { onChange: handleNameChange })}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug <span className="text-muted-foreground text-xs">（唯一标识）</span></Label>
            <Input
              id="slug"
              placeholder="例如：github-issues-helper"
              {...register('slug')}
              aria-invalid={Boolean(errors.slug)}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="简短介绍这个技能的用途和功能..."
              rows={3}
              {...register('description')}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">标签 <span className="text-muted-foreground text-xs">（逗号分隔，可选）</span></Label>
            <Input
              id="tags"
              placeholder="例如：github,代码,效率"
              {...register('tags')}
            />
          </div>

          <div className="grid gap-2">
            <Label>可见性</Label>
            <Select
              defaultValue="PUBLIC"
              onValueChange={(v) => setValue('visibility', v as FormValues['visibility'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">公开 — 所有人可见</SelectItem>
                <SelectItem value="UNLISTED">隐藏 — 有链接可访问，需 API Key</SelectItem>
                <SelectItem value="PRIVATE">私有 — 仅自己可见</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              <Sparkles className="w-4 h-4 mr-2" />
              {isSubmitting ? '创建中...' : '创建技能'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/skills">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
