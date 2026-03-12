'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterFormValues } from '@skill-store/shared'
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

export function RegisterForm() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('')
    setSuccessMessage('')

    const payload = await apiRequest<{ email: string; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(values),
    })

    if (!payload.success) {
      setErrorMessage(getErrorMessage(payload))
      return
    }

    setSuccessMessage(payload.data?.message ?? messages.register.successFallback)
    router.push(`/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`)
  })

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card size="sm" className="border-border/60 bg-background/95 shadow-lg backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{messages.common.brandAuth}</Badge>
            </div>
            <CardTitle className="text-2xl">{messages.register.title}</CardTitle>
            <CardDescription className="leading-6">{messages.register.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">{messages.common.email}</Label>
                <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email?.message)} {...register('email')} />
                {errors.email?.message ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">{messages.common.username}</Label>
                <Input id="username" autoComplete="username" aria-invalid={Boolean(errors.username?.message)} {...register('username')} />
                {errors.username?.message ? <p className="text-xs text-destructive">{errors.username.message}</p> : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{messages.common.password}</Label>
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
                {isSubmitting ? messages.register.submitting : messages.register.submit}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-wrap justify-center gap-4 border-t pt-4 text-sm text-muted-foreground">
            <Link href="/login" className="transition-colors hover:text-foreground hover:underline">
              {messages.register.alreadyHaveAccount}
            </Link>
            <Link href="/forgot-password" className="transition-colors hover:text-foreground hover:underline">
              {messages.common.forgotPassword}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
