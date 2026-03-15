'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Label } from '../../../../../components/ui/label'
import { Textarea } from '../../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card'
import { apiRequest, getErrorMessage } from '../../../../../lib/api'
import { getMessages, type Locale } from '../../../../../messages'

export function NewSkillForm() {
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const m = getMessages(locale as Locale)

  const schema = z.object({
    name: z.string().min(2, m.newSkill.nameMin).max(128),
    slug: z.string().min(2, m.newSkill.slugMin).max(128)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, m.newSkill.slugPattern),
    description: z.string().min(10, m.newSkill.descMin).max(512),
    tags: z.string().max(512).optional(),
    visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PUBLIC'),
  })
  type FormValues = z.infer<typeof schema>

  const [error, setError] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: 'PUBLIC' },
  })

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
    router.push(`/${locale}/dashboard/skills/${res.data?.id}`)
  })

  return (
    <Card className="border-border/60 bg-background/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5" />{m.newSkill.cardTitle}
        </CardTitle>
        <CardDescription>{m.newSkill.cardDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">{m.newSkill.nameLabel}</Label>
            <Input id="name" placeholder={m.newSkill.namePlaceholder}
              {...register('name', { onChange: handleNameChange })} aria-invalid={Boolean(errors.name)} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">{m.newSkill.slugLabel} <span className="text-muted-foreground text-xs">{m.newSkill.slugHint}</span></Label>
            <Input id="slug" placeholder={m.newSkill.slugPlaceholder}
              {...register('slug')} aria-invalid={Boolean(errors.slug)} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{m.newSkill.descLabel}</Label>
            <Textarea id="description" placeholder={m.newSkill.descPlaceholder} rows={3}
              {...register('description')} aria-invalid={Boolean(errors.description)} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">{m.newSkill.tagsLabel} <span className="text-muted-foreground text-xs">{m.newSkill.tagsHint}</span></Label>
            <Input id="tags" placeholder={m.newSkill.tagsPlaceholder} {...register('tags')} />
          </div>

          <div className="grid gap-2">
            <Label>{m.newSkill.visibilityLabel}</Label>
            <Select defaultValue="PUBLIC" onValueChange={(v) => setValue('visibility', v as FormValues['visibility'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent sideOffset={4} side="top">
                <SelectItem value="PUBLIC">{m.newSkill.visPublic}</SelectItem>
                <SelectItem value="UNLISTED">{m.newSkill.visUnlisted}</SelectItem>
                <SelectItem value="PRIVATE">{m.newSkill.visPrivate}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              <Sparkles className="w-4 h-4 mr-2" />
              {isSubmitting ? m.newSkill.submitting : m.newSkill.submit}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/dashboard/skills`}>
                <ArrowLeft className="w-4 h-4 mr-2" />{m.newSkill.back}
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
