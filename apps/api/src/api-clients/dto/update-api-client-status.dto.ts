import { ApiClientStatus } from '@prisma/client'
import { IsEnum } from 'class-validator'

export class UpdateApiClientStatusDto {
  @IsEnum(ApiClientStatus)
  status!: ApiClientStatus
}
