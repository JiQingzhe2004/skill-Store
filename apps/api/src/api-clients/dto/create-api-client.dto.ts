import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateApiClientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string
}
