import { createHash, randomBytes } from 'node:crypto'

import { Injectable } from '@nestjs/common'

const KEY_PREFIX = 'ssk_'

@Injectable()
export class ApiKeyService {
  generate() {
    const secret = randomBytes(32).toString('base64url')
    const rawKey = `${KEY_PREFIX}${secret}`
    const displayPrefix = rawKey.slice(0, 12)
    return {
      rawKey,
      keyPrefix: displayPrefix,
      apiKeyHash: this.hash(rawKey),
    }
  }

  hash(rawKey: string) {
    return createHash('sha256').update(rawKey).digest('hex')
  }
}
