'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { verifyEmailSchema, VerifyEmailFormValues } from '@skill-store/shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { AuthCard } from '../../components/auth-card'
import { FormField } from '../../components/form-field'
import { apiRequest, getErrorMessage } from '../../lib/api'

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
    const payload = await apiRequest<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(values),
    })

    if (!payload.success) {
      setErrorMessage(getErrorMessage(payload))
      return
    }

    setSuccessMessage(payload.data?.message ?? '邮箱验证成功')
    router.push('/login')
  })

  const onResend = async () => {
    setErrorMessage('')
    setResendMessage('')
    const payload = await apiRequest<{ message: string }>('/auth/resend-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email: getValues('email') }),
    })

    if (!payload.success) {
      setErrorMessage(getErrorMessage(payload))
      return
    }

    setResendMessage(payload.data?.message ?? '验证码已重新发送')
  }

  return (
    <AuthCard
      title="验证邮箱"
      description="输入收到的 6 位验证码，完成账号激活。"
      links={[
        { href: '/register', label: '返回注册' },
        { href: '/login', label: '去登录' },
      ]}
    >
      <form className="form-grid" onSubmit={onSubmit}>
        <FormField id="email" label="邮箱" type="email" error={errors.email?.message} {...register('email')} />
        <FormField id="code" label="验证码" inputMode="numeric" error={errors.code?.message} {...register('code')} />

        {errorMessage ? <div className="status-error">{errorMessage}</div> : null}
        {successMessage ? <div className="status-success">{successMessage}</div> : null}
        {resendMessage ? <div className="status-success">{resendMessage}</div> : null}

        <div className="actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '验证中...' : '完成验证'}
          </button>
          <button className="secondary-button" type="button" onClick={onResend} disabled={isSubmitting}>
            重新发送验证码
          </button>
        </div>
      </form>
    </AuthCard>
  )
}
