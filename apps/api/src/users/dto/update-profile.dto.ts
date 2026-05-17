import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '昵称至少 2 个字符' })
  @MaxLength(32, { message: '昵称最多 32 个字符' })
  username?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string
}
