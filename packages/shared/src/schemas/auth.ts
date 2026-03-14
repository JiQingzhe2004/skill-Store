import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .min(1, '邮箱不能为空')
  .email('请输入有效邮箱')
  .transform((value) => value.toLowerCase())

export const usernameSchema = z
  .string()
  .trim()
  .min(2, '昵称至少 2 个字符')
  .max(32, '昵称最多 32 个字符')

export const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .max(64, '密码最多 64 位')
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, '密码至少包含 1 个字母和 1 个数字')

export const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, '验证码必须为 6 位数字')

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
})

export const resendVerificationCodeSchema = z.object({
  email: emailSchema,
})

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: codeSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密码不能为空'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: codeSchema,
  password: passwordSchema,
})

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export type RegisterFormValues = z.infer<typeof registerSchema>
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
