export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum EmailCodePurpose {
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

export type AuthUser = {
  id: string
  email: string
  username: string
  role: UserRole
  isEmailVerified: boolean
}

export type RegisterPayload = {
  email: string
  username: string
  password: string
}

export type ResendVerificationCodePayload = {
  email: string
}

export type VerifyEmailPayload = {
  email: string
  code: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  email: string
  code: string
  password: string
}
