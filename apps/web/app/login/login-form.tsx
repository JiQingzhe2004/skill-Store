'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AuthUser, loginSchema, LoginFormValues } from '@skill-store/shared'
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

export function LoginForm() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('')

    const payload = await apiRequest<{ user: AuthUser; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(values),
    })

    if (!payload.success) {
      setErrorMessage(getErrorMessage(payload))
      return
    }

    router.push('/dashboard')
    router.refresh()
  })

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card size="sm" className="border-border/60 bg-background/95 shadow-lg backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{messages.common.brandAuth}</Badge>
            </div>
            <CardTitle className="text-2xl">{messages.login.title}</CardTitle>
            <CardDescription className="leading-6">{messages.login.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">{messages.common.email}</Label>
                <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email?.message)} {...register('email')} />
                {errors.email?.message ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{messages.common.password}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? messages.login.submitting : messages.login.submit}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-wrap justify-center gap-4 border-t pt-4 text-sm text-muted-foreground">
            <Link href="/register" className="transition-colors hover:text-foreground hover:underline">
              {messages.common.createAccount}
            </Link>
            <Link href="/forgot-password" className="transition-colors hover:text-foreground hover:underline">
              {messages.login.resetPassword}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
