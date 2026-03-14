import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { Request } from 'express'

import { AppException } from '../../common/exceptions/app.exception'
import { JwtUser } from '../../common/types/jwt-user'
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth.constants'
import { TokenService } from '../token.service'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtUser }>()
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE_NAME]

    if (!token) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', '登录状态已失效')
    }

    const user = await this.tokenService.verifyAccessToken(token)

    // 实时检查封禁状态
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { isBanned: true, bannedUntil: true, banReason: true },
    })
    if (dbUser?.isBanned) {
      const until = dbUser.bannedUntil
      if (!until || until > new Date()) {
        const untilStr = until ? `（解封时间：${until.toLocaleString('zh-CN')}）` : '（永久封禁）'
        const reason = dbUser.banReason ? ` 原因：${dbUser.banReason}` : ''
        throw new AppException(HttpStatus.FORBIDDEN, 'USER_BANNED', `账号已被封禁${untilStr}${reason}`)
      }
      // 到期自动解封
      await this.prisma.user.update({
        where: { id: user.sub },
        data: { isBanned: false, bannedUntil: null, banReason: null },
      })
    }

    request.user = user
    return true
  }
}
