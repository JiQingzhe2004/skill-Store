'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  loginSchema, LoginFormValues,
  registerSchema, RegisterFormValues,
  forgotPasswordSchema, ForgotPasswordFormValues,
  resetPasswordSchema, ResetPasswordFormValues,
  verifyEmailSchema, VerifyEmailFormValues,
  AuthUser,
} from '@skill-store/shared'
import { LogIn, UserPlus, KeyRound, ShieldCheck, MailCheck, Mail, Lock, User, Hash, Send, RefreshCw } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { apiRequest, getErrorMessage } from '../lib/api'
import { messages } from '../messages'

export type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email'

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: AuthView
  defaultEmail?: string
}

export function AuthDialog({ open, onOpenChange, defaultView = 'login', defaultEmail = '' }: AuthDialogProps) {
  const [view, setView] = useState<AuthView>(defaultView)
  const [carryEmail, setCarryEmail] = useState(defaultEmail)

  useEffect(() => {
    if (open) {
      setView(defaultView)
      if (defaultEmail) setCarryEmail(defaultEmail)
    }
  }, [open, defaultView, defaultEmail])

  const handleSuccess = () => {
    onOpenChange(false)
  }

  const switchTo = (v: AuthView, email?: string) => {
    if (email) setCarryEmail(email)
    setView(v)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {view === 'login' && <LoginView onSuccess={handleSuccess} switchTo={switchTo} />}
        {view === 'register' && <RegisterView switchTo={switchTo} />}
        {view === 'forgot-password' && <ForgotPasswordView switchTo={switchTo} />}
        {view === 'reset-password' && <ResetPasswordView switchTo={switchTo} defaultEmail={carryEmail} />}
        {view === 'verify-email' && <VerifyEmailView onSuccess={handleSuccess} switchTo={switchTo} defaultEmail={carryEmail} />}
      </DialogContent>
    </Dialog>
  )
}

/* ─── Login ─── */
function LoginView({ onSuccess, switchTo }: { onSuccess: () => void; switchTo: (v: AuthView, email?: string) => void }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    const res = await apiRequest<{ user: AuthUser; message: string }>('/auth/login', { method: 'POST', body: JSON.stringify(values) })
    if (!res.success) {
      // 邮箱未验证 → 直接跳到验证页（带上邮箱）
      if (res.error?.code === 'EMAIL_NOT_VERIFIED') {
        switchTo('verify-email', getValues('email'))
        return
      }
      setError(getErrorMessage(res))
      return
    }
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
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('forgot-password')}><KeyRound className="w-3 h-3 mr-1" />{messages.login.resetPassword}</Button>
      </div>
    </>
  )
}

/* ─── Register ─── */
function RegisterView({ switchTo }: { switchTo: (v: AuthView, email?: string) => void }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', username: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(''); setSuccess('')
    const res = await apiRequest<{ email: string; message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(values) })
    if (!res.success) { setError(getErrorMessage(res)); return }
    setSuccess(res.data?.message ?? messages.register.successFallback)
    setTimeout(() => switchTo('verify-email', values.email.trim().toLowerCase()), 1200)
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
        {success && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{success}</AlertDescription></Alert>}
        <Button type="submit" className="w-full" disabled={isSubmitting}><UserPlus className="w-4 h-4 mr-2" />{isSubmitting ? messages.register.submitting : messages.register.submit}</Button>
      </form>
      <div className="flex justify-center gap-2 pt-2">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('login')}><LogIn className="w-3 h-3 mr-1" />{messages.register.alreadyHaveAccount}</Button>
      </div>
    </>
  )
}

/* ─── Forgot Password ─── */
function ForgotPasswordView({ switchTo }: { switchTo: (v: AuthView, email?: string) => void }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(''); setSuccess('')
    const res = await apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(values) })
    if (!res.success) { setError(getErrorMessage(res)); return }
    setSuccess(res.data?.message ?? messages.forgotPassword.successFallback)
    setTimeout(() => switchTo('reset-password', getValues('email')), 1500)
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" />{messages.forgotPassword.title}</DialogTitle>
        <DialogDescription>{messages.forgotPassword.description}</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="fp-email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.email}</Label>
          <Input id="fp-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{success}</AlertDescription></Alert>}
        <Button type="submit" className="w-full" disabled={isSubmitting}><Send className="w-4 h-4 mr-2" />{isSubmitting ? messages.forgotPassword.submitting : messages.forgotPassword.submit}</Button>
      </form>
      <div className="flex justify-center gap-2 pt-2">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('login')}><LogIn className="w-3 h-3 mr-1" />{messages.common.backToLogin}</Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('reset-password')}><ShieldCheck className="w-3 h-3 mr-1" />{messages.forgotPassword.alreadyHaveCode}</Button>
      </div>
    </>
  )
}

