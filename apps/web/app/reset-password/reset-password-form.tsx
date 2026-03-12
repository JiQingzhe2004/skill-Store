'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, ResetPasswordFormValues } from '@skill-store/shared'
import Link from 'next/link'
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

type ResetPasswordFormProps = {
  initialEmail?: string
}

export function ResetPasswordForm({ initialEmail = '' }: ResetPasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      code: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('')
    setSuccessMessage('')

    const payload = await apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(values),
    })

    if (!payload.success) {
      setErrorMessage(getErrorMessage(payload))
      return
    }

    setSuccessMessage(payload.data?.message ?? messages.resetPassword.successFallback)
  })

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card size="sm" className="border-border/60 bg-background/95 shadow-lg backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{messages.common.brandAuth}</Badge>
            </div>
            <CardTitle className="text-2xl">{messages.resetPassword.title}</CardTitle>
            <CardDescription className="leading-6">{messages.resetPassword.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">{messages.common.email}</Label>
                <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email?.message)} {...register('email')} />
                {errors.email?.message ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code">{messages.common.resetCode}</Label>
                <Input id="code" inputMode="numeric" aria-invalid={Boolean(errors.code?.message)} {...register('code')} />
                {errors.code?.message ? <p className="text-xs text-destructive">{errors.code.message}</p> : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{messages.common.newPassword}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password?.message)}
                  {...register('password')}
                />
                {errors.password?.message ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? messages.resetPassword.submitting : messages.resetPassword.submit}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-wrap justify-center gap-4 border-t pt-4 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="transition-colors hover:text-foreground hover:underline">
              {messages.resetPassword.getCodeFirst}
            </Link>
            <Link href="/login" className="transition-colors hover:text-foreground hover:underline">
              {messages.common.backToLogin}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
