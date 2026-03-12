'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, ForgotPasswordFormValues } from '@skill-store/shared'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { AuthCard } from '../../components/auth-card'
import { FormField } from '../../components/form-field'
import { apiRequest, getErrorMessage } from '../../lib/api'

export function ForgotPasswordForm() {
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('')
    setSuccessMessage('')
    const payload = await apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(values),
    })

    if (!payload.success) {
      setErrorMessage(getErrorMessage(payload))
      return
    }

    setSuccessMessage(payload.data?.message ?? '重置验证码已发送')
  })

  return (
    <AuthCard
      title="找回密码"
      description="输入注册邮箱，系统会发送重置验证码。"
      links={[
        { href: '/login', label: '返回登录' },
        { href: '/reset-password', label: '已有验证码？去重置密码' },
      ]}
    >
      <form className="form-grid" onSubmit={onSubmit}>
        <FormField id="email" label="邮箱" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />

        {errorMessage ? <div className="status-error">{errorMessage}</div> : null}
        {successMessage ? <div className="status-success">{successMessage}</div> : null}

        <div className="actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '发送中...' : '发送重置验证码'}
          </button>
        </div>
      </form>
    </AuthCard>
  )
}
