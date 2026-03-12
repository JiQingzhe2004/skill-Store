'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterFormValues } from '@skill-store/shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { AuthCard } from '../../components/auth-card'
import { FormField } from '../../components/form-field'
import { apiRequest, getErrorMessage } from '../../lib/api'

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

    setSuccessMessage(payload.data?.message ?? '验证码已发送')
    router.push(`/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`)
  })

  return (
    <AuthCard
      title="注册账号"
      description="先创建一个 Skill Store 账号，后续用邮箱验证码激活。"
      links={[
        { href: '/login', label: '已有账号？去登录' },
        { href: '/forgot-password', label: '忘记密码' },
      ]}
    >
      <form className="form-grid" onSubmit={onSubmit}>
        <FormField id="email" label="邮箱" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <FormField id="username" label="用户名" autoComplete="username" error={errors.username?.message} {...register('username')} />
        <FormField
          id="password"
          label="密码"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {errorMessage ? <div className="status-error">{errorMessage}</div> : null}
        {successMessage ? <div className="status-success">{successMessage}</div> : null}

        <div className="actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '注册并发送验证码'}
          </button>
          <Link href="/login">返回登录</Link>
        </div>
      </form>
    </AuthCard>
  )
}
