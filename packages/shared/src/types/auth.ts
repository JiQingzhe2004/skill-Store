export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export type AuthUser = {
  id: string
  email: string
  username: string
  role: UserRole
  avatar?: string | null
}

export type RegisterPayload = {
  email: string
  username: string
  password: string
}

export type LoginPayload = {
  email: string
  password: string
}
