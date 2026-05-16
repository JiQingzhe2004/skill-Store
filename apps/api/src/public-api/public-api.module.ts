import { Module } from '@nestjs/common'

import { ApiClientsModule } from '../api-clients/api-clients.module'
import { PrismaModule } from '../prisma/prisma.module'
import { RateLimitModule } from '../rate-limit/rate-limit.module'
import { ApiKeyGuard } from './guards/api-key.guard'
import { PublicApiController } from './public-api.controller'
import { PublicApiService } from './public-api.service'

@Module({
  imports: [PrismaModule, ApiClientsModule, RateLimitModule],
  controllers: [PublicApiController],
  providers: [PublicApiService, ApiKeyGuard],
})
export class PublicApiModule {}
