import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { SetupModule } from './setup/setup.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    SetupModule,
  ],
})
export class SetupAppModule {}
