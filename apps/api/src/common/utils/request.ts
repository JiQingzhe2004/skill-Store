import { Request } from 'express'

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for']

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() ?? request.ip ?? 'unknown'
  }

  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0] ?? request.ip ?? 'unknown'
  }

  return request.ip ?? 'unknown'
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
