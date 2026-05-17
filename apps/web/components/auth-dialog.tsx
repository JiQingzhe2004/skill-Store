'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  loginSchema, LoginFormValues,
  registerSchema, RegisterFormValues,
  AuthUser,
} from '@skill-store/shared'
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { apiRequest, getErrorMessage } from '../lib/api'
import { messages } from '../messages'

export type AuthView = 'login' | 'register'

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: AuthView
  defaultEmail?: string
}

export function AuthDialog({ open, onOpenChange, defaultView = 'login', defaultEmail = '' }: AuthDialogProps) {
  const [view, setView] = useState<AuthView>(defaultView)

  useEffect(() => {
    if (open) {
      setView(defaultView)
    }
  }, [open, defaultView, defaultEmail])

  const handleSuccess = () => {
    onOpenChange(false)
  }

  const switchTo = (v: AuthView) => setView(v)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {view === 'login' && <LoginView onSuccess={handleSuccess} switchTo={switchTo} />}
        {view === 'register' && <RegisterView onSuccess={handleSuccess} switchTo={switchTo} />}
      </DialogContent>
    </Dialog>
  )
}

/* ─── Login ─── */
function LoginView({ onSuccess, switchTo }: { onSuccess: () => void; switchTo: (v: AuthView) => void }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    const res = await apiRequest<{ user: AuthUser; message: string }>('/auth/login', { method: 'POST', body: JSON.stringify(values) })
    if (!res.success) { setError(getErrorMessage(res)); return }
    router.refresh()
    onSuccess()
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><LogIn className="w-5 h-5" />{messages.login.title}</DialogTitle>
        <DialogDescription>{messages.login.description}</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="login-email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.email}</Label>
          <Input id="login-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="login-password" className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.password}</Label>
          <Input id="login-password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <Button type="submit" className="w-full" disabled={isSubmitting}><LogIn className="w-4 h-4 mr-2" />{isSubmitting ? messages.login.submitting : messages.login.submit}</Button>
      </form>
      <div className="flex justify-center gap-2 pt-2">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('register')}><UserPlus className="w-3 h-3 mr-1" />{messages.common.createAccount}</Button>
      </div>
    </>
  )
}

/* ─── Register ─── */
function RegisterView({ onSuccess, switchTo }: { onSuccess: () => void; switchTo: (v: AuthView) => void }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', username: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    const res = await apiRequest<{ user: AuthUser; message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(values) })
    if (!res.success) { setError(getErrorMessage(res)); return }
    router.refresh()
    onSuccess()
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />{messages.register.title}</DialogTitle>
        <DialogDescription>{messages.register.description}</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="reg-email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.email}</Label>
          <Input id="reg-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reg-username" className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.username}</Label>
          <Input id="reg-username" autoComplete="username" placeholder="可使用中文，2-32 个字符" aria-invalid={Boolean(errors.username)} {...register('username')} />
          {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reg-password" className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.password}</Label>
          <Input id="reg-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <Button type="submit" className="w-full" disabled={isSubmitting}><UserPlus className="w-4 h-4 mr-2" />{isSubmitting ? messages.register.submitting : messages.register.submit}</Button>
      </form>
      <div className="flex justify-center gap-2 pt-2">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('login')}><LogIn className="w-3 h-3 mr-1" />{messages.register.alreadyHaveAccount}</Button>
      </div>
    </>
  )
}
