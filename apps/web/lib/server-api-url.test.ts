import { afterEach, describe, expect, it } from 'vitest'

import { buildServerApiUrl } from './server-api-url'

describe('buildServerApiUrl', () => {
  afterEach(() => {
    delete process.env.API_BASE_URL
  })

  it('uses browser host when API_BASE_URL is unset', () => {
    expect(buildServerApiUrl('localhost:3000', '/auth/me')).toBe(
      'http://localhost:3000/api/auth/me',
    )
  })

  it('uses API_BASE_URL when set (server-internal call)', () => {
    process.env.API_BASE_URL = 'http://api:3001'
    expect(buildServerApiUrl('localhost:4520', '/auth/me')).toBe(
      'http://api:3001/api/auth/me',
    )
  })

  it('prefixes /api when path omits it', () => {
    process.env.API_BASE_URL = 'http://api:3001'
    expect(buildServerApiUrl('localhost:4520', '/skills/mine')).toBe(
      'http://api:3001/api/skills/mine',
    )
  })
})
