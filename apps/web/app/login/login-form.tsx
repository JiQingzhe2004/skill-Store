'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AuthUser, loginSchema, LoginFormValues } from '@skill-store/shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { AuthCard } from '../../components/auth-card'
import { FormField } from '../../components/form-field'
import { apiRequest, getErrorMessage } from '../../lib/api'

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
    <AuthCard
      title="登录"
      description="使用邮箱和密码登录 Skill Store。"
      links={[
        { href: '/register', label: '没有账号？去注册' },
        { href: '/forgot-password', label: '忘记密码' },
      ]}
    >
      <form className="form-grid" onSubmit={onSubmit}>
        <FormField id="email" label="邮箱" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <FormField
          id="password"
          label="密码"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {errorMessage ? <div className="status-error">{errorMessage}</div> : null}

        <div className="actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录'}
          </button>
          <Link href="/forgot-password">忘记密码？</Link>
        </div>
      </form>
    </AuthCard>
  )
}
