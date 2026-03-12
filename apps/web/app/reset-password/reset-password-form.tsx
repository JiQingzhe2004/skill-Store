'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, ResetPasswordFormValues } from '@skill-store/shared'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { AuthCard } from '../../components/auth-card'
import { FormField } from '../../components/form-field'
import { apiRequest, getErrorMessage } from '../../lib/api'

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

    setSuccessMessage(payload.data?.message ?? '密码重置成功')
  })

  return (
    <AuthCard
      title="重置密码"
      description="输入邮箱、验证码和新密码，完成密码重置。"
      links={[
        { href: '/forgot-password', label: '先获取验证码' },
        { href: '/login', label: '返回登录' },
      ]}
    >
      <form className="form-grid" onSubmit={onSubmit}>
        <FormField id="email" label="邮箱" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <FormField id="code" label="验证码" inputMode="numeric" error={errors.code?.message} {...register('code')} />
        <FormField
          id="password"
          label="新密码"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {errorMessage ? <div className="status-error">{errorMessage}</div> : null}
        {successMessage ? <div className="status-success">{successMessage}</div> : null}

        <div className="actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '重置密码'}
          </button>
          <Link href="/login">返回登录</Link>
        </div>
      </form>
    </AuthCard>
  )
}
