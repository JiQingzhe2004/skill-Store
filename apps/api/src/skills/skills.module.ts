import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { SkillsController } from './skills.controller'
import { SkillsService } from './skills.service'
import { ZipService } from './zip.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, AuthModule, MulterModule.register({ storage: undefined })],
  controllers: [SkillsController],
  providers: [SkillsService, ZipService],
  exports: [SkillsService],
})
export class SkillsModule {}
