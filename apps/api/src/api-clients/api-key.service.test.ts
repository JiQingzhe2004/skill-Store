import { describe, expect, it } from 'vitest'

import { ApiKeyService } from './api-key.service'

describe('ApiKeyService', () => {
  const service = new ApiKeyService()

  it('generates keys with ssk_ prefix and stable hash', () => {
    const first = service.generate()
    expect(first.rawKey.startsWith('ssk_')).toBe(true)
    expect(first.keyPrefix).toBe(first.rawKey.slice(0, 12))
    expect(service.hash(first.rawKey)).toBe(first.apiKeyHash)
  })

  it('produces different keys each time', () => {
    const a = service.generate()
    const b = service.generate()
    expect(a.rawKey).not.toBe(b.rawKey)
  })
})
