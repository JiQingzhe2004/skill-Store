'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { apiRequest } from '../../../lib/api'
import { getMessages, type Locale } from '../../../messages'

type SetupAdminFormProps = {
  locale: string
  setupConfigured: boolean
}

type AdminUser = {
  id: string
  username: string
  email: string
  role: string
}

export function SetupAdminForm({ locale, setupConfigured }: SetupAdminFormProps) {
  const router = useRouter()
  const m = getMessages(locale as Locale).adminSetup
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!setupConfigured) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">{m.notConfiguredTitle}</p>
        <p>{m.notConfiguredDesc}</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await apiRequest<AdminUser>('/admin/setup', {
      method: 'POST',
      body: JSON.stringify({ secret }),
    })

    setLoading(false)

    if (!res.success || !res.data) {
      setError(res.error?.message ?? '设置失败')
      return
    }

    setSuccess(true)
    router.refresh()
    setTimeout(() => {
      router.push(`/${locale}/admin`)
    }, 800)
  }

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
        {m.success}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="setup-secret">{m.secretLabel}</Label>
        <Input
          id="setup-secret"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={m.secretPlaceholder}
          required
        />
        <p className="text-xs text-muted-foreground">{m.envHint}</p>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading || !secret.trim()} className="w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {m.submitting}
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            {m.submit}
          </>
        )}
      </Button>
    </form>
  )
}
