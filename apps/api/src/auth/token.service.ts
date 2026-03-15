import { HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { User, UserRole } from '@prisma/client'

import { AppException } from '../common/exceptions/app.exception'
import { JwtUser } from '../common/types/jwt-user'

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>) {
    return this.jwtService.signAsync(this.createPayload(user, 'access'), {
      secret: this.configService.getOrThrow<string>('jwtAccessSecret'),
      expiresIn: '365d', // 1 年
    })
  }

  signRefreshToken(user: Pick<User, 'id' | 'email' | 'role'>) {
    return this.jwtService.signAsync(this.createPayload(user, 'refresh'), {
      secret: this.configService.getOrThrow<string>('jwtRefreshSecret'),
      expiresIn: '365d', // 1 年
    })
  }

  async verifyAccessToken(token: string) {
    return this.verify(token, 'access')
  }

  async verifyRefreshToken(token: string) {
    return this.verify(token, 'refresh')
  }

  private async verify(token: string, expectedType: 'access' | 'refresh'): Promise<JwtUser> {
    const secret =
      expectedType === 'access'
        ? this.configService.getOrThrow<string>('jwtAccessSecret')
        : this.configService.getOrThrow<string>('jwtRefreshSecret')

    try {
      const payload = await this.jwtService.verifyAsync<JwtUser>(token, { secret })

      if (payload.tokenType !== expectedType) {
        throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', '登录状态已失效')
      }

      return payload
    } catch {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', '登录状态已失效')
    }
  }

  private createPayload(
    user: Pick<User, 'id' | 'email' | 'role'>,
    tokenType: 'access' | 'refresh',
  ): JwtUser & { role: UserRole } {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType,
    }
  }
}
