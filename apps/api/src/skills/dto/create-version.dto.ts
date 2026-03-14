import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class CreateVersionDto {
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '版本号必须是语义化版本，例如 1.0.0' })
  version: string

  @IsString()
  @MinLength(10)
  content: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  changelog?: string
}
