import { HttpStatus, Injectable } from '@nestjs/common'
import { EmailCodePurpose, User, UserRole } from '@prisma/client'

import { AppException } from '../common/exceptions/app.exception'
import { JwtUser } from '../common/types/jwt-user'
import { normalizeEmail } from '../common/utils/request'
import { MailerService } from '../mailer/mailer.service'
import { PrismaService } from '../prisma/prisma.service'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { EmailCodeService } from './email-code.service'
import { PasswordService } from './password.service'
import { TokenService } from './token.service'

type PublicAuthUser = {
  id: string
  email: string
  username: string
  role: UserRole
  isEmailVerified: boolean
  avatar?: string | null
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly emailCodeService: EmailCodeService,
    private readonly mailerService: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email)
    const existingUser = await this.prisma.user.findUnique({ where: { email } })

    if (existingUser?.isEmailVerified) {
      throw new AppException(HttpStatus.CONFLICT, 'EMAIL_ALREADY_REGISTERED', '该邮箱已注册')
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password)

    const user = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            username: dto.username.trim(),
            passwordHash,
          },
        })
      : await this.prisma.user.create({
          data: {
            email,
            username: dto.username.trim(),
            passwordHash,
            role: UserRole.USER,
          },
        })

    const code = await this.emailCodeService.createCode(user.id, EmailCodePurpose.REGISTER)

    await this.mailerService.sendCodeEmail({
      to: user.email,
      code,
      purpose: EmailCodePurpose.REGISTER,
    })

    return {
      email: user.email,
      message: '验证码已发送',
    }
  }

  async resendVerificationCode(dto: ResendVerificationCodeDto) {
    const email = normalizeEmail(dto.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (user && !user.isEmailVerified) {
      const code = await this.emailCodeService.createCode(user.id, EmailCodePurpose.REGISTER)

      await this.mailerService.sendCodeEmail({
        to: user.email,
        code,
        purpose: EmailCodePurpose.REGISTER,
      })
    }

    return {
      message: '如果该邮箱需要验证，验证码已发送',
    }
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = normalizeEmail(dto.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'CODE_INVALID', '验证码无效')
    }

    if (user.isEmailVerified) {
      return {
        message: '邮箱已验证',
      }
    }

    await this.emailCodeService.consumeCode(user.id, EmailCodePurpose.REGISTER, dto.code)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
      },
    })

    return {
      message: '邮箱验证成功',
    }
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

    if (!user.isEmailVerified) {
      throw new AppException(HttpStatus.FORBIDDEN, 'EMAIL_NOT_VERIFIED', '请先完成邮箱验证')
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

    if (!user.isEmailVerified) {
      throw new AppException(HttpStatus.FORBIDDEN, 'EMAIL_NOT_VERIFIED', '请先完成邮箱验证')
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = normalizeEmail(dto.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (user) {
      const code = await this.emailCodeService.createCode(user.id, EmailCodePurpose.RESET_PASSWORD)

      await this.mailerService.sendCodeEmail({
        to: user.email,
        code,
        purpose: EmailCodePurpose.RESET_PASSWORD,
      })
    }

    return {
      message: '如果该邮箱存在，重置验证码已发送',
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = normalizeEmail(dto.email)
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'CODE_INVALID', '验证码无效')
    }

    await this.emailCodeService.consumeCode(user.id, EmailCodePurpose.RESET_PASSWORD, dto.code)

    const passwordHash = await this.passwordService.hashPassword(dto.password)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
      },
    })

    return {
      message: '密码重置成功',
    }
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
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar ?? null,
    }
  }
}
