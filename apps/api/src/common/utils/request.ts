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

// Normalize passwords to NFKC. Prevents fullwidth/halfwidth IME variants
// (e.g. `１２３` vs `123`) and combining-mark differences from causing
// register/login mismatches even when the user "typed the same thing".
export function normalizePassword(password: string): string {
  return String(password).normalize('NFKC')
}
