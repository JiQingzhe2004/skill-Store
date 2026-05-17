'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { apiRequest, getErrorMessage } from '../../../../lib/api'
import { getMessages, type Locale } from '../../../../messages'

type UserProfile = {
  id: string
  email: string
  username: string
  avatar: string | null
  bio: string | null
  role: string
  createdAt: string
} | null

export function SettingsForm({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const m = getMessages(locale as Locale)

  const schema = z.object({
    username: z.string().min(2, m.settingsPage.usernameMin).max(32, m.settingsPage.usernameMax),
    bio: z.string().max(200, m.settingsPage.bioMax).optional(),
  })
  type FormValues = z.infer<typeof schema>

  const [avatar, setAvatar] = useState<string | null>(profile?.avatar ?? null)
  const [avatarError, setAvatarError] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: profile?.username ?? '',
      bio: profile?.bio ?? '',
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError('')
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(m.settingsPage.avatarSizeError)
      return
    }
    if (!file.type.startsWith('image/')) {
      setAvatarError(m.settingsPage.avatarTypeError)
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => { setAvatar(ev.target?.result as string) }
    reader.readAsDataURL(file)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setMsg(null)
    const res = await apiRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ username: values.username, bio: values.bio || undefined, avatar: avatar ?? undefined }),
    })
    if (!res.success) { setMsg({ type: 'err', text: getErrorMessage(res) }); return }
    setMsg({ type: 'ok', text: m.settingsPage.saveSuccess })
    setTimeout(() => setMsg(null), 3000)
    router.refresh()
  })

  return (
    <div className="grid gap-6">
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">{m.settingsPage.avatarCard}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatar ? (
                <img src={avatar} alt={m.settingsPage.avatarCard} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">{m.settingsPage.avatarHint}</p>
            {avatar && (
              <button type="button" className="text-xs text-destructive hover:underline" onClick={() => setAvatar(null)}>
                {m.settingsPage.removeAvatar}
              </button>
            )}
            {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">{m.settingsPage.basicInfo}</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label>{m.settingsPage.emailLabel}</Label>
              <Input value={profile?.email ?? ''} disabled className="text-muted-foreground" />
            </div>
            <div className="grid gap-2">
              <Label>{m.settingsPage.usernameLabel}</Label>
              <Input {...form.register('username')} />
              {form.formState.errors.username && (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>{m.settingsPage.bioLabel} <span className="text-muted-foreground text-xs">{m.settingsPage.bioHint}</span></Label>
              <Textarea rows={3} placeholder={m.settingsPage.bioPlaceholder} {...form.register('bio')} />
              {form.formState.errors.bio && (
                <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
              )}
            </div>
            {msg && (
              msg.type === 'ok'
                ? <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{msg.text}</AlertDescription></Alert>
                : <Alert variant="destructive"><AlertDescription>{msg.text}</AlertDescription></Alert>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? m.settingsPage.saving : m.settingsPage.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
