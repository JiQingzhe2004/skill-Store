import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { Request } from 'express'

import { AppException } from '../../common/exceptions/app.exception'
import { JwtUser } from '../../common/types/jwt-user'
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth.constants'
import { TokenService } from '../token.service'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtUser }>()
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE_NAME]

    if (!token) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', '登录状态已失效')
    }

    const user = await this.tokenService.verifyAccessToken(token)
    request.user = user

    return true
  }
}
