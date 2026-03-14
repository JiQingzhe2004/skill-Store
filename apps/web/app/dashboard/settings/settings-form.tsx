'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, User } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { apiRequest, getErrorMessage } from '../../../lib/api'

type UserProfile = {
  id: string
  email: string
  username: string
  avatar: string | null
  bio: string | null
  role: string
  isEmailVerified: boolean
  createdAt: string
} | null

const schema = z.object({
  username: z.string().min(2, '昵称至少 2 个字符').max(32, '昵称最多 32 个字符'),
  bio: z.string().max(200, '简介最多 200 个字符').optional(),
})

type FormValues = z.infer<typeof schema>

export function SettingsForm({ profile }: { profile: UserProfile }) {
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

    // 5MB 限制
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('头像文件不能超过 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setAvatarError('请上传图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setAvatar(result)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setMsg(null)
    const res = await apiRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        username: values.username,
        bio: values.bio || undefined,
        avatar: avatar ?? undefined,
      }),
    })
    if (!res.success) {
      setMsg({ type: 'err', text: getErrorMessage(res) })
      return
    }
    setMsg({ type: 'ok', text: '✓ 保存成功' })
    setTimeout(() => setMsg(null), 3000)
  })

  return (
    <div className="grid gap-6">
      {/* 头像 */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">头像</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatar ? (
                <img src={avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                更换头像
              </Button>
              {avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setAvatar(null)}
                >
                  移除头像
                </Button>
              )}
              <p className="text-xs text-muted-foreground">支持 JPG、PNG、GIF，最大 5MB</p>
            </div>
          </div>
          {avatarError && (
            <p className="text-xs text-destructive mt-2">{avatarError}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </CardContent>
      </Card>

      {/* 基本信息 */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label>邮箱</Label>
              <Input value={profile?.email ?? ''} disabled className="text-muted-foreground" />
            </div>
            <div className="grid gap-2">
              <Label>昵称</Label>
              <Input {...form.register('username')} />
              {form.formState.errors.username && (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>简介 <span className="text-muted-foreground text-xs">（可选，最多 200 字）</span></Label>
              <Textarea rows={3} placeholder="介绍一下你自己..." {...form.register('bio')} />
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
              {form.formState.isSubmitting ? '保存中...' : '保存设置'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
