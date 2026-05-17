import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'

import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtUser } from '../common/types/jwt-user'
import { getClientIp } from '../common/utils/request'
import { RateLimitService } from '../rate-limit/rate-limit.service'
import { AuthService } from './auth.service'
import { CookieService } from './cookie.service'
import { AccessTokenGuard } from './guards/access-token.guard'
import { RefreshTokenGuard } from './guards/refresh-token.guard'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'

const ONE_MINUTE = 60 * 1000
const TEN_MINUTES = 10 * 60 * 1000

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Post('register')
  @HttpCode(200)
  async register(@Body() dto: RegisterDto, @Req() request: Request) {
    const ip = getClientIp(request)
    this.limitByEmail('register', dto.email, 1, ONE_MINUTE, 'RATE_LIMIT_EMAIL', '该邮箱请求过于频繁')
    this.limitByIp('register', ip, 5, TEN_MINUTES, 'RATE_LIMIT_IP', '注册请求过于频繁')

    return this.authService.register(dto)
  }

  @Post('resend-verification-code')
  @HttpCode(200)
  async resendVerificationCode(@Body() dto: ResendVerificationCodeDto, @Req() request: Request) {
    const ip = getClientIp(request)
    this.limitByEmail('resend', dto.email, 1, ONE_MINUTE, 'RATE_LIMIT_EMAIL', '该邮箱请求过于频繁')
    this.limitByIp('resend', ip, 5, TEN_MINUTES, 'RATE_LIMIT_IP', '验证码发送过于频繁')

    return this.authService.resendVerificationCode(dto)
  }

  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() request: Request) {
    const ip = getClientIp(request)
    this.limitByIp('verify-email', ip, 10, TEN_MINUTES, 'RATE_LIMIT_IP', '验证请求过于频繁')

    return this.authService.verifyEmail(dto)
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const ip = getClientIp(request)
    this.limitByIp('login', ip, 5, TEN_MINUTES, 'RATE_LIMIT_IP', '登录尝试过于频繁')

    const result = await this.authService.login(dto)
    this.cookieService.setAuthCookies(response, result.accessToken, result.refreshToken)

    return {
      user: result.user,
      message: '登录成功',
    }
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @CurrentUser() user: JwtUser,
  ) {
    const ip = getClientIp(request)
    this.limitByIp('refresh', ip, 30, ONE_MINUTE, 'RATE_LIMIT_IP', '刷新频率过高')

    const result = await this.authService.refresh(user)
    this.cookieService.setAuthCookies(response, result.accessToken, result.refreshToken)

    return {
      user: result.user,
      message: '刷新成功',
    }
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    this.cookieService.clearAuthCookies(response)

    return {
      message: '已退出登录',
    }
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(@CurrentUser() user: JwtUser) {
    return this.authService.getCurrentUser(user.sub)
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    const ip = getClientIp(request)
    this.limitByEmail('forgot-password', dto.email, 1, ONE_MINUTE, 'RATE_LIMIT_EMAIL', '该邮箱请求过于频繁')
    this.limitByIp('forgot-password', ip, 5, TEN_MINUTES, 'RATE_LIMIT_IP', '请求过于频繁')

    return this.authService.forgotPassword(dto)
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    const ip = getClientIp(request)
    this.limitByIp('reset-password', ip, 5, TEN_MINUTES, 'RATE_LIMIT_IP', '请求过于频繁')

    return this.authService.resetPassword(dto)
  }

  private limitByIp(
    action: string,
    ip: string,
    limit: number,
    windowMs: number,
    code: string,
    message: string,
  ) {
    this.rateLimitService.consume(`auth:${action}:ip:${ip}`, { limit, windowMs, code, message })
  }

  private limitByEmail(
    action: string,
    email: string,
    limit: number,
    windowMs: number,
    code: string,
    message: string,
  ) {
    this.rateLimitService.consume(`auth:${action}:email:${email.trim().toLowerCase()}`, {
      limit,
      windowMs,
      code,
      message,
    })
  }
}
