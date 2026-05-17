import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from '../prisma/prisma.module'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CookieService } from './cookie.service'
import { EmailCodeService } from './email-code.service'
import { PasswordService } from './password.service'
import { AccessTokenGuard } from './guards/access-token.guard'
import { RefreshTokenGuard } from './guards/refresh-token.guard'
import { TokenService } from './token.service'

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    EmailCodeService,
    CookieService,
    AccessTokenGuard,
    RefreshTokenGuard,
  ],
  exports: [TokenService, AccessTokenGuard],
})
export class AuthModule {}
