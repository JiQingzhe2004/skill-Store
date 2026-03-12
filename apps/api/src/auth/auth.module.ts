import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CookieService } from './cookie.service'
import { EmailCodeService } from './email-code.service'
import { PasswordService } from './password.service'
import { AccessTokenGuard } from './guards/access-token.guard'
import { RefreshTokenGuard } from './guards/refresh-token.guard'
import { TokenService } from './token.service'

@Module({
  imports: [JwtModule.register({})],
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
})
export class AuthModule {}
