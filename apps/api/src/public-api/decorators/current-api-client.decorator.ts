import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

import { ApiClientContext } from '../types/api-client-context'

export const CurrentApiClient = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ApiClientContext => {
    const request = ctx.switchToHttp().getRequest<Request & { apiClient: ApiClientContext }>()
    return request.apiClient
  },
)
