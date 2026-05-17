import { HttpStatus, Injectable } from '@nestjs/common'
import { User, UserRole } from '@prisma/client'

import { AppException } from '../common/exceptions/app.exception'
import { JwtUser } from '../common/types/jwt-user'
import { normalizeEmail } from '../common/utils/request'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { PasswordService } from './password.service'
import { TokenService } from './token.service'

type PublicAuthUser = {
  id: string
  email: string
  username: string
  role: UserRole
  avatar?: string | null
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email)
    const existingUser = await this.prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      throw new AppException(HttpStatus.CONFLICT, 'EMAIL_ALREADY_REGISTERED', '该邮箱已注册')
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password)

    const user = await this.prisma.user.create({
      data: {
        email,
        username: dto.username.trim(),
        passwordHash,
        role: UserRole.USER,
      },
    })

    return this.buildAuthResult(user)
  }

  async login(dto: LoginDto) {
    const email = normalizeEmail(dto.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', '邮箱或密码错误')
    }

    const isPasswordValid = await this.passwordService.verifyPassword(dto.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', '邮箱或密码错误')
    }

    if (user.isBanned) {
      const until = user.bannedUntil
      if (!until || until > new Date()) {
        const untilStr = until ? `（解封时间：${until.toLocaleString('zh-CN')}）` : '（永久封禁）'
        const reason = user.banReason ? ` 原因：${user.banReason}` : ''
        throw new AppException(HttpStatus.FORBIDDEN, 'USER_BANNED', `账号已被封禁${untilStr}${reason}`)
      }
      await this.prisma.user.update({ where: { id: user.id }, data: { isBanned: false, bannedUntil: null, banReason: null } })
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    })

    return this.buildAuthResult(user)
  }

  async refresh(jwtUser: JwtUser) {
    const user = await this.prisma.user.findUnique({ where: { id: jwtUser.sub } })

    if (!user) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', '登录状态已失效')
    }

    return this.buildAuthResult(user)
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', '登录状态已失效')
    }

    return this.toPublicUser(user)
  }

  private async buildAuthResult(user: User) {
    const accessToken = await this.tokenService.signAccessToken(user)
    const refreshToken = await this.tokenService.signRefreshToken(user)

    return {
      accessToken,
      refreshToken,
      user: this.toPublicUser(user),
    }
  }

  private toPublicUser(user: User): PublicAuthUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar ?? null,
    }
  }
}
