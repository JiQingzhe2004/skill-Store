import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import configuration from './config/configuration'
import { validateEnv } from './config/validate-env'
import { AuthModule } from './auth/auth.module'
import { SkillsModule } from './skills/skills.module'
import { UsersModule } from './users/users.module'
import { AdminModule } from './admin/admin.module'
import { ApiClientsModule } from './api-clients/api-clients.module'
import { PublicApiModule } from './public-api/public-api.module'
import { MailerModule } from './mailer/mailer.module'
import { PrismaModule } from './prisma/prisma.module'
import { RateLimitModule } from './rate-limit/rate-limit.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    MailerModule,
    RateLimitModule,
    AuthModule,
    SkillsModule,
    UsersModule,
    AdminModule,
    ApiClientsModule,
    PublicApiModule,
  ],
})
export class AppModule {}
