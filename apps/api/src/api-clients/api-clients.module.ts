import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'
import { ApiClientsController } from './api-clients.controller'
import { ApiClientsService } from './api-clients.service'
import { ApiKeyService } from './api-key.service'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ApiClientsController],
  providers: [ApiClientsService, ApiKeyService],
  exports: [ApiClientsService, ApiKeyService],
})
export class ApiClientsModule {}
