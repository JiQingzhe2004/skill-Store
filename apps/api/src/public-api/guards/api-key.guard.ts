import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { Request } from 'express'

import { ApiClientsService } from '../../api-clients/api-clients.service'
import { AppException } from '../../common/exceptions/app.exception'
import { RateLimitService } from '../../rate-limit/rate-limit.service'
import { getClientIp } from '../../common/utils/request'
import { ApiClientContext } from '../types/api-client-context'

const API_KEY_HEADER = 'x-api-key'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiClientsService: ApiClientsService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { apiClient?: ApiClientContext }>()
    const rawKey = request.headers[API_KEY_HEADER]

    if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'API_KEY_REQUIRED', '请在请求头中提供 x-api-key')
    }

    const ip = getClientIp(request)
    this.rateLimitService.consume(`v1:ip:${ip}`, {
      limit: 60,
      windowMs: 60_000,
      code: 'RATE_LIMITED',
      message: '请求过于频繁，请稍后再试',
    })

    const client = await this.apiClientsService.findByRawKey(rawKey.trim())
    if (!client) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'API_KEY_INVALID', 'API Key 无效或已吊销')
    }

    this.rateLimitService.consume(`v1:key:${client.id}`, {
      limit: 120,
      windowMs: 60_000,
      code: 'RATE_LIMITED',
      message: 'API Key 请求过于频繁，请稍后再试',
    })

    request.apiClient = {
      id: client.id,
      ownerId: client.ownerId,
      name: client.name,
    }

    void this.apiClientsService.touchLastUsed(client.id)
    return true
  }
}
