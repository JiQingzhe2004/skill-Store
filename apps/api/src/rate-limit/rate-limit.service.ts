import { HttpStatus, Injectable } from '@nestjs/common'

import { AppException } from '../common/exceptions/app.exception'

type WindowConfig = {
  limit: number
  windowMs: number
  code: string
  message: string
}

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, number[]>()

  consume(key: string, config: WindowConfig) {
    const now = Date.now()
    const current = this.buckets.get(key) ?? []
    const validTimestamps = current.filter((timestamp) => now - timestamp < config.windowMs)

    if (validTimestamps.length >= config.limit) {
      throw new AppException(HttpStatus.TOO_MANY_REQUESTS, config.code, config.message)
    }

    validTimestamps.push(now)
    this.buckets.set(key, validTimestamps)
  }
}
