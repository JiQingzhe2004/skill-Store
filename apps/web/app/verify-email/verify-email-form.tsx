'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { verifyEmailSchema, VerifyEmailFormValues } from '@skill-store/shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Alert, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { apiRequest, getErrorMessage } from '../../lib/api'
import { messages } from '../../messages'

type VerifyEmailFormProps = {
  initialEmail?: string
}

export function VerifyEmailForm({ initialEmail = '' }: VerifyEmailFormProps) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: initialEmail,
      code: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('')
    setSuccessMessage('')
    setResendMessage('')

    const payload = await apiRequest<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(values),
    })

    if (!payload.success) {
      setErrorMessage(getErrorMessage(payload))
      return
    }

    setSuccessMessage(payload.data?.message ?? messages.verifyEmail.successFallback)
    router.push('/login')
  })

  const onResend = async () => {
    setErrorMessage('')
    setResendMessage('')
    setSuccessMessage('')

    const payload = await apiRequest<{ message: string }>('/auth/resend-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email: getValues('email') }),
    })

    if (!payload.success) {
      setErrorMessage(getErrorMessage(payload))
      return
    }

    setResendMessage(payload.data?.message ?? messages.verifyEmail.resendSuccessFallback)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card size="sm" className="border-border/60 bg-background/95 shadow-lg backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{messages.common.brandAuth}</Badge>
            </div>
            <CardTitle className="text-2xl">{messages.verifyEmail.title}</CardTitle>
            <CardDescription className="leading-6">{messages.verifyEmail.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">{messages.common.email}</Label>
                <Input id="email" type="email" aria-invalid={Boolean(errors.email?.message)} {...register('email')} />
                {errors.email?.message ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code">{messages.common.verificationCode}</Label>
                <Input id="code" inputMode="numeric" aria-invalid={Boolean(errors.code?.message)} {...register('code')} />
                {errors.code?.message ? <p className="text-xs text-destructive">{errors.code.message}</p> : null}
              </div>

              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              {successMessage ? (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              ) : null}

              {resendMessage ? (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <AlertDescription>{resendMessage}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? messages.verifyEmail.submitting : messages.verifyEmail.submit}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={onResend} disabled={isSubmitting}>
                  {messages.verifyEmail.resend}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-wrap justify-center gap-4 border-t pt-4 text-sm text-muted-foreground">
            <Link href="/register" className="transition-colors hover:text-foreground hover:underline">
              {messages.verifyEmail.backToRegister}
            </Link>
            <Link href="/login" className="transition-colors hover:text-foreground hover:underline">
              {messages.verifyEmail.goToLogin}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