/* ─── Reset Password ─── */
function ResetPasswordView({ switchTo, defaultEmail = '' }: { switchTo: (v: AuthView) => void; defaultEmail?: string }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: defaultEmail, code: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(''); setSuccess('')
    const res = await apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(values) })
    if (!res.success) { setError(getErrorMessage(res)); return }
    setSuccess(res.data?.message ?? messages.resetPassword.successFallback)
    setTimeout(() => switchTo('login'), 1500)
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" />{messages.resetPassword.title}</DialogTitle>
        <DialogDescription>{messages.resetPassword.description}</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="rp-email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.email}</Label>
          <Input id="rp-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rp-code" className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.resetCode}</Label>
          <Input id="rp-code" inputMode="numeric" aria-invalid={Boolean(errors.code)} {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rp-password" className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.newPassword}</Label>
          <Input id="rp-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{success}</AlertDescription></Alert>}
        <Button type="submit" className="w-full" disabled={isSubmitting}><ShieldCheck className="w-4 h-4 mr-2" />{isSubmitting ? messages.resetPassword.submitting : messages.resetPassword.submit}</Button>
      </form>
      <div className="flex justify-center gap-2 pt-2">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('forgot-password')}><Send className="w-3 h-3 mr-1" />{messages.resetPassword.getCodeFirst}</Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('login')}><LogIn className="w-3 h-3 mr-1" />{messages.common.backToLogin}</Button>
      </div>
    </>
  )
}

/* ─── Verify Email ─── */
function VerifyEmailView({ switchTo, defaultEmail = '' }: { onSuccess: () => void; switchTo: (v: AuthView, email?: string) => void; defaultEmail?: string }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: defaultEmail, code: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(''); setSuccess(''); setResendMsg('')
    const res = await apiRequest<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify(values) })
    if (!res.success) { setError(getErrorMessage(res)); return }
    setSuccess(res.data?.message ?? messages.verifyEmail.successFallback)
    setTimeout(() => switchTo('login'), 1500)
  })

  const onResend = async () => {
    setError(''); setResendMsg('')
    const res = await apiRequest<{ message: string }>('/auth/resend-verification-code', { method: 'POST', body: JSON.stringify({ email: getValues('email') }) })
    if (!res.success) { setError(getErrorMessage(res)); return }
    setResendMsg(res.data?.message ?? messages.verifyEmail.resendSuccessFallback)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><MailCheck className="w-5 h-5" />{messages.verifyEmail.title}</DialogTitle>
        <DialogDescription>{messages.verifyEmail.description}</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="ve-email" className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.email}</Label>
          <Input id="ve-email" type="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ve-code" className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-muted-foreground" />{messages.common.verificationCode}</Label>
          <Input id="ve-code" inputMode="numeric" aria-invalid={Boolean(errors.code)} {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{success}</AlertDescription></Alert>}
        {resendMsg && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"><AlertDescription>{resendMsg}</AlertDescription></Alert>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="flex-1" disabled={isSubmitting}><MailCheck className="w-4 h-4 mr-2" />{isSubmitting ? messages.verifyEmail.submitting : messages.verifyEmail.submit}</Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onResend} disabled={isSubmitting}><RefreshCw className="w-4 h-4 mr-2" />{messages.verifyEmail.resend}</Button>
        </div>
      </form>
      <div className="flex justify-center gap-2 pt-2">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('register')}><UserPlus className="w-3 h-3 mr-1" />{messages.verifyEmail.backToRegister}</Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => switchTo('login')}><LogIn className="w-3 h-3 mr-1" />{messages.verifyEmail.goToLogin}</Button>
      </div>
    </>
  )
}
